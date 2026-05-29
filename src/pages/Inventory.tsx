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

    // Filter states
    const [sectionFilter, setSectionFilter] = useState<string>('');
    const [lowStockFilter, setLowStockFilter] = useState(false);

    // Snapshot states
    const [snapshotYear, setSnapshotYear] = useState<number>(new Date().getFullYear());
    const [snapshotMonth, setSnapshotMonth] = useState<number>(new Date().getMonth() + 1);
    const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);

    // Derived state for form
    const [selectedSection, setSelectedSection] = useState<string>('');

    const initialFormState: NewPart = {
        code: '',
        partNumber: '',
        name: '',
        category: '',
        stockQuantity: 0,
        unit: '個',
        standardPrice: 0,
        standardCost: 0,
        alertEnabled: false,
        alertThreshold: 5,
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
        const target = e.target as HTMLInputElement;
        const name = target.name;
        
        if (target.type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: target.checked
            }));
            return;
        }

        const value = target.value;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'stockQuantity' || name === 'standardPrice' || name === 'standardCost' || name === 'alertThreshold' ? Number(value) : value
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
        
        let newCode = formData.code;
        if (!editingId) {
            const category = categories.find(c => c.id === minorId);
            if (category && category.code) {
                const prefix = category.code;
                
                // Find all existing parts that start with this prefix followed by a hyphen
                const matchingParts = parts.filter(p => p.code.startsWith(prefix + '-'));
                
                let maxNum = 0;
                matchingParts.forEach(p => {
                    // Extract the number part after the last hyphen
                    const partsArray = p.code.split('-');
                    const lastPart = partsArray[partsArray.length - 1];
                    const num = parseInt(lastPart, 10);
                    if (!isNaN(num) && num > maxNum) {
                        maxNum = num;
                    }
                });
                
                const nextNum = maxNum + 1;
                // Format: Prefix-001
                newCode = `${prefix}-${nextNum.toString().padStart(3, '0')}`;
            }
        }

        setFormData(prev => ({ ...prev, categoryId: minorId, code: newCode }));
    };

    const openForm = (part?: Part) => {
        if (part) {
            setEditingId(part.id);
            setFormData({
                code: part.code,
                partNumber: part.partNumber || '',
                name: part.name,
                category: part.category || '',
                categoryId: part.categoryId,
                stockQuantity: part.stockQuantity,
                standardPrice: part.standardPrice,
                standardCost: part.standardCost,
                unit: part.unit || '個',
                alertEnabled: part.alertEnabled ?? false,
                alertThreshold: part.alertThreshold ?? 5,
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

    const handleSaveSnapshot = async () => {
        if (!confirm(`${snapshotYear}年${snapshotMonth}月の月末在庫を確定しますか？\n（既にデータがある場合は上書きされます）`)) return;
        setIsSnapshotLoading(true);
        try {
            await InventoryService.saveSnapshot(snapshotYear, snapshotMonth);
            alert('月末在庫を確定しました！');
        } catch (error) {
            console.error('Failed to save snapshot', error);
            alert('在庫の確定に失敗しました');
        } finally {
            setIsSnapshotLoading(false);
        }
    };

    const handleDownloadSnapshotPdf = async () => {
        try {
            await InventoryService.downloadSnapshotPdf(snapshotYear, snapshotMonth);
        } catch (error: any) {
            console.error('Failed to download PDF', error);
            alert(error.message || '月次在庫表のダウンロードに失敗しました。\n対象月の在庫が確定されているか確認してください。');
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

    const filteredParts = parts.filter(part => {
        if (sectionFilter && part.productCategory?.section !== sectionFilter) return false;
        if (lowStockFilter) {
            if (!part.alertEnabled) return false;
            if (part.stockQuantity > (part.alertThreshold ?? 5)) return false;
        }
        return true;
    });

    const totalInventoryValue = filteredParts.reduce((sum, part) => sum + (part.stockQuantity * part.standardCost), 0);

    const categorySummary = filteredParts.reduce((acc, part) => {
        const sectionName = part.productCategory?.section || '未分類';
        const value = part.stockQuantity * part.standardCost;
        acc[sectionName] = (acc[sectionName] || 0) + value;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>在庫管理</h1>
                    <p className={styles.subtitle}>在庫状況の確認と管理</p>
                </div>
                <div className={styles.headerControls}>
                    <div className={styles.snapshotControls}>
                        <select
                            value={snapshotYear}
                            onChange={e => setSnapshotYear(Number(e.target.value))}
                            className={styles.select}
                            style={{ padding: '0.25rem' }}
                        >
                            {[...Array(5)].map((_, i) => {
                                const y = new Date().getFullYear() - i;
                                return <option key={y} value={y}>{y}年</option>;
                            })}
                        </select>
                        <select
                            value={snapshotMonth}
                            onChange={e => setSnapshotMonth(Number(e.target.value))}
                            className={styles.select}
                            style={{ padding: '0.25rem' }}
                        >
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}月</option>
                            ))}
                        </select>
                        <Button variant="secondary" onClick={handleSaveSnapshot} disabled={isSnapshotLoading}>
                            {isSnapshotLoading ? '処理中...' : '月末在庫確定'}
                        </Button>
                        <Button variant="secondary" onClick={handleDownloadSnapshotPdf}>
                            月次在庫表PDF
                        </Button>
                    </div>
                    <Button icon={<Plus size={18} />} onClick={() => openForm()}>
                        在庫品登録
                    </Button>
                </div>
            </div>

            {/* Summary Dashboard */}
            <div className={styles.summaryDashboard}>
                <div className={`${styles.summaryCard} ${styles.summaryCardPrimary}`}>
                    <div className={styles.summaryTitle}>全体の在庫金額 (原価)</div>
                    <div className={styles.summaryValue}>{formatCurrency(totalInventoryValue)}</div>
                </div>
                <div className={styles.categoryGrid}>
                    {Object.entries(categorySummary).map(([category, value]) => (
                        <div key={category} className={styles.categoryCard}>
                            <div className={styles.categoryTitle}>{category}</div>
                            <div className={styles.categoryValue}>{formatCurrency(value)}</div>
                        </div>
                    ))}
                </div>
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
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                        className={styles.searchInput}
                        style={{ width: '200px', paddingLeft: '1rem' }}
                        value={sectionFilter}
                        onChange={(e) => setSectionFilter(e.target.value)}
                    >
                        <option value="">すべての部門</option>
                        {Array.from(new Set(categories.map(c => c.section))).sort().map(section => (
                            <option key={section} value={section}>{section}</option>
                        ))}
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-main)', cursor: 'pointer', background: 'white', padding: '0 1rem', height: '40px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <input
                            type="checkbox"
                            checked={lowStockFilter}
                            onChange={(e) => setLowStockFilter(e.target.checked)}
                            style={{ width: '16px', height: '16px' }}
                        />
                        在庫不足のみ
                    </label>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '8%' }}>部門</th>
                            <th style={{ width: '12%' }}>種別</th>
                            <th style={{ width: '15%' }}>部品番号 / 品番</th>
                            <th style={{ width: '25%' }}>部品名称</th>
                            <th style={{ width: '10%' }}>在庫数</th>
                            <th style={{ width: '10%' }}>標準売価</th>
                            <th style={{ width: '10%' }}>標準原価</th>
                            <th style={{ width: '10%' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={8}>
                                    <div style={{ padding: '2rem' }}>
                                        <LoadingSpinner />
                                    </div>
                                </td>
                            </tr>
                        ) : filteredParts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className={styles.emptyState}>
                                    データがありません
                                </td>
                            </tr>
                        ) : (
                            filteredParts.map(part => (
                                <tr key={part.id}>
                                    <td>{part.productCategory?.section || '-'}</td>
                                    <td>{part.productCategory?.name || '-'}</td>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>{part.code}</div>
                                        {part.partNumber && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>品番: {part.partNumber}</div>}
                                    </td>
                                    <td className={styles.partName}>
                                        {part.name}
                                        {part.alertEnabled && part.stockQuantity <= (part.alertThreshold ?? 5) && (
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
                                        <span className={`${styles.stockCount} ${part.alertEnabled && part.stockQuantity <= (part.alertThreshold ?? 5) ? styles.lowStock : ''}`}>
                                            {formatNumber(part.stockQuantity)} {part.unit || '個'}
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
                            <h2>{editingId ? '在庫品情報の編集' : '新規在庫品登録'}</h2>
                            <button className={styles.closeButton} onClick={() => setIsFormOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>部門</label>
                                    <select
                                        className={styles.select}
                                        value={selectedSection}
                                        onChange={handleMajorChange}
                                        required
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
                                        required
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
                            </div>

                            <div className={styles.formGrid}>
                                <Input
                                    label="部品番号 (自動採番)"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="種別を選択すると自動入力されます"
                                    required
                                />
                                <Input
                                    label="品番 (メーカー品番等)"
                                    name="partNumber"
                                    value={formData.partNumber || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className={styles.formGrid}>
                                <Input
                                    label="部品名称"
                                    name="name"
                                    value={formData.name}
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

                            <div className={styles.formGrid}>
                                <Input
                                    label="在庫数"
                                    name="stockQuantity"
                                    type="number"
                                    min="0"
                                    value={formData.stockQuantity}
                                    onChange={handleInputChange}
                                    required
                                />
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>単位</label>
                                    <select
                                        name="unit"
                                        value={formData.unit || '個'}
                                        onChange={handleInputChange}
                                        className={styles.select}
                                    >
                                        <option value="個">個</option>
                                        <option value="本">本</option>
                                        <option value="L">L (リットル)</option>
                                        <option value="箱">箱</option>
                                        <option value="セット">セット</option>
                                        <option value="枚">枚</option>
                                        <option value="台">台</option>
                                        <option value="式">式</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGrid}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', alignSelf: 'center', fontWeight: 'bold', color: 'var(--color-text-main)' }}>
                                    <input
                                        type="checkbox"
                                        name="alertEnabled"
                                        checked={formData.alertEnabled ?? false}
                                        onChange={handleInputChange}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    在庫数アラートを有効にする
                                </label>
                                {formData.alertEnabled && (
                                    <Input
                                        label="アラートの基準数 (これを下回るとアラート)"
                                        name="alertThreshold"
                                        type="number"
                                        min="0"
                                        value={formData.alertThreshold ?? 5}
                                        onChange={handleInputChange}
                                    />
                                )}
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
