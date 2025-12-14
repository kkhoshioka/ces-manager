import React, { useState, useEffect } from 'react';
import { Calendar, Filter, TrendingUp, DollarSign, CreditCard, Activity, ArrowUpRight } from 'lucide-react';
import Button from '../components/ui/Button';
import styles from './Dashboard.module.css';
import { formatCurrency } from '../utils/formatting';
import { API_BASE_URL } from '../config';

interface CategoryData {
    sales: number;
    cost: number;
    profit: number;
    label: string;
}

interface DashboardData {
    totalSales: number;
    totalCost: number;
    totalProfit: number;
    categories: Record<string, CategoryData>;
}

const Dashboard: React.FC = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState<number | ''>(new Date().getMonth() + 1);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);

    const calculateMargin = (profit: number, sales: number) => {
        if (sales === 0) return '0.0%';
        return `${((profit / sales) * 100).toFixed(1)}%`;
    };

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/sales?year=${year}&month=${month}`);
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [detailData, setDetailData] = useState<any[]>([]);
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
                    <Button icon={<Filter size={18} />} onClick={fetchData}>
                        更新
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>読み込み中...</div>
            ) : data ? (
                <div className={styles.content}>
                    {/* Summary Cards */}
                    <div className={styles.summaryGrid}>
                        <div className={`${styles.card} ${styles.salesCard}`}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconWrapper} style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                                    <DollarSign size={24} />
                                </div>
                                <span className={styles.cardLabel}>総売上高</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.value}>{formatCurrency(data.totalSales)}</div>
                                <div className={styles.trend}>
                                    <ArrowUpRight size={16} className={styles.trendIcon} />
                                    <span>前月比 +12.5%</span>
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.card} ${styles.costCard}`}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconWrapper} style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                    <CreditCard size={24} />
                                </div>
                                <span className={styles.cardLabel}>総原価</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.value}>{formatCurrency(data.totalCost)}</div>
                                <div className={styles.trend} style={{ color: '#dc2626' }}>
                                    <ArrowUpRight size={16} className={styles.trendIcon} />
                                    <span>前月比 +8.2%</span>
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.card} ${styles.profitCard}`}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconWrapper} style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                                    <TrendingUp size={24} />
                                </div>
                                <span className={styles.cardLabel}>総粗利</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.value}>{formatCurrency(data.totalProfit)}</div>
                                <div className={styles.subValue}>
                                    <Activity size={16} style={{ marginRight: '4px' }} />
                                    粗利率: {calculateMargin(data.totalProfit, data.totalSales)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className={styles.tableCard}>
                        <h2>部門別集計表 ({year}年{month ? `${month}月` : '度'})</h2>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>部門 (カテゴリ)</th>
                                    <th className={styles.right}>売上高</th>
                                    <th className={styles.right}>原価</th>
                                    <th className={styles.right}>粗利益</th>
                                    <th className={styles.right}>粗利率</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(data.categories).map(([key, cat]) => (
                                    <tr key={key} onClick={() => handleRowClick(key, cat.label)} style={{ cursor: 'pointer' }}>
                                        <td>{cat.label}</td>
                                        <td className={styles.right}>{formatCurrency(cat.sales)}</td>
                                        <td className={styles.right}>{formatCurrency(cat.cost)}</td>
                                        <td className={styles.right}>{formatCurrency(cat.profit)}</td>
                                        <td className={styles.right}>{calculateMargin(cat.profit, cat.sales)}</td>
                                    </tr>
                                ))}
                                <tr className={styles.totalRow}>
                                    <td>合計</td>
                                    <td className={styles.right}>{formatCurrency(data.totalSales)}</td>
                                    <td className={styles.right}>{formatCurrency(data.totalCost)}</td>
                                    <td className={styles.right}>{formatCurrency(data.totalProfit)}</td>
                                    <td className={styles.right}>{calculateMargin(data.totalProfit, data.totalSales)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className={styles.empty}>データがありません</div>
            )}

            {/* Details Modal */}
            {isDetailOpen && (
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
                                        detailData.map((item: any) => (
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
            )}
        </div>
    );
};

export default Dashboard;
