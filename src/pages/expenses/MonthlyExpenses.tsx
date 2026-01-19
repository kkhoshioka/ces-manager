import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import styles from './MonthlyExpenses.module.css';

interface OperatingExpense {
    id: number;
    name: string;
    group: string | null;
}

interface MonthlyExpenseData {
    id?: number;
    expenseId: number;
    amount: number;
}

const MonthlyExpenses: React.FC = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
    const [monthlyData, setMonthlyData] = useState<Record<number, number>>({}); // expenseId -> amount
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const isFirstRun = React.useRef(true);

    useEffect(() => {
        const init = async () => {
            await fetchMasterData();
            await fetchMonthlyData();
            setIsLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        const refresh = async () => {
            setIsLoading(true);
            await fetchMonthlyData();
            setIsLoading(false);
        };
        refresh();
    }, [year, month]);

    const fetchMasterData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/operating-expenses`);
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error('Failed to fetch expense master', error);
        }
    };

    const fetchMonthlyData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/monthly-expenses?year=${year}&month=${month}`);
            if (res.ok) {
                const data: MonthlyExpenseData[] = await res.json();
                const map: Record<number, number> = {};
                data.forEach(d => {
                    map[d.expenseId] = d.amount;
                });
                setMonthlyData(map);
            }
        } catch (error) {
            console.error('Failed to fetch monthly data', error);
        }
    };

    const handleAmountChange = (expenseId: number, value: string) => {
        const numValue = value === '' ? 0 : Number(value);
        setMonthlyData(prev => ({ ...prev, [expenseId]: numValue }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = Object.entries(monthlyData).map(([expenseId, amount]) => ({
                expenseId: Number(expenseId),
                amount
            }));

            const res = await fetch(`${API_BASE_URL}/monthly-expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, month, expenses: payload })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: '保存しました' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            setMessage({ type: 'error', text: '保存に失敗しました' });
        } finally {
            setIsSaving(false);
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

    // Group expenses
    const groupedExpenses = React.useMemo(() => {
        const groups: Record<string, OperatingExpense[]> = {};

        expenses.forEach(exp => {
            const groupName = exp.group || '基本経費';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(exp);
        });

        const order = ['人件費', '車両・設備費', '営業活動費', '一般管理費'];
        const bottom = ['営業外', 'その他経費', 'その他', '基本経費'];

        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const idxA = order.indexOf(a);
            const idxB = order.indexOf(b);

            // Check top priority first
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;

            // Check bottom priority
            const isBottomA = bottom.some(k => a.includes(k));
            const isBottomB = bottom.some(k => b.includes(k));

            if (isBottomA && isBottomB) {
                // Keep relative order in bottom array if possible, or simple locale
                return order.indexOf(a) - order.indexOf(b); // Wait, they aren't in 'order'. 
                // Just alphabetical among themselves if both are bottom?
                // Or preserve 'bottom' array order?
                const bIdxA = bottom.findIndex(k => a.includes(k));
                const bIdxB = bottom.findIndex(k => b.includes(k));
                return bIdxA - bIdxB;
            }
            if (isBottomA) return 1;
            if (isBottomB) return -1;

            return a.localeCompare(b);
        });

        return { groups, sortedKeys };
    }, [expenses]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>月次営業費入力</h1>
                <div className={styles.controls}>
                    <Button variant="ghost" onClick={handlePrevMonth} icon={<ChevronLeft size={18} />}>前月</Button>
                    <div className={styles.dateDisplay}>
                        <Calendar size={18} />
                        <span>{year}年 {month}月</span>
                    </div>
                    <Button variant="ghost" onClick={handleNextMonth}>
                        翌月 <ChevronRight size={18} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                    </Button>
                </div>
            </div>

            {message && (
                <div className={`${styles.message} ${message.type === 'success' ? styles.success : styles.error}`}>
                    <AlertCircle size={20} />
                    {message.text}
                </div>
            )}

            {isLoading ? (
                <div className={styles.loading}><LoadingSpinner /></div>
            ) : (
                <div className={styles.formContent}>
                    {groupedExpenses.sortedKeys.map(groupName => (
                        <div key={groupName} className={styles.groupSection}>
                            <h3 className={styles.groupTitle}>{groupName}</h3>
                            <div className={styles.grid}>
                                {groupedExpenses.groups[groupName].map(exp => (
                                    <div key={exp.id} className={styles.inputGroup}>
                                        <label>{exp.name}</label>
                                        <input
                                            type="number"
                                            value={monthlyData[exp.id] || ''}
                                            onChange={(e) => handleAmountChange(exp.id, e.target.value)}
                                            placeholder="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className={styles.actions}>
                        <Button onClick={handleSave} disabled={isSaving} icon={<Save size={18} />}>
                            {isSaving ? '保存中...' : '保存する'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyExpenses;
