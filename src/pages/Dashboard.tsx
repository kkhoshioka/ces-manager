import React, { useState, useEffect } from 'react';
import { Calendar, Filter, TrendingUp, DollarSign, CreditCard, Activity, ChevronLeft, ChevronRight, Users, PieChart as PieIcon, BarChart } from 'lucide-react';
import Button from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import styles from './Dashboard.module.css';
import { formatCurrency } from '../utils/formatting';
import { API_BASE_URL } from '../config';
import { SalesTrendChart } from '../components/dashboard/SalesTrendChart';
import { CategoryPieChart } from '../components/dashboard/CategoryPieChart';

interface CategoryData {
    sales: number;
    confirmedSales: number;
    wipSales: number;
    cost: number;
    confirmedCost: number;
    wipCost: number;
    profit: number;
    confirmedProfit: number;
    wipProfit: number;
    internalCost: number;
    confirmedInternalCost: number;
    wipInternalCost: number;
    label: string;
}

interface DashboardData {
    totalSales: number;
    totalConfirmedSales: number;
    totalWipSales: number;
    totalCost: number;
    totalConfirmedCost: number;
    totalWipCost: number;
    totalProfit: number;
    totalConfirmedProfit: number;
    totalWipProfit: number;
    totalInternalCost: number;
    totalConfirmedInternalCost: number;
    totalWipInternalCost: number;
    categories: Record<string, CategoryData>;
}

import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState<number | ''>(new Date().getMonth() + 1);
    const [data, setData] = useState<DashboardData | null>(null);
    const [trendData, setTrendData] = useState<{ month: number; sales: number; cost: number; profit: number; }[]>([]);
    const [loading, setLoading] = useState(false);

    const calculateMargin = (profit: number, sales: number) => {
        if (sales === 0) return '0.0%';
        return `${((profit / sales) * 100).toFixed(1)}%`;
    };

    const handlePrevMonth = () => {
        if (month === '') {
            setMonth(12);
        } else if (month === 1) {
            setYear(y => y - 1);
            setMonth(12);
        } else {
            setMonth(m => (m as number) - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === '') {
            setMonth(1);
        } else if (month === 12) {
            setYear(y => y + 1);
            setMonth(1);
        } else {
            setMonth(m => (m as number) + 1);
        }
    };

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/sales?year=${year}&month=${month}`);
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            const result = await response.json();
            setData(result);

            // Fetch Trend Data (Once or when year changes)
            const trendResponse = await fetch(`${API_BASE_URL}/dashboard/trend?year=${year}`);
            if (trendResponse.ok) {
                const trendResult = await trendResponse.json();
                setTrendData(trendResult);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    interface DashboardDetailItem {
        id: number | string;
        completionDate?: string;
        createdAt: string;
        customer?: { name: string };
        machineModel?: string;
        serialNumber?: string;
        categorySales: number;
        categoryProfit: number;
    }

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [detailData, setDetailData] = useState<DashboardDetailItem[]>([]);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const handleRowClick = async (categoryKey: string, categoryLabel: string) => {
        if (isDetailLoading) return;
        setIsDetailLoading(true);
        setSelectedCategory(categoryLabel);
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/details?year=${year}&month=${month}&category=${categoryKey}`);
            if (!response.ok) throw new Error('Failed to fetch detail data');
            const result = await response.json();
            setDetailData(result);
            setIsDetailOpen(true);
        } catch (error) {
            console.error(error);
            alert('詳細データの取得に失敗しました。');
        } finally {
            setIsDetailLoading(false);
        }
    };


    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>経営ダッシュボード</h1>
                    <p className={styles.subtitle}>売上・原価・利益のリアルタイム分析</p>
                </div>
                <div className={styles.filters}>
                    <Button variant="ghost" onClick={handlePrevMonth} icon={<ChevronLeft size={18} />}>前月</Button>
                    <div className={styles.filterGroup}>
                        <Calendar size={18} className={styles.icon} />
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className={styles.select}
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}年</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <select
                            value={month}
                            onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : '')}
                            className={styles.select}
                        >
                            <option value="">通年</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{m}月</option>
                            ))}
                        </select>
                    </div>
                    <Button variant="ghost" onClick={handleNextMonth}>
                        翌月 <ChevronRight size={18} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                    </Button>
                    <Button icon={<Filter size={18} />} onClick={fetchData}>
                        更新
                    </Button>
                </div>
            </div>

            {loading ? (
                <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LoadingSpinner />
                </div>
            ) : data ? (
                <div className={styles.content}>
                    {/* Summary Cards */}
                    <div className={styles.summaryGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                        <div
                            className={`${styles.card} ${styles.salesCard}`}
                            onClick={() => navigate('/sales-management')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.iconWrapper} style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                                    <DollarSign size={24} />
                                </div>
                                <span className={styles.cardLabel}>総売上高 (見込み込)</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.value}>{formatCurrency(data.totalSales)}</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>確定:</span>
                                        <span style={{ fontWeight: 600, color: '#0369a1' }}>{formatCurrency(data.totalConfirmedSales)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>作業中(見込):</span>
                                        <span style={{ fontWeight: 600, color: '#94a3b8' }}>{formatCurrency(data.totalWipSales)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`${styles.card} ${styles.costCard}`}
                            onClick={() => navigate('/reports/supplier-costs')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.iconWrapper} style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                    <CreditCard size={24} />
                                </div>
                                <span className={styles.cardLabel}>総外注費・仕入 (外部)</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.value}>{formatCurrency(data.totalCost)}</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>確定:</span>
                                        <span style={{ fontWeight: 600, color: '#b91c1c' }}>{formatCurrency(data.totalConfirmedCost)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>見込:</span>
                                        <span style={{ fontWeight: 600, color: '#94a3b8' }}>{formatCurrency(data.totalWipCost)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Internal Cost Card */}
                        <div className={styles.card} style={{ borderLeft: '4px solid #8b5cf6' }}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconWrapper} style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                                    <Users size={24} />
                                </div>
                                <span className={styles.cardLabel}>自社コスト (見込)</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.value}>{formatCurrency(data.totalInternalCost)}</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>確定:</span>
                                        <span style={{ fontWeight: 600, color: '#7c3aed' }}>{formatCurrency(data.totalConfirmedInternalCost)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>見込:</span>
                                        <span style={{ fontWeight: 600, color: '#94a3b8' }}>{formatCurrency(data.totalWipInternalCost)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.card} ${styles.profitCard}`}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconWrapper} style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                                    <TrendingUp size={24} />
                                </div>
                                <span className={styles.cardLabel}>総粗利 (実質利益)</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.value}>{formatCurrency(data.totalProfit)}</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center' }}><Activity size={14} style={{ marginRight: '4px' }} /> 粗利率:</span>
                                        <span>{calculateMargin(data.totalProfit, data.totalSales)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '4px', marginTop: '4px' }}>
                                        <span>実質利益見込:</span>
                                        <span style={{ fontWeight: 600, color: '#15803d' }}>{formatCurrency(data.totalProfit - data.totalInternalCost)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>




                    {/* Charts Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className={styles.card} style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                <BarChart size={20} style={{ marginRight: '8px', color: '#3b82f6' }} />
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>売上・粗利推移 ({year}年)</h2>
                            </div>
                            <SalesTrendChart data={trendData} />
                        </div>

                        <div className={styles.card} style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                <PieIcon size={20} style={{ marginRight: '8px', color: '#8b5cf6' }} />
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>売上構成比 ({year}年{month ? `${month}月` : '度'})</h2>
                            </div>
                            {/* Prepare data for Pie Chart */}
                            <CategoryPieChart
                                data={Object.values(data.categories).map(cat => ({
                                    name: cat.label,
                                    value: cat.sales
                                })).sort((a, b) => b.value - a.value)}
                                title="部門別売上シェア"
                            />
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className={styles.tableCard}>
                        <h2>部門別集計表 ({year}年{month ? `${month}月` : '度'})</h2>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>部門 (カテゴリ)</th>
                                    <th className={styles.right}>売上高 (確定/見込)</th>
                                    <th className={styles.right}>外部原価</th>
                                    <th className={styles.right} style={{ color: '#7c3aed' }}>自社原価</th>
                                    <th className={styles.right}>粗利益</th>
                                    <th className={styles.right}>粗利率</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(data.categories).map(([key, cat]) => (
                                    <tr key={key} onClick={() => handleRowClick(key, cat.label)} style={{ cursor: 'pointer' }}>
                                        <td>{cat.label}</td>
                                        <td className={styles.right}>
                                            <div style={{ fontWeight: 'bold' }}>{formatCurrency(cat.sales)}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {formatCurrency(cat.confirmedSales)} / <span style={{ color: '#94a3b8' }}>{formatCurrency(cat.wipSales)}</span>
                                            </div>
                                        </td>
                                        <td className={styles.right}>{formatCurrency(cat.cost)}</td>
                                        <td className={styles.right} style={{ color: '#7c3aed' }}>{formatCurrency(cat.internalCost)}</td>
                                        <td className={styles.right}>{formatCurrency(cat.profit)}</td>
                                        <td className={styles.right}>{calculateMargin(cat.profit, cat.sales)}</td>
                                    </tr>
                                ))}
                                <tr className={styles.totalRow}>
                                    <td>合計</td>
                                    <td className={styles.right}>
                                        <div>{formatCurrency(data.totalSales)}</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.8 }}>
                                            {formatCurrency(data.totalConfirmedSales)} / {formatCurrency(data.totalWipSales)}
                                        </div>
                                    </td>
                                    <td className={styles.right}>{formatCurrency(data.totalCost)}</td>
                                    <td className={styles.right}>{formatCurrency(data.totalInternalCost)}</td>
                                    <td className={styles.right}>{formatCurrency(data.totalProfit)}</td>
                                    <td className={styles.right}>{calculateMargin(data.totalProfit, data.totalSales)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className={styles.empty}>データがありません</div>
            )
            }

            {/* Details Modal */}
            {
                isDetailOpen && (
                    <div className={styles.modalOverlay} onClick={() => setIsDetailOpen(false)}>
                        <div className={styles.modal} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>{selectedCategory} 詳細一覧</h2>
                                <button className={styles.closeButton} onClick={() => setIsDetailOpen(false)}>×</button>
                            </div>
                            <div className={styles.modalContent}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>日付</th>
                                            <th>顧客名</th>
                                            <th>機種 / シリアル</th>
                                            <th className={styles.right}>部門売上</th>
                                            <th className={styles.right}>部門粗利</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailData.length === 0 ? (
                                            <tr><td colSpan={5} className={styles.empty}>該当データなし</td></tr>
                                        ) : (
                                            detailData.map((item: DashboardDetailItem) => (
                                                <tr key={item.id}>
                                                    <td>{new Date(item.completionDate || item.createdAt).toLocaleDateString()}</td>
                                                    <td>{item.customer?.name}</td>
                                                    <td>
                                                        <div className={styles.machineInfo}>
                                                            <span>{item.machineModel}</span>
                                                            <span className={styles.serial}>{item.serialNumber}</span>
                                                        </div>
                                                    </td>
                                                    <td className={styles.right}>{formatCurrency(item.categorySales)}</td>
                                                    <td className={styles.right}>{formatCurrency(item.categoryProfit)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;
