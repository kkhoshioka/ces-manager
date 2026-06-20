import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ChevronLeft, ChevronRight, FileText, Settings, ChevronDown, ChevronUp, Plus, X, Edit, Save } from 'lucide-react';
import styles from '../Dashboard.module.css';
import { formatCurrency } from '../../utils/formatting';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface SupplierCost {
    name: string;
    totalCost: number;
    count: number;
}

interface SupplierDetail {
    id: number;
    date: string;
    customerName: string;
    machineModel: string;
    serialNumber: string;
    description: string;
    quantity: number;
    unitCost: number;
    amount: number;
    isInvoiceReceived: boolean;
    isPaid: boolean;
    isPurchase?: boolean;
    purchaseId?: number;
}

const SupplierMonthlyReport = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [data, setData] = useState<SupplierCost[]>([]);
    const [loading, setLoading] = useState(false);

    // Drill-down state
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [detailData, setDetailData] = useState<SupplierDetail[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    // Purchase Modal State
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [purchaseForm, setPurchaseForm] = useState({
        id: null as number | null,
        date: new Date().toISOString().split('T')[0],
        supplierId: '' as number | '',
        supplierName: '',
        department: '',
        description: '',
        category: '仕入販売',
        type: 'part',
        partNumber: '',
        quantity: 1,
        unitCost: 0,
        isInvoiceReceived: false,
        isPaid: false,
        projectId: '' as number | '',
        productId: '' as number | '',
        productCategoryId: null as number | null
    });

    const [suppliersList, setSuppliersList] = useState<any[]>([]);
    const [projectsList, setProjectsList] = useState<any[]>([]);
    const [productsList, setProductsList] = useState<any[]>([]);
    const [categoriesList, setCategoriesList] = useState<any[]>([]);

    useEffect(() => {
        // Fetch data for options
        const fetchOptions = async () => {
            try {
                const [supRes, projRes, prodRes, catRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/suppliers`),
                    fetch(`${API_BASE_URL}/projects`),
                    fetch(`${API_BASE_URL}/products`),
                    fetch(`${API_BASE_URL}/product-categories`)
                ]);
                if (supRes.ok) setSuppliersList(await supRes.json());
                if (projRes.ok) {
                    const projs = await projRes.json();
                    setProjectsList(projs.slice(0, 100));
                }
                if (prodRes.ok) setProductsList(await prodRes.json());
                if (catRes.ok) setCategoriesList(await catRes.json());
            } catch (err) {
                console.error('Error fetching options', err);
            }
        };
        fetchOptions();
    }, []);

    const handlePurchaseSave = async () => {
        try {
            const method = purchaseForm.id ? 'PUT' : 'POST';
            const url = purchaseForm.id ? `${API_BASE_URL}/purchases/${purchaseForm.id}` : `${API_BASE_URL}/purchases`;
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseForm)
            });
            
            if (!res.ok) throw new Error('Failed to save purchase');
            
            setIsPurchaseModalOpen(false);
            fetchReport(); // Refresh
            if (selectedSupplier) {
                handleRowClick(selectedSupplier); // Refresh drill-down if open
            }
        } catch (err) {
            console.error(err);
            alert('保存に失敗しました');
        }
    };

    const fetchReport = React.useCallback(async () => {
        setLoading(true);
        setSelectedSupplier(null); // Reset selection on month change
        setDetailData([]);
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
    }, [year, month]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleEditPurchase = (detail: SupplierDetail) => {
        if (!detail.isPurchase || !detail.purchaseId) return;
        // Fetch purchase details and open modal
        fetch(`${API_BASE_URL}/purchases?id=${detail.purchaseId}`)
            .then(res => res.json())
            .then(data => {
                const purchase = Array.isArray(data) ? data.find(p => p.id === detail.purchaseId) : data;
                if (purchase) {
                    setPurchaseForm({
                        id: purchase.id,
                        date: new Date(purchase.date).toISOString().split('T')[0],
                        supplierId: purchase.supplierId || '',
                        supplierName: purchase.supplierName || '',
                        department: purchase.department || '',
                        description: purchase.description,
                        category: purchase.category,
                        type: purchase.type || '',
                        partNumber: purchase.partNumber || '',
                        quantity: Number(purchase.quantity),
                        unitCost: Number(purchase.unitCost),
                        isInvoiceReceived: purchase.isInvoiceReceived,
                        isPaid: purchase.isPaid,
                        projectId: purchase.projectId || '',
                        productId: purchase.productId || '',
                        productCategoryId: purchase.projectDetail?.productCategoryId || null
                    });
                    setIsPurchaseModalOpen(true);
                }
            })
            .catch(err => console.error(err));
    };

    const handleDetailStatusChange = async (detailId: number | string, field: 'isInvoiceReceived' | 'isPaid', value: boolean, isPurchase?: boolean, purchaseId?: number) => {
        // Optimistic update
        setDetailData(prev => prev.map(item =>
            item.id === detailId ? { ...item, [field]: value } : item
        ));

        try {
            const endpoint = isPurchase ? `${API_BASE_URL}/purchases/${purchaseId}/status` : `${API_BASE_URL}/project-details/${detailId}/status`;
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });

            if (!response.ok) throw new Error('Failed to update status');

        } catch (error) {
            console.error(error);
            alert('ステータスの更新に失敗しました');
            fetchReport();
        }
    };

    const handleBatchStatusChange = async (targetItems: SupplierDetail[], field: 'isInvoiceReceived' | 'isPaid', value: boolean, label: string) => {
        if (!confirm(`${label} の全明細を「${field === 'isInvoiceReceived' ? '請求書受領済' : '支払済'}」に更新しますか？`)) return;
        
        setDetailLoading(true);
        try {
            await Promise.all(targetItems.map(async (item) => {
                if (item[field] === value) return;
                
                const endpoint = item.isPurchase ? `${API_BASE_URL}/purchases/${item.purchaseId}/status` : `${API_BASE_URL}/project-details/${item.id}/status`;
                
                return fetch(endpoint, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [field]: value })
                });
            }));

            // Refresh details
            if (selectedSupplier) {
                const response = await fetch(`${API_BASE_URL}/dashboard/supplier-details?year=${year}&month=${month}&supplier=${encodeURIComponent(selectedSupplier)}`);
                if (response.ok) {
                    const result = await response.json();
                    const sorted = Array.isArray(result) 
                        ? [...result].sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''))
                        : [];
                    setDetailData(sorted);
                }
            }
        } catch (error) {
            console.error(error);
            alert('一括更新に失敗しました');
        } finally {
            setDetailLoading(true);
            setTimeout(() => setDetailLoading(false), 300);
        }
    };

    const handleRowClick = async (supplierName: string) => {
        if (selectedSupplier === supplierName) {
            setSelectedSupplier(null); // Toggle off
            return;
        }

        setSelectedSupplier(supplierName);
        setDetailLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/supplier-details?year=${year}&month=${month}&supplier=${encodeURIComponent(supplierName)}`);
            if (response.ok) {
                const result = await response.json();
                // Sort by customer name for better grouping
                const sorted = Array.isArray(result) 
                    ? [...result].sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''))
                    : [];
                setDetailData(sorted);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setDetailLoading(false);
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

    const totalPeriodCost = data.reduce((sum, item) => sum + item.totalCost, 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div>
                        <h1 className={styles.title}>仕入・原価管理</h1>
                        <p className={styles.subtitle}>仕入登録および仕入先ごとの原価発生状況を月次で確認</p>
                    </div>
                    <Button variant="primary" onClick={() => { setPurchaseForm({ id: null, date: new Date().toISOString().split('T')[0], supplierId: '', supplierName: '', department: '', description: '', category: '仕入販売', type: '', partNumber: '', quantity: 1, unitCost: 0, isInvoiceReceived: false, isPaid: false, projectId: '', productId: '', productCategoryId: null }); setIsPurchaseModalOpen(true); }} icon={<Plus size={18} />}>
                        新規仕入登録
                    </Button>
                </div>
                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <Button variant="ghost" onClick={handlePrevMonth} icon={<ChevronLeft size={18} />}>
                            前月
                        </Button>
                        <div style={{ padding: '0 1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {year}年 {month}月
                        </div>
                        <Button variant="ghost" onClick={handleNextMonth}>
                            翌月 <ChevronRight size={18} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        </Button>
                    </div>
                </div>
            </div>

            {isPurchaseModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '650px', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div className={styles.modalHeader} style={{ backgroundColor: '#f8fafc', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={20} color="#3b82f6" />
                                {purchaseForm.id ? '仕入明細の編集' : '新規仕入登録'}
                            </h3>
                            <button onClick={() => setIsPurchaseModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody} style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                                <div className={styles.formGroup}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>仕入日</label>
                                    <input type="date" value={purchaseForm.date} onChange={e => setPurchaseForm({...purchaseForm, date: e.target.value})} style={{ width: '100%', padding: '0.625rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', transition: 'border-color 0.2s' }} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>仕入先</label>
                                    <select value={purchaseForm.supplierId} onChange={e => {
                                        const id = Number(e.target.value);
                                        const sup = suppliersList.find(s => s.id === id);
                                        setPurchaseForm({...purchaseForm, supplierId: id || '', supplierName: sup ? sup.name : ''});
                                    }} style={{ width: '100%', padding: '0.625rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#fff' }}>
                                        <option value="">選択してください</option>
                                        {suppliersList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div style={{ backgroundColor: '#f1f5f9', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#334155', margin: '0 0 1rem 0' }}>明細情報</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>カテゴリ</label>
                                        <select value={purchaseForm.category} onChange={e => setPurchaseForm({...purchaseForm, category: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                            <option value="仕入販売">仕入販売</option>
                                            <option value="外注費">外注費</option>
                                            <option value="在庫">在庫</option>
                                            <option value="その他">その他</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>部門</label>
                                        <select value={purchaseForm.department} onChange={e => setPurchaseForm({...purchaseForm, department: e.target.value, productCategoryId: null, type: ''})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                            <option value="">-</option>
                                            {Array.from(new Set(categoriesList.map(c => c.section))).map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>種別</label>
                                        <select value={purchaseForm.productCategoryId || ''} onChange={e => {
                                            const val = e.target.value ? Number(e.target.value) : null;
                                            const cat = categoriesList.find(c => c.id === val);
                                            setPurchaseForm({...purchaseForm, productCategoryId: val, type: cat ? cat.name : ''});
                                        }} disabled={!purchaseForm.department} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                            <option value="">-</option>
                                            {categoriesList.filter(c => c.section === purchaseForm.department).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>品番</label>
                                        <input type="text" value={purchaseForm.partNumber} onChange={e => setPurchaseForm({...purchaseForm, partNumber: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>品名・内容</label>
                                        <input type="text" value={purchaseForm.description} onChange={e => setPurchaseForm({...purchaseForm, description: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>数量</label>
                                        <input type="number" value={purchaseForm.quantity} onChange={e => setPurchaseForm({...purchaseForm, quantity: Number(e.target.value)})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>単価</label>
                                        <input type="number" value={purchaseForm.unitCost} onChange={e => setPurchaseForm({...purchaseForm, unitCost: Number(e.target.value)})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} />
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ backgroundColor: '#fff', border: '1px dashed #cbd5e1', padding: '1.25rem', borderRadius: '8px' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#334155', margin: '0 0 1rem 0' }}>プロジェクト・在庫 紐付け</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>案件に紐付け</label>
                                        <select 
                                            value={purchaseForm.projectId} 
                                            onChange={e => setPurchaseForm({...purchaseForm, projectId: e.target.value ? Number(e.target.value) : '', productId: ''})}
                                            disabled={!!purchaseForm.productId}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: !!purchaseForm.productId ? '#f1f5f9' : '#fff' }}
                                        >
                                            <option value="">未紐付（案件を選択）</option>
                                            {projectsList.map(p => <option key={p.id} value={p.id}>ID:{p.id} {p.customer?.name} - {p.machineModel || '不明'}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>在庫機材に紐付け (入庫)</label>
                                        <select 
                                            value={purchaseForm.productId} 
                                            onChange={e => setPurchaseForm({...purchaseForm, productId: e.target.value ? Number(e.target.value) : '', projectId: ''})}
                                            disabled={!!purchaseForm.projectId}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: !!purchaseForm.projectId ? '#f1f5f9' : '#fff' }}
                                        >
                                            <option value="">未紐付（在庫機材を選択）</option>
                                            {productsList.map(p => <option key={p.id} value={p.id}>{p.name} (在庫: {p.stockQuantity})</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter} style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button variant="secondary" onClick={() => setIsPurchaseModalOpen(false)}>キャンセル</Button>
                            <Button variant="primary" onClick={handlePurchaseSave} icon={<Save size={16} />}>保存して適用</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.legendCard} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={16} /> 項目の説明
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <strong style={{ color: '#1e293b' }}>● 請求書（受領）:</strong> 
                        <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>仕入先から当月分の請求書が届いているかを確認するチェックです。</span>
                    </div>
                    <div>
                        <strong style={{ color: '#1e293b' }}>● 支払（完了）:</strong> 
                        <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>その仕入先への支払いが完了したかを確認するチェックです。</span>
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
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem' }}>
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        データがありません
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <>
                                        <tr
                                            key={index}
                                            onClick={() => handleRowClick(item.name)}
                                            style={{ cursor: 'pointer', backgroundColor: selectedSupplier === item.name ? '#eff6ff' : undefined }}
                                        >
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
                                            <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                                                {selectedSupplier === item.name ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </td>
                                        </tr>
                                        {selectedSupplier === item.name && (
                                            <tr className={styles.detailRow}>
                                                <td colSpan={5} style={{ padding: '0', borderBottom: '2px solid #e2e8f0' }}>
                                                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                                                            <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                                                                {item.name} の取引明細 (顧客順)
                                                            </h3>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <Button variant="ghost" size="sm" onClick={() => handleBatchStatusChange(detailData, 'isInvoiceReceived', true, selectedSupplier || '')} style={{ fontSize: '0.75rem', padding: '4px 12px', border: '1px solid #e2e8f0' }}>
                                                                    全明細を請求書受領済にする
                                                                </Button>
                                                                <Button variant="ghost" size="sm" onClick={() => handleBatchStatusChange(detailData, 'isPaid', true, selectedSupplier || '')} style={{ fontSize: '0.75rem', padding: '4px 12px', border: '1px solid #e2e8f0' }}>
                                                                    全明細を支払済にする
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>日付</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>顧客名</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>機種 / S/N</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>品名</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '100px' }} title="仕入先から請求書を受領したか">請求書(受領)</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '100px' }} title="仕入先への支払いが完了したか">支払(完了)</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>数量</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>単価</th>
                                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>金額</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {detailLoading ? (
                                                                        <tr><td colSpan={9} style={{ padding: '1rem', textAlign: 'center' }}>読み込み中...</td></tr>
                                                                    ) : detailData.length === 0 ? (
                                                                        <tr><td colSpan={9} style={{ padding: '1rem', textAlign: 'center' }}>明細データなし</td></tr>
                                                                    ) : (() => {
                                                                        // Pre-group data for rendering
                                                                        const groups: { key: string, items: SupplierDetail[] }[] = [];
                                                                        detailData.forEach(d => {
                                                                            const key = `${new Date(d.date).toLocaleDateString()}_${d.customerName}_${d.machineModel}`;
                                                                            if (groups.length === 0 || groups[groups.length - 1].key !== key) {
                                                                                groups.push({ key, items: [d] });
                                                                            } else {
                                                                                groups[groups.length - 1].items.push(d);
                                                                            }
                                                                        });

                                                                        return groups.map((group) => (
                                                                            <React.Fragment key={group.key}>
                                                                                <tr style={{ backgroundColor: '#f8fafc' }}>
                                                                                    <td colSpan={4} style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', borderTop: '1px solid #e2e8f0' }}>
                                                                                        【案件】{group.key.replace(/_/g, ' / ')}
                                                                                    </td>
                                                                                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                                                                                        <button 
                                                                                            onClick={() => handleBatchStatusChange(group.items, 'isInvoiceReceived', true, 'この案件')}
                                                                                            style={{ fontSize: '0.7rem', padding: '1px 4px', cursor: 'pointer', borderRadius: '3px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                                                                                            title="この案件の全明細を受領済にする"
                                                                                        >
                                                                                            一括
                                                                                        </button>
                                                                                    </td>
                                                                                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                                                                                        <button 
                                                                                            onClick={() => handleBatchStatusChange(group.items, 'isPaid', true, 'この案件')}
                                                                                            style={{ fontSize: '0.7rem', padding: '1px 4px', cursor: 'pointer', borderRadius: '3px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                                                                                            title="この案件の全明細を支払済にする"
                                                                                        >
                                                                                            一括
                                                                                        </button>
                                                                                    </td>
                                                                                    <td colSpan={3} style={{ borderTop: '1px solid #e2e8f0' }}></td>
                                                                                </tr>
                                                                                {group.items.map((d, idx) => (
                                                                                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                                        <td style={{ padding: '0.5rem', color: idx === 0 ? 'inherit' : '#94a3b8' }}>
                                                                                            {idx === 0 ? new Date(d.date).toLocaleDateString() : '〃'}
                                                                                        </td>
                                                                                        <td style={{ padding: '0.5rem', color: idx === 0 ? 'inherit' : '#94a3b8' }}>
                                                                                            {idx === 0 ? d.customerName : '〃'}
                                                                                        </td>
                                                                                        <td style={{ padding: '0.5rem', color: idx === 0 ? 'inherit' : '#94a3b8' }}>
                                                                                            {idx === 0 ? (
                                                                                                <>
                                                                                                    {d.machineModel}<br />
                                                                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.serialNumber}</span>
                                                                                                </>
                                                                                            ) : '〃'}
                                                                                        </td>
                                                                                        <td style={{ padding: '0.5rem' }}>{d.description}</td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={!!d.isInvoiceReceived}
                                                                                                onChange={(e) => handleDetailStatusChange(d.id, 'isInvoiceReceived', e.target.checked)}
                                                                                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                                                                title="請求書受領"
                                                                                            />
                                                                                        </td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={!!d.isPaid}
                                                                                                onChange={(e) => handleDetailStatusChange(d.id, 'isPaid', e.target.checked)}
                                                                                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                                                                title="支払完了"
                                                                                            />
                                                                                        </td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{d.quantity}</td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(d.unitCost)}</td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(d.amount)}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </React.Fragment>
                                                                        ));
                                                                    })()}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
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
