import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { ChevronLeft, ChevronRight, FileText, Settings } from 'lucide-react';
import styles from '../Dashboard.module.css';
import { formatCurrency } from '../../utils/formatting';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface SupplierCost {
    name: string;
    totalCost: number;
    count: number;
}

const SupplierMonthlyReport = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [data, setData] = useState<SupplierCost[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
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
    };

    useEffect(() => {
        fetchReport();
    }, [year, month]);

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
                    <h1 className={styles.title}>仕入先別コスト集計</h1>
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
                        <Button variant="ghost" onClick={handleNextMonth} icon={<ChevronRight size={18} />} iconPosition="right">
                            翌月
                        </Button>
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
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        読み込み中...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        データがありません
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr key={index}>
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
                                    </tr>
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
