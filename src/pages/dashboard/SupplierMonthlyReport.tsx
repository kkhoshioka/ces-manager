import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ChevronLeft, ChevronRight, FileText, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import styles from '../Dashboard.module.css';
import { formatCurrency } from '../../utils/formatting';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface SupplierCost {
    name: string;
    totalCost: number;
    count: number;
}

interface SupplierDetail {
    id: number;
    date: string;
    customerName: string;
    machineModel: string;
    serialNumber: string;
    description: string;
    quantity: number;
    unitCost: number;
    amount: number;
    isInvoiceReceived: boolean;
    isPaid: boolean;
}

const SupplierMonthlyReport = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [data, setData] = useState<SupplierCost[]>([]);
    const [loading, setLoading] = useState(false);

    // Drill-down state
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [detailData, setDetailData] = useState<SupplierDetail[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchReport = React.useCallback(async () => {
        setLoading(true);
        setSelectedSupplier(null); // Reset selection on month change
        setDetailData([]);
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/supplier-costs?year=${year}&month=${month}`);
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

    const handleDetailStatusChange = async (detailId: number, field: 'isInvoiceReceived' | 'isPaid', value: boolean) => {
        // Optimistic update
        setDetailData(prev => prev.map(item =>
            item.id === detailId ? { ...item, [field]: value } : item
        ));

        try {
            const currentItem = detailData.find(item => item.id === detailId);
            if (!currentItem) return;

            const payload = {
                isInvoiceReceived: field === 'isInvoiceReceived' ? value : currentItem.isInvoiceReceived,
                isPaid: field === 'isPaid' ? value : currentItem.isPaid
            };

            const response = await fetch(`${API_BASE_URL}/project-details/${detailId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to update status');

        } catch (error) {
            console.error(error);
            alert('ステータスの更新に失敗しました');
            fetchReport();
        }
    };

    const handleBatchStatusChange = async (targetItems: SupplierDetail[], field: 'isInvoiceReceived' | 'isPaid', value: boolean, label: string) => {
        if (!confirm(`${label} の全明細を「${field === 'isInvoiceReceived' ? '請求書受領済' : '支払済'}」に更新しますか？`)) return;
        
        setDetailLoading(true);
        try {
            await Promise.all(targetItems.map(async (item) => {
                if (item[field] === value) return;
                
                const payload = {
                    isInvoiceReceived: field === 'isInvoiceReceived' ? value : item.isInvoiceReceived,
                    isPaid: field === 'isPaid' ? value : item.isPaid
                };

                return fetch(`${API_BASE_URL}/project-details/${item.id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }));

            // Refresh details
            if (selectedSupplier) {
                const response = await fetch(`${API_BASE_URL}/dashboard/supplier-details?year=${year}&month=${month}&supplier=${encodeURIComponent(selectedSupplier)}`);
                if (response.ok) {
                    const result = await response.json();
                    const sorted = Array.isArray(result) 
                        ? [...result].sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''))
                        : [];
                    setDetailData(sorted);
                }
            }
        } catch (error) {
            console.error(error);
            alert('一括更新に失敗しました');
        } finally {
            setDetailLoading(true);
            setTimeout(() => setDetailLoading(false), 300);
        }
    };

    const handleRowClick = async (supplierName: string) => {
        if (selectedSupplier === supplierName) {
            setSelectedSupplier(null); // Toggle off
            return;
        }

        setSelectedSupplier(supplierName);
        setDetailLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/supplier-details?year=${year}&month=${month}&supplier=${encodeURIComponent(supplierName)}`);
            if (response.ok) {
                const result = await response.json();
                // Sort by customer name for better grouping
                const sorted = Array.isArray(result) 
                    ? [...result].sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''))
                    : [];
                setDetailData(sorted);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handlePrevMonth = () => {
        if (month === 1) {
            setYear(y => y - 1);
            setMonth(12);
        } else {
            setMonth(m => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setYear(y => y + 1);
            setMonth(1);
        } else {
            setMonth(m => m + 1);
        }
    };

    const totalPeriodCost = data.reduce((sum, item) => sum + item.totalCost, 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>原価管理 (仕入集計)</h1>
                    <p className={styles.subtitle}>仕入先ごとの原価発生状況を月次で確認</p>
                </div>
                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <Button variant="ghost" onClick={handlePrevMonth} icon={<ChevronLeft size={18} />}>
                            前月
                        </Button>
                        <div style={{ padding: '0 1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {year}年 {month}月
                        </div>
                        <Button variant="ghost" onClick={handleNextMonth}>
                            翌月 <ChevronRight size={18} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        </Button>
                    </div>
                </div>
            </div>

            <div className={styles.legendCard} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={16} /> 項目の説明
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <strong style={{ color: '#1e293b' }}>● 請求書（受領）:</strong> 
                        <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>仕入先から当月分の請求書が届いているかを確認するチェックです。</span>
                    </div>
                    <div>
                        <strong style={{ color: '#1e293b' }}>● 支払（完了）:</strong> 
                        <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>その仕入先への支払いが完了したかを確認するチェックです。</span>
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                {/* Summary Cards */}
                <div className={styles.summaryGrid}>
                    <div className={`${styles.card} ${styles.costCard}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconWrapper} style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                <Settings size={24} />
                            </div>
                            <span className={styles.cardLabel}>当月仕入総額 (原価)</span>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.value}>{formatCurrency(totalPeriodCost)}</div>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconWrapper} style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                                <FileText size={24} />
                            </div>
                            <span className={styles.cardLabel}>取引先数</span>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.value}>{data.length} <span className={styles.subtitle}>社</span></div>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className={styles.tableCard}>
                    <h2>仕入先別内訳</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>仕入先名</th>
                                <th className={styles.right}>取引回数</th>
                                <th className={styles.right}>仕入金額 (原価)</th>
                                <th className={styles.right}>構成比</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem' }}>
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        データがありません
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <>
                                        <tr
                                            key={index}
                                            onClick={() => handleRowClick(item.name)}
                                            style={{ cursor: 'pointer', backgroundColor: selectedSupplier === item.name ? '#eff6ff' : undefined }}
                                        >
                                            <td style={{ fontWeight: 500 }}>{item.name}</td>
                                            <td className={styles.right}>{item.count} 回</td>
                                            <td className={styles.right} style={{ fontWeight: 'bold' }}>
                                                {formatCurrency(item.totalCost)}
                                            </td>
                                            <td className={styles.right} style={{ color: '#64748b' }}>
                                                {totalPeriodCost > 0
                                                    ? `${((item.totalCost / totalPeriodCost) * 100).toFixed(1)}%`
                                                    : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                                                {selectedSupplier === item.name ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </td>
                                        </tr>
                                        {selectedSupplier === item.name && (
                                            <tr className={styles.detailRow}>
                                                <td colSpan={5} style={{ padding: '0', borderBottom: '2px solid #e2e8f0' }}>
                                                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                                                            <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                                                                {item.name} の取引明細 (顧客順)
                                                            </h3>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <Button variant="ghost" size="sm" onClick={() => handleBatchStatusChange(detailData, 'isInvoiceReceived', true, selectedSupplier || '')} style={{ fontSize: '0.75rem', padding: '4px 12px', border: '1px solid #e2e8f0' }}>
                                                                    全明細を請求書受領済にする
                                                                </Button>
                                                                <Button variant="ghost" size="sm" onClick={() => handleBatchStatusChange(detailData, 'isPaid', true, selectedSupplier || '')} style={{ fontSize: '0.75rem', padding: '4px 12px', border: '1px solid #e2e8f0' }}>
                                                                    全明細を支払済にする
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>日付</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>顧客名</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>機種 / S/N</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>品名</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '100px' }} title="仕入先から請求書を受領したか">請求書(受領)</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '100px' }} title="仕入先への支払いが完了したか">支払(完了)</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>数量</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>単価</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>金額</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {detailLoading ? (
                                                                        <tr><td colSpan={9} style={{ padding: '1rem', textAlign: 'center' }}>読み込み中...</td></tr>
                                                                    ) : detailData.length === 0 ? (
                                                                        <tr><td colSpan={9} style={{ padding: '1rem', textAlign: 'center' }}>明細データなし</td></tr>
                                                                    ) : (() => {
                                                                        // Pre-group data for rendering
                                                                        const groups: { key: string, items: SupplierDetail[] }[] = [];
                                                                        detailData.forEach(d => {
                                                                            const key = `${new Date(d.date).toLocaleDateString()}_${d.customerName}_${d.machineModel}`;
                                                                            if (groups.length === 0 || groups[groups.length - 1].key !== key) {
                                                                                groups.push({ key, items: [d] });
                                                                            } else {
                                                                                groups[groups.length - 1].items.push(d);
                                                                            }
                                                                        });

                                                                        return groups.map((group) => (
                                                                            <React.Fragment key={group.key}>
                                                                                <tr style={{ backgroundColor: '#f8fafc' }}>
                                                                                    <td colSpan={4} style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', borderTop: '1px solid #e2e8f0' }}>
                                                                                        【案件】{group.key.replace(/_/g, ' / ')}
                                                                                    </td>
                                                                                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                                                                                        <button 
                                                                                            onClick={() => handleBatchStatusChange(group.items, 'isInvoiceReceived', true, 'この案件')}
                                                                                            style={{ fontSize: '0.7rem', padding: '1px 4px', cursor: 'pointer', borderRadius: '3px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                                                                                            title="この案件の全明細を受領済にする"
                                                                                        >
                                                                                            一括
                                                                                        </button>
                                                                                    </td>
                                                                                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                                                                                        <button 
                                                                                            onClick={() => handleBatchStatusChange(group.items, 'isPaid', true, 'この案件')}
                                                                                            style={{ fontSize: '0.7rem', padding: '1px 4px', cursor: 'pointer', borderRadius: '3px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                                                                                            title="この案件の全明細を支払済にする"
                                                                                        >
                                                                                            一括
                                                                                        </button>
                                                                                    </td>
                                                                                    <td colSpan={3} style={{ borderTop: '1px solid #e2e8f0' }}></td>
                                                                                </tr>
                                                                                {group.items.map((d, idx) => (
                                                                                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                                        <td style={{ padding: '0.5rem', color: idx === 0 ? 'inherit' : '#94a3b8' }}>
                                                                                            {idx === 0 ? new Date(d.date).toLocaleDateString() : '〃'}
                                                                                        </td>
                                                                                        <td style={{ padding: '0.5rem', color: idx === 0 ? 'inherit' : '#94a3b8' }}>
                                                                                            {idx === 0 ? d.customerName : '〃'}
                                                                                        </td>
                                                                                        <td style={{ padding: '0.5rem', color: idx === 0 ? 'inherit' : '#94a3b8' }}>
                                                                                            {idx === 0 ? (
                                                                                                <>
                                                                                                    {d.machineModel}<br />
                                                                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.serialNumber}</span>
                                                                                                </>
                                                                                            ) : '〃'}
                                                                                        </td>
                                                                                        <td style={{ padding: '0.5rem' }}>{d.description}</td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={!!d.isInvoiceReceived}
                                                                                                onChange={(e) => handleDetailStatusChange(d.id, 'isInvoiceReceived', e.target.checked)}
                                                                                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                                                                title="請求書受領"
                                                                                            />
                                                                                        </td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={!!d.isPaid}
                                                                                                onChange={(e) => handleDetailStatusChange(d.id, 'isPaid', e.target.checked)}
                                                                                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                                                                title="支払完了"
                                                                                            />
                                                                                        </td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{d.quantity}</td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(d.unitCost)}</td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(d.amount)}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </React.Fragment>
                                                                        ));
                                                                    })()}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SupplierMonthlyReport;
