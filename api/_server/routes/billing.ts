import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get Monthly Billing status and calculation for a customer
router.get('/customer/:customerId', async (req, res) => {
    try {
        const customerId = Number(req.params.customerId);
        const { year, month } = req.query;
        
        if (!year || !month) {
            return res.status(400).json({ error: 'Year and month are required' });
        }

        const targetYear = Number(year);
        const targetMonth = Number(month);

        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Determine closing dates
        // Let's assume standard closing is end of month if not specified or "99"
        let closingDay = 99;
        if (customer.closingDate && !isNaN(Number(customer.closingDate))) {
            closingDay = Number(customer.closingDate);
        }

        const getClosingDate = (y: number, m: number, day: number) => {
            if (day >= 28) {
                // End of month
                return new Date(y, m, 0, 23, 59, 59, 999);
            }
            return new Date(y, m - 1, day, 23, 59, 59, 999);
        };

        const currentClosingDate = getClosingDate(targetYear, targetMonth, closingDay);
        
        // Previous month calculation
        let prevYear = targetYear;
        let prevMonth = targetMonth - 1;
        if (prevMonth === 0) {
            prevYear--;
            prevMonth = 12;
        }
        
        const previousClosingDate = getClosingDate(prevYear, prevMonth, closingDay);
        const startDate = new Date(previousClosingDate.getTime() + 1);

        // Fetch previous billing
        const previousBilling = await prisma.monthlyBilling.findUnique({
            where: {
                customerId_year_month: {
                    customerId,
                    year: prevYear,
                    month: prevMonth
                }
            }
        });

        const previousBalance = previousBilling?.currentBilling || 0;

        // Fetch payments in period
        const payments = await prisma.payment.findMany({
            where: {
                customerId,
                paymentDate: {
                    gt: startDate,
                    lte: currentClosingDate
                }
            }
        });

        const paymentReceived = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const carryForward = Number(previousBalance) - paymentReceived;

        // Note: Actual sales calculation happens in PDF/UI. This endpoint returns the balance info.
        res.json({
            previousBalance: Number(previousBalance),
            paymentReceived,
            carryForward,
            startDate,
            currentClosingDate,
            payments
        });

    } catch (error) {
        console.error('Error fetching billing info:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register Payment
router.post('/payment', async (req, res) => {
    try {
        const { customerId, amount, paymentDate, method, notes } = req.body;

        if (!customerId || !amount || !paymentDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const payment = await prisma.payment.create({
            data: {
                customerId: Number(customerId),
                amount: Number(amount),
                paymentDate: new Date(paymentDate),
                method: method || null,
                notes: notes || null
            }
        });

        // 自動消込（入金額を使って古い未入金案件を「入金済」にする）
        const unpaidProjects = await prisma.project.findMany({
            where: {
                customerId: Number(customerId),
                isInvoiceIssued: true,
                isPaymentReceived: false
            },
            include: {
                details: true
            },
            orderBy: [
                { completionDate: 'asc' },
                { createdAt: 'asc' }
            ]
        });

        let remainingAmount = Number(amount);
        for (const project of unpaidProjects) {
            let taxableSubtotal = 0;
            project.details?.forEach(d => {
                if (!d.isTaxExempt && d.lineType !== 'padding') {
                    taxableSubtotal += (Number(d.quantity) * Number(d.unitPrice));
                }
            });
            const tax = Math.floor(taxableSubtotal * 0.1);
            const projectTotalWithTax = Number(project.totalAmount) + tax;

            // 案件の合計額を全額カバーできる場合のみ入金済とする（端数・部分入金は対象外とする）
            if (remainingAmount >= projectTotalWithTax && projectTotalWithTax > 0) {
                await prisma.project.update({
                    where: { id: project.id },
                    data: {
                        isPaymentReceived: true,
                        paymentDate: new Date(paymentDate)
                    }
                });
                remainingAmount -= projectTotalWithTax;
            }
        }

        res.json(payment);
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Payments for Customer
router.get('/payments/:customerId', async (req, res) => {
    try {
        const customerId = Number(req.params.customerId);
        const payments = await prisma.payment.findMany({
            where: { customerId },
            orderBy: { paymentDate: 'desc' }
        });
        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Total Unpaid Amount for Customer
router.get('/unpaid/:customerId', async (req, res) => {
    try {
        const customerId = Number(req.params.customerId);
        const unpaidProjects = await prisma.project.findMany({
            where: {
                customerId,
                isInvoiceIssued: true,
                isPaymentReceived: false
            },
            include: {
                details: true
            }
        });
        
        let totalUnpaid = 0;
        unpaidProjects.forEach(p => {
            let taxableSubtotal = 0;
            p.details?.forEach(d => {
                if (!d.isTaxExempt && d.lineType !== 'padding') {
                    taxableSubtotal += (Number(d.quantity) * Number(d.unitPrice));
                }
            });
            const tax = Math.floor(taxableSubtotal * 0.1);
            totalUnpaid += Number(p.totalAmount) + tax;
        });

        res.json({ unpaidAmount: totalUnpaid });
    } catch (error) {
        console.error('Error fetching unpaid amount:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete Payment
router.delete('/payment/:id', async (req, res) => {
    try {
        const paymentId = Number(req.params.id);
        await prisma.payment.delete({
            where: { id: paymentId }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
