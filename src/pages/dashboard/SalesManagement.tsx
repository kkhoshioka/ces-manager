import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
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
    customerContactName?: string | null;
}

interface CustomerStat {
    customerId: number;
    customerName: string;
    projects: Project[];
    totalAmount: number;
    unbilledAmount: number;
    unpaidAmount: number;
    paidAmount?: number;
    count: number;
}

const SalesManagement = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [data, setData] = useState<CustomerStat[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<{ id: number, name: string, unpaidAmount: number } | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [paymentMethod, setPaymentMethod] = useState('振込');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [applyFeeAdjustment, setApplyFeeAdjustment] = useState(true);
    const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);
    const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<{ id: number, name: string } | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

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

    const handleBatchUpdate = async (customerId: number, field: 'isInvoiceIssued' | 'isPaymentReceived', value: boolean, skipConfirm: boolean = false) => {
        if (!skipConfirm && !confirm(`${value ? '全て完了' : '全て未完了'}にしますか？`)) return;

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


    const handleOpenPaymentModal = async (customerId: number, customerName: string, fallbackUnpaidAmount: number) => {
        setSelectedCustomerForPayment({ id: customerId, name: customerName, unpaidAmount: fallbackUnpaidAmount });
        setPaymentAmount('');
        setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
        setPaymentMethod('振込');
        setPaymentNotes('');
        setApplyFeeAdjustment(true);
        setIsPaymentModalOpen(true);

        try {
            const res = await fetch(`${API_BASE_URL}/billing/unpaid/${customerId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedCustomerForPayment(prev => prev ? { ...prev, unpaidAmount: data.unpaidAmount } : null);
            }
        } catch (e) {
            console.error('Failed to fetch total unpaid amount', e);
        }
    };

    const handleSavePayment = async () => {
        if (!selectedCustomerForPayment) return;
        const enteredAmount = Number(paymentAmount);
        if (!paymentAmount || isNaN(enteredAmount) || enteredAmount <= 0) {
            alert('有効な金額を入力してください');
            return;
        }

        const unpaidAmount = selectedCustomerForPayment.unpaidAmount;
        const difference = unpaidAmount - enteredAmount;
        const showFeeOption = enteredAmount > 0 && difference > 0 && difference <= 2000;
        const isAdjustingFee = showFeeOption && applyFeeAdjustment;

        const finalAmount = isAdjustingFee ? unpaidAmount : enteredAmount;
        const finalNotes = isAdjustingFee 
            ? `[振込手数料相殺: ${formatCurrency(difference)} (実入金: ${formatCurrency(enteredAmount)})]\n${paymentNotes}`.trim()
            : paymentNotes;

        try {
            const res = await fetch(`${API_BASE_URL}/billing/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: selectedCustomerForPayment.id,
                    amount: finalAmount,
                    paymentDate,
                    method: paymentMethod,
                    notes: finalNotes
                })
            });

            if (!res.ok) throw new Error('入金登録に失敗しました');

            alert('入金を登録しました');
            setIsPaymentModalOpen(false);
            fetchReport(); // Refresh data to show updated unpaid amounts if needed
        } catch (error) {
            console.error(error);
            alert('入金の登録に失敗しました');
        }
    };

    const handleOpenPaymentHistory = async (customerId: number, customerName: string) => {
        setSelectedCustomerForHistory({ id: customerId, name: customerName });
        setIsPaymentHistoryModalOpen(true);
        setLoadingHistory(true);
        try {
            const res = await fetch(`${API_BASE_URL}/billing/payments/${customerId}`);
            if (!res.ok) throw new Error('Failed to fetch payment history');
            const data = await res.json();
            setPaymentHistory(data);
        } catch (error) {
            console.error(error);
            alert('入金履歴の取得に失敗しました');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleDeletePayment = async (paymentId: number) => {
        if (!window.confirm('この入金履歴を削除してもよろしいですか？\n※注意：自動消込された案件の「入金済」チェックは元に戻りません。必要に応じて一覧画面から直接チェックを外してください。')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/billing/payment/${paymentId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete payment');
            
            setPaymentHistory(prev => prev.filter(p => p.id !== paymentId));
            fetchReport();
            alert('入金履歴を削除しました。');
        } catch (error) {
            console.error(error);
            alert('入金履歴の削除に失敗しました');
        }
    };

    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    const toggleExpand = (customerId: number) => {
        setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
    };

    const handleDownloadCustomerInvoice = async (customerId: number, customerName: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (downloadingId === customerId) return;

        setDownloadingId(customerId);
        try {
            const res = await fetch(`${API_BASE_URL}/invoices/customer-pdf?year=${year}&month=${month}&customerId=${customerId}`, {
                // Assuming session token is needed though not in useAuth block in this file initially. 
                // Wait, SalesManagement doesn't useAuth by default in the provided snippet? Let me check.
                // It seems to not have `session` imported. I will just do a standard fetch.
            });
            if (!res.ok) throw new Error('Failed to download');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            const filenameDate = `${year}${String(month).padStart(2, '0')}`;
            a.download = `請求書-${customerName} (${filenameDate}).pdf`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(() => window.URL.revokeObjectURL(url), 100);

            // Automatically check "Invoice Issued" for all projects of this customer
            await handleBatchUpdate(customerId, 'isInvoiceIssued', true, true);

        } catch (e) {
            alert('請求書のダウンロードに失敗しました。');
        } finally {
            setDownloadingId(null);
        }
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
                                <th className={styles.right} style={{ color: '#16a34a' }}>入金</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '2rem' }}>
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
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
                                            <td className={styles.right} style={{ color: (item.paidAmount || 0) > 0 ? '#16a34a' : '#94a3b8', fontWeight: (item.paidAmount || 0) > 0 ? 'bold' : 'normal' }}>
                                                {(item.paidAmount || 0) > 0 ? formatCurrency(item.paidAmount || 0) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                                                {expandedCustomer === item.customerId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </td>
                                        </tr>
                                        {expandedCustomer === item.customerId && (
                                            <tr className={styles.detailRow}>
                                                <td colSpan={7} style={{ padding: '0', borderBottom: '2px solid #e2e8f0' }}>
                                                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                            <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#475569' }}>
                                                                {item.customerName} の案件一覧
                                                            </h3>
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    onClick={() => handleOpenPaymentModal(item.customerId, item.customerName, item.unpaidAmount)}
                                                                >
                                                                    入金登録
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleOpenPaymentHistory(item.customerId, item.customerName)}
                                                                >
                                                                    入金履歴
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={downloadingId === item.customerId}
                                                                    onClick={(e) => handleDownloadCustomerInvoice(item.customerId, item.customerName, e)}
                                                                >
                                                                    {downloadingId === item.customerId ? '処理中...' : 'この顧客の請求書を発行 (当月合算)'}
                                                                </Button>
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
                                                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                            請求書発行
                                                                            <div style={{ fontSize: '0.65rem', fontWeight: 'normal', color: '#64748b' }}>発行済フラグ</div>
                                                                        </th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                            入金確認
                                                                            <div style={{ fontSize: '0.65rem', fontWeight: 'normal', color: '#64748b' }}>入金済フラグ</div>
                                                                        </th>
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

            {/* Payment Modal */}
            {isPaymentModalOpen && selectedCustomerForPayment && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '400px', maxWidth: '90%'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                            入金登録: {selectedCustomerForPayment.name}
                        </h2>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>入金日</label>
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>入金額 (円)</label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>入金方法</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            >
                                <option value="振込">振込</option>
                                <option value="現金">現金</option>
                                <option value="手形">手形</option>
                                <option value="その他">その他</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>備考</label>
                            <input
                                type="text"
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                placeholder="例: 10月分として"
                            />
                        </div>

                        {(() => {
                            const unpaid = selectedCustomerForPayment.unpaidAmount;
                            const entered = Number(paymentAmount);
                            const diff = unpaid - entered;
                            const showFee = entered > 0 && diff > 0 && diff <= 2000;
                            if (!showFee) return null;
                            return (
                                <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.375rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                                        <input type="checkbox" checked={applyFeeAdjustment} onChange={e => setApplyFeeAdjustment(e.target.checked)} style={{ marginTop: '0.2rem' }} />
                                        <span style={{ fontSize: '0.9rem', color: '#166534', lineHeight: 1.4 }}>
                                            差額の <b>{formatCurrency(diff)}</b> を振込手数料として処理し、<b>{formatCurrency(unpaid)}</b> の入金として全額自動消込する
                                        </span>
                                    </label>
                                </div>
                            );
                        })()}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>キャンセル</Button>
                            <Button variant="primary" onClick={handleSavePayment}>登録する</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment History Modal */}
            {isPaymentHistoryModalOpen && selectedCustomerForHistory && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '600px', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                                入金履歴: {selectedCustomerForHistory.name}
                            </h2>
                            <Button variant="ghost" onClick={() => setIsPaymentHistoryModalOpen(false)}>閉じる</Button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {loadingHistory ? (
                                <div style={{ padding: '2rem', textAlign: 'center' }}><LoadingSpinner /></div>
                            ) : paymentHistory.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>入金履歴がありません</div>
                            ) : (
                                <table className={styles.table} style={{ width: '100%', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>入金日</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>金額</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>方法</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>備考</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentHistory.map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '0.5rem' }}>{format(new Date(p.paymentDate), 'yyyy/MM/dd')}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(Number(p.amount))}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.method || '-'}</td>
                                                <td style={{ padding: '0.5rem' }}>{p.notes || '-'}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                    <Button variant="danger" size="sm" onClick={() => handleDeletePayment(p.id)}>
                                                        削除
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesManagement;
