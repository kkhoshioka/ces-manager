import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all travel expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await prisma.travelExpense.findMany({
            orderBy: { id: 'asc' }
        });
        res.json(expenses);
    } catch (error) {
        console.error('Failed to fetch travel expenses:', error);
        res.status(500).json({ error: 'Failed to fetch travel expenses' });
    }
});

// Create travel expense
router.post('/', async (req, res) => {
    try {
        const { area, fee, code } = req.body;
        const newExpense = await prisma.travelExpense.create({
            data: {
                area,
                fee: Number(fee) || 0,
                code: code || null
            }
        });
        res.status(201).json(newExpense);
    } catch (error) {
        console.error('Failed to create travel expense:', error);
        res.status(500).json({ error: 'Failed to create travel expense' });
    }
});

// Update travel expense
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { area, fee, code } = req.body;
        const updatedExpense = await prisma.travelExpense.update({
            where: { id: Number(id) },
            data: {
                area,
                fee: Number(fee) || 0,
                code: code || null
            }
        });
        res.json(updatedExpense);
    } catch (error) {
        console.error('Failed to update travel expense:', error);
        res.status(500).json({ error: 'Failed to update travel expense' });
    }
});

// Delete travel expense
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.travelExpense.delete({
            where: { id: Number(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete travel expense:', error);
        res.status(500).json({ error: 'Failed to delete travel expense' });
    }
});

export default router;
