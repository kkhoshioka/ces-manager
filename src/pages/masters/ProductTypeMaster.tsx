import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { API_BASE_URL } from '../../config';
import styles from '../Inventory.module.css';

interface ProductCategory {
    id: number;
    section: string;
    code: string | null;
    name: string;
    sortOrder: number;
}

const getSectionPrefix = (section: string) => {
    if (section.includes('修理') || section.includes('整備')) return 'M';
    if (section.includes('新車')) return 'S';
    if (section.includes('中古')) return 'U';
    if (section.includes('レンタル')) return 'R';
    if (section.includes('部品')) return 'P';
    if (section.includes('用品')) return 'A';
    if (section.includes('諸経費')) return 'E';
    
    // Fallback: Use first character if it's alphanumeric, otherwise 'Z'
    const firstChar = section.charAt(0).toUpperCase();
    if (/[A-Z0-9]/.test(firstChar)) return firstChar;
    return 'Z';
};

const ProductTypeMaster: React.FC = () => {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ section: '', code: '', name: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Unique sections for suggestion/dropdown
    const sections = Array.from(new Set(categories.map(c => c.section)));

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/categories`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `${API_BASE_URL}/categories/${editingId}`
                : `${API_BASE_URL}/categories`;

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchCategories();
                setFormData({ section: '', code: '', name: '' });
                setEditingId(null);
            } else {
                alert('保存に失敗しました');
            }
        } catch (error) {
            console.error('Failed to save category', error);
            alert('エラーが発生しました');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('本当に削除しますか？\n(注意: 製品で使用されている場合は削除できない可能性があります)')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchCategories();
            } else {
                alert('削除に失敗しました');
            }
        } catch (error) {
            console.error('Failed to delete category', error);
        }
    };

    const handleMove = async (id: number, direction: 'up' | 'down') => {
        const index = categories.findIndex(c => c.id === id);
        if (index === -1) return;

        const newCategories = [...categories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex < 0 || targetIndex >= newCategories.length) return;
        
        // Swap
        [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
        
        // Update sortOrder values based on new indices
        const updatedWithOrders = newCategories.map((c, i) => ({ ...c, sortOrder: i }));
        setCategories(updatedWithOrders);
        
        // Save to server
        try {
            await fetch(`${API_BASE_URL}/categories/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orders: updatedWithOrders.map(c => ({ id: c.id, sortOrder: c.sortOrder }))
                })
            });
        } catch (error) {
            console.error('Failed to save order', error);
        }
    };

    const openEdit = (category: ProductCategory) => {
        setEditingId(category.id);
        setFormData({
            section: category.section,
            code: category.code || '',
            name: category.name
        });
        setIsModalOpen(true);
    };

    const openAdd = (section: string = '') => {
        setEditingId(null);
        let code = '';
        if (section) {
            const sectionCats = categories.filter(c => c.section === section);
            const prefix = getSectionPrefix(section);
            const numbers = sectionCats
                .map(c => {
                    const match = c.code?.match(/\d+$/);
                    return match ? parseInt(match[0], 10) : 0;
                })
                .filter(n => !isNaN(n));
            const nextNum = Math.max(0, ...numbers) + 1;
            code = `${prefix}-${nextNum.toString().padStart(2, '0')}`;
        }
        setFormData({ section, code, name: '' });
        setIsModalOpen(true);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>商品種別マスタ</h2>
                <Button icon={<Plus size={18} />} onClick={() => openAdd()}>
                    新規部門登録
                </Button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '200px' }}>部門</th>
                            <th style={{ width: '120px' }}>コード</th>
                            <th>種別名</th>
                            <th style={{ width: '100px' }}>アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ padding: '2rem' }}><LoadingSpinner /></td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan={4} className={styles.emptyState}>データがありません</td></tr>
                        ) : (
                            sections.map(section => (
                                <React.Fragment key={section}>
                                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                                        <td colSpan={4} style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#1e293b' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>{section}</span>
                                                <Button size="sm" variant="ghost" onClick={() => openAdd(section)} style={{ padding: '2px 8px' }}>
                                                    <Plus size={14} /> 追加
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                    {categories.filter(c => c.section === section).map((category) => {
                                        const globalIndex = categories.findIndex(c => c.id === category.id);
                                        return (
                                            <tr key={category.id}>
                                                <td style={{ color: '#64748b', fontSize: '0.8rem', paddingLeft: '2rem' }}>{section}</td>
                                                <td className={styles.partNumber}>{category.code || '-'}</td>
                                                <td>{category.name}</td>
                                                <td>
                                                    <div className={styles.actions}>
                                                        <div style={{ display: 'flex', gap: '2px', marginRight: '8px' }}>
                                                            <button 
                                                                className={styles.actionButton} 
                                                                onClick={() => handleMove(category.id, 'up')}
                                                                disabled={globalIndex === 0}
                                                                style={{ opacity: globalIndex === 0 ? 0.3 : 1 }}
                                                            >
                                                                <ArrowUp size={14} />
                                                            </button>
                                                            <button 
                                                                className={styles.actionButton} 
                                                                onClick={() => handleMove(category.id, 'down')}
                                                                disabled={globalIndex === categories.length - 1}
                                                                style={{ opacity: globalIndex === categories.length - 1 ? 0.3 : 1 }}
                                                            >
                                                                <ArrowDown size={14} />
                                                            </button>
                                                        </div>
                                                        <button className={styles.actionButton} onClick={() => openEdit(category)}>
                                                            <Edit size={16} />
                                                        </button>
                                                        <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDelete(category.id)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{ maxWidth: '400px' }}>
                        <div className={styles.modalHeader}>
                            <h2>
                                {editingId ? '編集' : '新規登録'}
                            </h2>
                            <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Section Input with Datalist for suggestions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
                                    部門（カテゴリー） <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    list="sections"
                                    value={formData.section}
                                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                                    required
                                    placeholder="例: 新車販売"
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.9375rem',
                                        width: '100%'
                                    }}
                                />
                                <datalist id="sections">
                                    {sections.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>

                            <Input
                                label="コード"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                placeholder="例: M-01"
                            />

                            <Input
                                label="種別名"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="例: ミニHE"
                            />

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

export default ProductTypeMaster;
