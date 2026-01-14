import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import styles from '../Dashboard.module.css'; // Reusing similar styles

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

interface Project {
    id: number;
    date: string;
    type: string;
    title: string;
    serialNumber?: string;
    amount: number;
    status: string;
    isInvoiceIssued: boolean;
    isPaymentReceived: boolean;
    paymentDate?: string;
}

interface CustomerStat {
    customerId: number;
    customerName: string;
    projects: Project[];
    totalAmount: number;
    unbilledAmount: number;
    unpaidAmount: number;
    count: number;
}

const SalesManagement = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [data, setData] = useState<CustomerStat[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);

    const fetchReport = React.useCallback(async () => {
        setLoading(true);
        setData([]); // Clear while loading
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/sales-management?year=${year}&month=${month}`);
            if (!response.ok) throw new Error('Failed to fetch data');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleProjectStatusChange = async (customerId: number, projectId: number, field: 'isInvoiceIssued' | 'isPaymentReceived', value: boolean) => {
        // 1. Optimistic Update
        setData(prevData => prevData.map(stat => {
            if (stat.customerId !== customerId) return stat;

            const updatedProjects = stat.projects.map(p =>
                p.id === projectId ? { ...p, [field]: value } : p
            );

            // Recalculate sums
            let unbilled = 0;
            let unpaid = 0;
            updatedProjects.forEach(p => {
                if (!p.isInvoiceIssued) unbilled += p.amount;
                if (p.isInvoiceIssued && !p.isPaymentReceived) unpaid += p.amount;
            });

            return { ...stat, projects: updatedProjects, unbilledAmount: unbilled, unpaidAmount: unpaid };
        }));

        try {
            // 2. API Call
            const payload = { [field]: value };
            const response = await fetch(`${API_BASE_URL}/projects/${projectId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Update failed');

        } catch (error) {
            console.error(error);
            alert('更新に失敗しました');
            fetchReport(); // Revert
        }
    };

    const handleBatchUpdate = async (customerId: number, field: 'isInvoiceIssued' | 'isPaymentReceived', value: boolean) => {
        if (!confirm(`${value ? '全て完了' : '全て未完了'}にしますか？`)) return;

        const customer = data.find(c => c.customerId === customerId);
        if (!customer) return;

        // Optimistic
        setData(prevData => prevData.map(stat => {
            if (stat.customerId !== customerId) return stat;
            const updatedProjects = stat.projects.map(p => ({ ...p, [field]: value }));
            // Recalculate sums
            let unbilled = 0;
            let unpaid = 0;
            updatedProjects.forEach(p => {
                if (!p.isInvoiceIssued) unbilled += p.amount;
                if (p.isInvoiceIssued && !p.isPaymentReceived) unpaid += p.amount;
            });

            return { ...stat, projects: updatedProjects, unbilledAmount: unbilled, unpaidAmount: unpaid };
        }));

        try {
            // Process sequentially or Promise.all. Sequential is safer for rate limits but slower.
            // Let's use Promise.all.
            const promises = customer.projects.map(p =>
                fetch(`${API_BASE_URL}/projects/${p.id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [field]: value })
                })
            );

            await Promise.all(promises);

        } catch (error) {
            console.error(error);
            alert('一部の更新に失敗した可能性があります');
            fetchReport();
        }
    };


    const toggleExpand = (customerId: number) => {
        setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
    };

    const handlePrevMonth = () => {
        if (month === 1) { setYear(y => y - 1); setMonth(12); }
        else { setMonth(m => m - 1); }
    };

    const handleNextMonth = () => {
        if (month === 12) { setYear(y => y + 1); setMonth(1); }
        else { setMonth(m => m + 1); }
    };

    // Calculate Grand Totals
    const totalSales = data.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalUnbilled = data.reduce((sum, item) => sum + item.unbilledAmount, 0);
    const totalUnpaid = data.reduce((sum, item) => sum + item.unpaidAmount, 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>売上・入金管理</h1>
                    <p className={styles.subtitle}>案件ごとの請求・入金状況を一元管理</p>
                </div>
                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <Button variant="ghost" onClick={handlePrevMonth} icon={<ChevronLeft size={18} />}>前月</Button>
                        <div style={{ padding: '0 1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {year}年 {month}月
                        </div>
                        <Button variant="ghost" onClick={handleNextMonth}>
                            翌月 <ChevronRight size={18} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        </Button>
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                {/* Summary Cards */}
                <div className={styles.summaryGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className={`${styles.card}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconWrapper} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                                <FileText size={24} />
                            </div>
                            <span className={styles.cardLabel}>当月売上総額 (請求予定)</span>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.value}>{formatCurrency(totalSales)}</div>
                        </div>
                    </div>

                    <div className={`${styles.card}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconWrapper} style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>
                                <AlertCircle size={24} />
                            </div>
                            <span className={styles.cardLabel}>未請求額</span>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.value} style={{ color: totalUnbilled > 0 ? '#ea580c' : 'inherit' }}>
                                {formatCurrency(totalUnbilled)}
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.card}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconWrapper} style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                                <CheckCircle size={24} />
                            </div>
                            <span className={styles.cardLabel}>請求済・未入金</span>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.value} style={{ color: totalUnpaid > 0 ? '#dc2626' : 'inherit' }}>
                                {formatCurrency(totalUnpaid)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main List */}
                <div className={styles.tableCard}>
                    <h2>得意先別 請求・入金状況</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>得意先名</th>
                                <th className={styles.right}>案件数</th>
                                <th className={styles.right}>売上合計</th>
                                <th className={styles.right}>未請求</th>
                                <th className={styles.right}>未入金</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        読み込み中...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        データがありません
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <React.Fragment key={item.customerId}>
                                        <tr
                                            onClick={() => toggleExpand(item.customerId)}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: expandedCustomer === item.customerId ? '#eff6ff' : undefined
                                            }}
                                        >
                                            <td style={{ fontWeight: 500 }}>{item.customerName}</td>
                                            <td className={styles.right}>{item.count} 件</td>
                                            <td className={styles.right} style={{ fontWeight: 'bold' }}>{formatCurrency(item.totalAmount)}</td>
                                            <td className={styles.right} style={{ color: item.unbilledAmount > 0 ? '#ea580c' : '#94a3b8' }}>
                                                {item.unbilledAmount > 0 ? formatCurrency(item.unbilledAmount) : '-'}
                                            </td>
                                            <td className={styles.right} style={{ color: item.unpaidAmount > 0 ? '#dc2626' : '#94a3b8' }}>
                                                {item.unpaidAmount > 0 ? formatCurrency(item.unpaidAmount) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                                                {expandedCustomer === item.customerId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </td>
                                        </tr>
                                        {expandedCustomer === item.customerId && (
                                            <tr className={styles.detailRow}>
                                                <td colSpan={6} style={{ padding: '0', borderBottom: '2px solid #e2e8f0' }}>
                                                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                            <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#475569' }}>
                                                                {item.customerName} の案件一覧
                                                            </h3>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <Button variant="outline" size="sm" onClick={() => handleBatchUpdate(item.customerId, 'isInvoiceIssued', true)}>
                                                                    全て請求済にする
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={() => handleBatchUpdate(item.customerId, 'isPaymentReceived', true)}>
                                                                    全て入金済にする
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                                            <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>完了日/登録日</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>件名 / S/N</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>金額</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>請求書発行</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>入金確認</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {item.projects.map((p) => (
                                                                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                            <td style={{ padding: '0.5rem' }}>{format(new Date(p.date), 'yyyy/MM/dd')}</td>
                                                                            <td style={{ padding: '0.5rem' }}>
                                                                                {p.title}
                                                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.serialNumber}</div>
                                                                            </td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(p.amount)}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={p.isInvoiceIssued}
                                                                                    onChange={(e) => handleProjectStatusChange(item.customerId, p.id, 'isInvoiceIssued', e.target.checked)}
                                                                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                                                />
                                                                            </td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={p.isPaymentReceived}
                                                                                    onChange={(e) => handleProjectStatusChange(item.customerId, p.id, 'isPaymentReceived', e.target.checked)}
                                                                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                                                />
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesManagement;
