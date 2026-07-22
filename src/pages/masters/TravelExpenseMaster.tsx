import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { API_BASE_URL } from '../../config';
import styles from '../Inventory.module.css';

interface TravelExpense {
    id: number;
    area: string;
    fee: number;
    code: string | null;
}

const TravelExpenseMaster: React.FC = () => {
    const [expenses, setExpenses] = useState<TravelExpense[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Omit<TravelExpense, 'id'>>({
        area: '',
        fee: 0,
        code: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [baseFee, setBaseFee] = useState<string>('0');
    const [isSavingBaseFee, setIsSavingBaseFee] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/travel-expenses`);
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
            
            // Fetch System Settings
            const setRes = await fetch(`${API_BASE_URL}/system-settings`);
            if (setRes.ok) {
                const setData = await setRes.json();
                if (setData.defaultBaseTravelFee) {
                    setBaseFee(setData.defaultBaseTravelFee);
                }
            }
        } catch (error) {
            console.error('Failed to fetch travel expenses', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `${API_BASE_URL}/travel-expenses/${editingId}`
                : `${API_BASE_URL}/travel-expenses`;

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchExpenses();
            }
        } catch (error) {
            console.error('Failed to save travel expense', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/travel-expenses/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchExpenses();
            }
        } catch (error) {
            console.error('Failed to delete travel expense', error);
        }
    };

    const openEdit = (item: TravelExpense) => {
        setEditingId(item.id);
        setFormData({
            area: item.area,
            fee: Number(item.fee),
            code: item.code || ''
        });
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingId(null);
        setFormData({ area: '', fee: 0, code: '' });
        setIsModalOpen(true);
    };

    const saveBaseFee = async () => {
        setIsSavingBaseFee(true);
        try {
            const res = await fetch(`${API_BASE_URL}/system-settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ defaultBaseTravelFee: baseFee })
            });
            if (res.ok) {
                alert('ベース出張費を保存しました。');
            } else {
                alert('保存に失敗しました。');
            }
        } catch (error) {
            console.error('Failed to save base fee', error);
            alert('保存に失敗しました。');
        } finally {
            setIsSavingBaseFee(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', background: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <label style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>ベース出張費 (円):</label>
                    <div style={{ width: '150px', flexShrink: 0 }}>
                        <Input 
                            type="number" 
                            value={baseFee} 
                            onChange={(e) => setBaseFee(e.target.value)} 
                        />
                    </div>
                    <div style={{ whiteSpace: 'nowrap' }}>
                        <Button onClick={saveBaseFee} disabled={isSavingBaseFee} icon={<Save size={18} />}>
                            {isSavingBaseFee ? '保存中...' : '設定を保存'}
                        </Button>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>※マスター未登録の場所を入力した際の初期値になります</span>
                </div>
                <div style={{ whiteSpace: 'nowrap' }}>
                    <Button icon={<Plus size={18} />} onClick={openAdd}>
                        新規登録
                    </Button>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>地区</th>
                            <th>コード</th>
                            <th>出張費 (円)</th>
                            <th style={{ width: '100px' }}>アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ padding: '2rem' }}><LoadingSpinner /></td></tr>
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan={4} className={styles.emptyState}>データがありません</td></tr>
                        ) : (
                            expenses.map(item => (
                                <tr key={item.id}>
                                    <td>{item.area}</td>
                                    <td>{item.code || '-'}</td>
                                    <td>{Number(item.fee).toLocaleString()}円</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionButton} onClick={() => openEdit(item)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDelete(item.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{ maxWidth: '500px' }}>
                        <div className={styles.modalHeader}>
                            <h2>{editingId ? '出張費編集' : '新規出張費登録'}</h2>
                            <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                label="地区"
                                value={formData.area}
                                onChange={e => setFormData({ ...formData, area: e.target.value })}
                                required
                            />

                            <div className={styles.formGrid2}>
                                <Input
                                    label="出張費 (円)"
                                    type="number"
                                    value={formData.fee}
                                    onChange={e => setFormData({ ...formData, fee: Number(e.target.value) })}
                                />
                                <Input
                                    label="コード"
                                    value={formData.code || ''}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>

                            <div className={styles.formActions}>
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                    キャンセル
                                </Button>
                                <Button type="submit">保存</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TravelExpenseMaster;
