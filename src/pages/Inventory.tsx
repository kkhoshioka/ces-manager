import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, X, Edit, Trash2, AlertTriangle } from 'lucide-react';
import type { Part, NewPart } from '../types/inventory';
import { InventoryService } from '../utils/inventoryService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import styles from './Inventory.module.css';

const Inventory: React.FC = () => {
    const [parts, setParts] = useState<Part[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const initialFormState: NewPart = {
        partNumber: '',
        name: '',
        description: '',
        stock: 0,
        price: 0,
        location: '',
        minStockLevel: 5
    };

    const [formData, setFormData] = useState<NewPart>(initialFormState);

    useEffect(() => {
        loadParts();
    }, []);

    const loadParts = () => {
        setParts(InventoryService.getAll());
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim() === '') {
            loadParts();
        } else {
            setParts(InventoryService.search(query));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'stock' || name === 'price' || name === 'minStockLevel' ? Number(value) : value
        }));
    };

    const openForm = (part?: Part) => {
        if (part) {
            setEditingId(part.id);
            setFormData({
                partNumber: part.partNumber,
                name: part.name,
                description: part.description || '',
                stock: part.stock,
                price: part.price,
                location: part.location || '',
                minStockLevel: part.minStockLevel || 5
            });
        } else {
            setEditingId(null);
            setFormData(initialFormState);
        }
        setIsFormOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            InventoryService.update(editingId, formData);
        } else {
            InventoryService.add(formData);
        }
        setIsFormOpen(false);
        loadParts();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('本当にこの部品を削除しますか？')) {
            InventoryService.delete(id);
            loadParts();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>部品在庫</h1>
                    <p className={styles.subtitle}>在庫状況の確認と管理</p>
                </div>
                <Button icon={<Plus size={18} />} onClick={() => openForm()}>
                    部品登録
                </Button>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="部品番号、名称で検索..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
                <Button variant="secondary" icon={<Filter size={18} />}>
                    フィルター
                </Button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>部品番号</th>
                            <th>名称</th>
                            <th>在庫数</th>
                            <th>単価</th>
                            <th>保管場所</th>
                            <th>アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parts.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={styles.emptyState}>
                                    データがありません
                                </td>
                            </tr>
                        ) : (
                            parts.map(part => (
                                <tr key={part.id}>
                                    <td className={styles.partNumber}>{part.partNumber}</td>
                                    <td className={styles.partName}>
                                        {part.name}
                                        {part.stock <= (part.minStockLevel || 0) && (
                                            <span className={styles.lowStockBadge} title="在庫不足">
                                                <AlertTriangle size={14} />
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`${styles.stockCount} ${part.stock <= (part.minStockLevel || 0) ? styles.lowStock : ''}`}>
                                            {part.stock}
                                        </span>
                                    </td>
                                    <td>¥{part.price.toLocaleString()}</td>
                                    <td>{part.location || '-'}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionButton} onClick={() => openForm(part)} title="編集">
                                                <Edit size={16} />
                                            </button>
                                            <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDelete(part.id)} title="削除">
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

            {/* Part Form Modal */}
            {isFormOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingId ? '部品情報の編集' : '新規部品登録'}</h2>
                            <button className={styles.closeButton} onClick={() => setIsFormOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGrid}>
                                <Input
                                    label="部品番号"
                                    name="partNumber"
                                    value={formData.partNumber}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Input
                                    label="部品名称"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className={styles.formGrid3}>
                                <Input
                                    label="在庫数"
                                    name="stock"
                                    type="number"
                                    min="0"
                                    value={formData.stock}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Input
                                    label="単価 (円)"
                                    name="price"
                                    type="number"
                                    min="0"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Input
                                    label="最低在庫数"
                                    name="minStockLevel"
                                    type="number"
                                    min="0"
                                    value={formData.minStockLevel}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <Input
                                label="保管場所"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                            />

                            <Textarea
                                label="説明・備考"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                            />

                            <div className={styles.formActions}>
                                <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                                    キャンセル
                                </Button>
                                <Button type="submit">
                                    {editingId ? '更新する' : '登録する'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
