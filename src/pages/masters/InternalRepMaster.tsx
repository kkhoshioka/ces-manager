import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { API_BASE_URL } from '../../config';
import styles from '../Inventory.module.css';

interface InternalRep {
    id: number;
    name: string;
    isActive: boolean;
    createdAt: string;
}

const InternalRepMaster: React.FC = () => {
    const [reps, setReps] = useState<InternalRep[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<{ name: string; isActive: boolean }>({
        name: '',
        isActive: true
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReps();
    }, []);

    const fetchReps = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/internal-reps`);
            if (res.ok) {
                const data = await res.json();
                setReps(data);
            }
        } catch (error) {
            console.error('Failed to fetch internal reps', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const url = editingId
                ? `${API_BASE_URL}/internal-reps/${editingId}`
                : `${API_BASE_URL}/internal-reps`;

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchReps();
            } else {
                const data = await res.json();
                setError(data.error || '保存に失敗しました');
            }
        } catch (error) {
            console.error('Failed to save internal rep', error);
            setError('通信エラーが発生しました');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/internal-reps/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchReps();
            } else {
                alert('削除に失敗しました');
            }
        } catch (error) {
            console.error('Failed to delete internal rep', error);
        }
    };

    const openEdit = (item: InternalRep) => {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            isActive: item.isActive
        });
        setError(null);
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingId(null);
        setFormData({ name: '', isActive: true });
        setError(null);
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
                            <th>担当者名</th>
                            <th>状態</th>
                            <th>登録日</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ padding: '2rem' }}><LoadingSpinner /></td></tr>
                        ) : reps.length === 0 ? (
                            <tr><td colSpan={4} className={styles.emptyState}>データがありません</td></tr>
                        ) : (
                            reps.map(item => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            backgroundColor: item.isActive ? '#d1fae5' : '#f1f5f9',
                                            color: item.isActive ? '#047857' : '#475569'
                                        }}>
                                            {item.isActive ? '有効' : '無効'}
                                        </span>
                                    </td>
                                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className={styles.actions} style={{ justifyContent: 'center' }}>
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
                            <h2>{editingId ? '自社担当者編集' : '新規自社担当者登録'}</h2>
                            <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        {error && (
                            <div style={{
                                padding: '1rem',
                                margin: '0 1.5rem',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                label="自社担当者名"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        style={{ width: '1rem', height: '1rem' }}
                                    />
                                    <span style={{ fontWeight: 500, fontSize: '0.875rem', color: '#374151' }}>有効</span>
                                </label>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                                    無効にすると、案件作成時の選択肢に表示されなくなります。
                                </p>
                            </div>

                            <div className={styles.modalActions}>
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                    キャンセル
                                </Button>
                                <Button type="submit">
                                    保存する
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InternalRepMaster;
