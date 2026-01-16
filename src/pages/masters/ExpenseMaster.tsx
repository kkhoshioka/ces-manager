import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { API_BASE_URL } from '../../config';
import styles from '../Inventory.module.css';

interface OperatingExpense {
    id: number;
    name: string;
    unit: string | null;
    standardCost: number;
    standardPrice: number;
}

const ExpenseMaster: React.FC = () => {
    const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Omit<OperatingExpense, 'id'>>({
        name: '',
        unit: '',
        standardCost: 0,
        standardPrice: 0
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/operating-expenses`);
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error('Failed to fetch expenses', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `${API_BASE_URL}/operating-expenses/${editingId}`
                : `${API_BASE_URL}/operating-expenses`;

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
            console.error('Failed to save expense', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/operating-expenses/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchExpenses();
            }
        } catch (error) {
            console.error('Failed to delete expense', error);
        }
    };

    const openEdit = (item: OperatingExpense) => {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            unit: item.unit || '',
            standardCost: Number(item.standardCost),
            standardPrice: Number(item.standardPrice)
        });
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingId(null);
        setFormData({ name: '', unit: '', standardCost: 0, standardPrice: 0 });
        setIsModalOpen(true);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <Button icon={<Plus size={18} />} onClick={openAdd}>
                    新規登録
                </Button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>項目名</th>
                            <th>単位</th>
                            <th>標準原価</th>
                            <th>標準単価</th>
                            <th style={{ width: '100px' }}>アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} style={{ padding: '2rem' }}><LoadingSpinner /></td></tr>
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan={5} className={styles.emptyState}>データがありません</td></tr>
                        ) : (
                            expenses.map(item => (
                                <tr key={item.id}>
                                    <td>{item.name}</td>
                                    <td>{item.unit || '-'}</td>
                                    <td>{Number(item.standardCost).toLocaleString()}円</td>
                                    <td>{Number(item.standardPrice).toLocaleString()}円</td>
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
                            <h2>{editingId ? '営業費編集' : '新規営業費登録'}</h2>
                            <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                label="項目名"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <div className={styles.formGrid3}>
                                <Input
                                    label="単位"
                                    value={formData.unit || ''}
                                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                />
                                <Input
                                    label="標準原価"
                                    type="number"
                                    value={formData.standardCost}
                                    onChange={e => setFormData({ ...formData, standardCost: Number(e.target.value) })}
                                />
                                <Input
                                    label="標準単価"
                                    type="number"
                                    value={formData.standardPrice}
                                    onChange={e => setFormData({ ...formData, standardPrice: Number(e.target.value) })}
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

export default ExpenseMaster;
