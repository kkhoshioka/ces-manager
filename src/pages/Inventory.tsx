import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Plus, Search, Filter, X, Edit, Trash2, AlertTriangle } from 'lucide-react';
import type { Part, NewPart, ProductCategory } from '../types/inventory';
import { InventoryService } from '../utils/inventoryService';
import { formatNumber, formatCurrency } from '../utils/formatting';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import styles from './Inventory.module.css';

const Inventory: React.FC = () => {
    const [parts, setParts] = useState<Part[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Derived state for form
    const [selectedSection, setSelectedSection] = useState<string>('');

    const initialFormState: NewPart = {
        code: '',
        name: '',
        category: '',
        stockQuantity: 0,
        standardPrice: 0,
        standardCost: 0,
    };

    const [formData, setFormData] = useState<NewPart>(initialFormState);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [partsData, categoriesData] = await Promise.all([
                InventoryService.getAll(),
                InventoryService.getCategories()
            ]);
            setParts(partsData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, []);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        try {
            if (query.trim() === '') {
                // partial reload of parts only
                const data = await InventoryService.getAll();
                setParts(data);
            } else {
                const results = await InventoryService.search(query);
                setParts(results);
            }
        } catch (error) {
            console.error('Search failed', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'stockQuantity' || name === 'standardPrice' || name === 'standardCost' ? Number(value) : value
        }));
    };

    const handleMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const section = e.target.value;
        setSelectedSection(section);
        // Reset minor category when section changes
        setFormData(prev => ({ ...prev, categoryId: undefined }));
    };

    const handleMinorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const minorId = Number(e.target.value);
        setFormData(prev => ({ ...prev, categoryId: minorId }));
    };

    const openForm = (part?: Part) => {
        if (part) {
            setEditingId(part.id);
            setFormData({
                code: part.code,
                name: part.name,
                category: part.category || '',
                categoryId: part.categoryId,
                stockQuantity: part.stockQuantity,
                standardPrice: part.standardPrice,
                standardCost: part.standardCost,
            });

            // Set initial selected section based on current categoryId or productCategory
            if (part.productCategory) {
                setSelectedSection(part.productCategory.section);
            } else if (part.categoryId) {
                // Determine section from category list
                const cat = categories.find(c => c.id === part.categoryId);
                if (cat) {
                    setSelectedSection(cat.section);
                }
            } else {
                setSelectedSection('');
            }

        } else {
            setEditingId(null);
            setFormData(initialFormState);
            setSelectedSection('');
        }
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await InventoryService.update(editingId, formData);
            } else {
                await InventoryService.add(formData);
            }
            setIsFormOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to save part', error);
            alert('保存に失敗しました');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('本当にこの部品を削除しますか？')) {
            try {
                await InventoryService.delete(id);
                loadData();
            } catch (error) {
                console.error('Failed to delete part', error);
                alert('削除に失敗しました');
            }
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
                            <th>カテゴリ</th>
                            <th>在庫数</th>
                            <th>標準売価</th>
                            <th>標準原価</th>
                            <th>アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7}>
                                    <div style={{ padding: '2rem' }}>
                                        <LoadingSpinner />
                                    </div>
                                </td>
                            </tr>
                        ) : parts.length === 0 ? (
                            <tr>
                                <td colSpan={7} className={styles.emptyState}>
                                    データがありません
                                </td>
                            </tr>
                        ) : (
                            parts.map(part => (
                                <tr key={part.id}>
                                    <td className={styles.partNumber}>{part.code}</td>
                                    <td className={styles.partName}>
                                        {part.name}
                                        {part.stockQuantity <= 5 && (
                                            <span className={styles.lowStockBadge} title="在庫不足">
                                                <AlertTriangle size={14} />
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {/* Display logic: Use 'category' string or relation if available */}
                                        {/* If we updated backend fetch, we might have part.productCategory */}
                                        {part.productCategory ? (
                                            <>
                                                <span style={{ color: '#666', fontSize: '0.9em' }}>
                                                    [{part.productCategory.section}]
                                                </span>{' '}
                                                {part.productCategory.name}
                                            </>
                                        ) : (
                                            part.category || '-'
                                        )}
                                    </td>
                                    <td>
                                        <span className={`${styles.stockCount} ${part.stockQuantity <= 5 ? styles.lowStock : ''}`}>
                                            {formatNumber(part.stockQuantity)}
                                        </span>
                                    </td>
                                    <td>{formatCurrency(part.standardPrice)}</td>
                                    <td>{formatCurrency(part.standardCost)}</td>
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
                                    label="部品番号 (コード)"
                                    name="code"
                                    value={formData.code}
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
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>部門</label>
                                    <select
                                        className={styles.select}
                                        value={selectedSection}
                                        onChange={handleMajorChange}
                                    >
                                        <option value="">選択してください</option>
                                        {Array.from(new Set(categories.map(c => c.section))).sort().map(section => (
                                            <option key={section} value={section}>{section}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>種別</label>
                                    <select
                                        className={styles.select}
                                        name="categoryId"
                                        value={formData.categoryId || ''}
                                        onChange={handleMinorChange}
                                        disabled={!selectedSection}
                                    >
                                        <option value="">選択してください</option>
                                        {categories
                                            .filter(c => c.section === selectedSection)
                                            .map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.code ? `${cat.code}: ` : ''}{cat.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <Input
                                    label="在庫数"
                                    name="stockQuantity"
                                    type="number"
                                    min="0"
                                    value={formData.stockQuantity}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className={styles.formGrid}>
                                <Input
                                    label="標準売価 (円)"
                                    name="standardPrice"
                                    type="number"
                                    min="0"
                                    value={formData.standardPrice}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Input
                                    label="標準原価 (円)"
                                    name="standardCost"
                                    type="number"
                                    min="0"
                                    value={formData.standardCost}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

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
