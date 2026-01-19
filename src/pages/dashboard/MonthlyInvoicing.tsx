import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Printer, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import styles from '../Dashboard.module.css';
import { useAuth } from '../../contexts/AuthContext';

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
}

interface CustomerStat {
    customerId: number;
    customerName: string;
    closingDate?: string | null;
    monthlyStatus?: string;
    projects: Project[];
    totalAmount: number;
    unbilledAmount: number;
    unpaidAmount: number;
    count: number;
}

const MonthlyInvoicing = () => {
    const { session } = useAuth();
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [data, setData] = useState<CustomerStat[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedClosingDate, setSelectedClosingDate] = useState<string>('all');
    const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);
    const [isBatchIssuing, setIsBatchIssuing] = useState(false);

    const fetchReport = React.useCallback(async () => {
        setLoading(true);
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

    const handlePrevMonth = () => {
        if (month === 1) { setYear(y => y - 1); setMonth(12); }
        else { setMonth(m => m - 1); }
    };

    const handleNextMonth = () => {
        if (month === 12) { setYear(y => y + 1); setMonth(1); }
        else { setMonth(m => m + 1); }
    };

    const toggleExpand = (customerId: number) => {
        setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
    };

    const handleBatchIssue = async () => {
        if (!confirm(`${selectedClosingDate === '99' ? '末日' : selectedClosingDate + '日'}締めの請求書を一括発行（ステータス更新）しますか？`)) return;

        setIsBatchIssuing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/invoices/batch-issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ year, month, closingDate: selectedClosingDate })
            });

            if (res.ok) {
                alert('一括発行（ステータス更新）が完了しました。');
                fetchReport();

                // Batch Download
                if (confirm('続けて、すべての請求書をまとめて印刷（ダウンロード）しますか？')) {
                    try {
                        const downloadRes = await fetch(`${API_BASE_URL}/invoices/batch-pdf`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session?.access_token}`
                            },
                            body: JSON.stringify({ year, month, closingDate: selectedClosingDate })
                        });

                        if (downloadRes.ok) {
                            const blob = await downloadRes.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `invoices_${year}${month}_${selectedClosingDate}.zip`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                        } else {
                            alert('一括ダウンロードに失敗しました。対象データがない可能性があります。');
                        }
                    } catch (err) {
                        console.error(err);
                        alert('ダウンロード中にエラーが発生しました。');
                    }
                }
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            alert('一括発行に失敗しました');
        } finally {
            setIsBatchIssuing(false);
        }
    };

    const handleDownloadInvoice = async (projectId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Stop row toggle
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/pdf?type=invoice`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (!res.ok) throw new Error('Failed to download');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            // Fix for blank page: use <a> tag simulation
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice_${projectId}.pdf`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (e) {
            alert('請求書のダウンロードに失敗しました。ログイン状態を確認してください。');
        }
    };

    // Group data by closing date
    const groupedData = useMemo(() => {
        let filtered = data;
        if (selectedClosingDate !== 'all') {
            filtered = data.filter(c => {
                if (selectedClosingDate === 'others') {
                    // "Others" means unset or not 5, 10, 15, 20, 25, 99
                    return !['5', '10', '15', '20', '25', '99'].includes(c.closingDate || '');
                }
                return c.closingDate === selectedClosingDate;
            });
        }
        return filtered;
    }, [data, selectedClosingDate]);

    // Calculate totals for displayed data
    const totalAmount = groupedData.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalCount = groupedData.reduce((sum, item) => sum + item.count, 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>月次請求書発行</h1>
                    <p className={styles.subtitle}>顧客の締め日ごとに請求対象を確認・発行</p>
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
                {/* Closing Date Filter Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
                    {[
                        { id: 'all', label: '全て' },
                        { id: '5', label: '5日締め' },
                        { id: '10', label: '10日締め' },
                        { id: '15', label: '15日締め' },
                        { id: '20', label: '20日締め' },
                        { id: '25', label: '25日締め' },
                        { id: '99', label: '末日締め' },
                        { id: 'others', label: 'その他/未設定' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedClosingDate(tab.id)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '9999px',
                                border: '1px solid',
                                borderColor: selectedClosingDate === tab.id ? '#2563eb' : '#e2e8f0',
                                backgroundColor: selectedClosingDate === tab.id ? '#eff6ff' : 'white',
                                color: selectedClosingDate === tab.id ? '#2563eb' : '#64748b',
                                fontWeight: 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}

                    {selectedClosingDate !== 'all' && selectedClosingDate !== 'others' && (
                        <Button
                            onClick={handleBatchIssue}
                            disabled={isBatchIssuing || loading || groupedData.length === 0}
                            style={{ marginLeft: 'auto', backgroundColor: '#0f172a' }}
                            icon={<FileText size={18} />}
                        >
                            {isBatchIssuing ? '処理中...' : `${selectedClosingDate === '99' ? '末日' : selectedClosingDate + '日'}締め 請求確定 (一括)`}
                        </Button>
                    )}
                </div>

                <div className={styles.tableCard}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>請求対象一覧 ({groupedData.length}社 / {totalCount}件)</h2>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            合計: {formatCurrency(totalAmount)}
                        </div>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>顧客名</th>
                                <th>締め日</th>
                                <th className={styles.right}>案件数</th>
                                <th className={styles.right}>請求金額</th>
                                <th className={styles.right}>未請求額</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem' }}>
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : groupedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        データがありません
                                    </td>
                                </tr>
                            ) : (
                                groupedData.map((item) => (
                                    <React.Fragment key={item.customerId}>
                                        <tr
                                            onClick={() => toggleExpand(item.customerId)}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: expandedCustomer === item.customerId ? '#eff6ff' : undefined
                                            }}
                                        >
                                            <td style={{ fontWeight: 500 }}>{item.customerName}</td>
                                            <td>
                                                {item.closingDate === '99' ? '末日' : item.closingDate ? `${item.closingDate}日` : '-'}
                                                {item.monthlyStatus === 'issued' && (
                                                    <span style={{
                                                        display: 'inline-block',
                                                        marginLeft: '0.5rem',
                                                        padding: '2px 6px',
                                                        backgroundColor: '#dcfce7',
                                                        color: '#166534',
                                                        fontSize: '0.75rem',
                                                        borderRadius: '4px',
                                                        border: '1px solid #bbb'
                                                    }}>請求確定済</span>
                                                )}
                                            </td>
                                            <td className={styles.right}>{item.projects.length} 件</td>
                                            <td className={styles.right} style={{ fontWeight: 'bold' }}>{formatCurrency(item.totalAmount)}</td>
                                            <td className={styles.right} style={{ color: item.unbilledAmount > 0 ? '#ea580c' : '#94a3b8' }}>
                                                {item.unbilledAmount > 0 ? formatCurrency(item.unbilledAmount) : '-'}
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
                                                                {item.customerName} の案件明細
                                                            </h3>
                                                        </div>
                                                        <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                                            <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>日付</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>件名</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>金額</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>請求書</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {item.projects.map(p => (
                                                                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                            <td style={{ padding: '0.5rem' }}>{format(new Date(p.date), 'MM/dd')}</td>
                                                                            <td style={{ padding: '0.5rem' }}>{p.title}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(p.amount)}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                                <a
                                                                                    href="#"
                                                                                    onClick={(e) => handleDownloadInvoice(p.id, e)}
                                                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer' }}
                                                                                >
                                                                                    <Printer size={14} /> 発行
                                                                                </a>
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

export default MonthlyInvoicing;
