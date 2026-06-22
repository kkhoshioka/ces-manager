
import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Plus, Search, Edit2, Trash2, Save, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import styles from '../Inventory.module.css';
import { API_BASE_URL } from '../../config';

interface SupplierContact {
    id?: number;
    name: string;
    position: string | null;
    mobile: string | null;
}

interface Supplier {
    id: number;
    name: string;
    code: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    fax?: string;
    invoiceRegistrationNumber?: string;

    bankName?: string;
    branchName?: string;
    accountType?: string;
    accountNumber?: string;
    accountHolder?: string;
    paymentTerms?: string;
    representativeName?: string | null;
    representativePhone?: string | null;
    postalCode?: string | null;
    closingDate?: string | null;
    contacts?: SupplierContact[];
    createdAt: string;
}

const SupplierMaster: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const fetchSuppliers = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/suppliers`);
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            }
        } catch (error) {
            console.error('Failed to fetch suppliers', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line
        fetchSuppliers();
    }, [fetchSuppliers]);


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = currentSupplier.id ? `${API_BASE_URL}/suppliers/${currentSupplier.id}` : `${API_BASE_URL}/suppliers`;
            const method = currentSupplier.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentSupplier)
            });

            if (res.ok) {
                fetchSuppliers();
                setIsModalOpen(false);
                setCurrentSupplier({});
            } else {
                alert('保存に失敗しました');
            }
        } catch (error) {
            console.error('Save failed', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/suppliers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchSuppliers();
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(`削除に失敗しました。\n理由: ${errorData.error || 'この仕入先に関連する案件や発注データが残っている可能性があります。'}`);
            }
        } catch (error) {
            console.error('Delete failed', error);
            alert('通信エラーが発生したため、削除できませんでした。');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.includes(searchQuery) ||
        (s.code && s.code.includes(searchQuery)) ||
        (s.contactPerson && s.contactPerson.includes(searchQuery))
    ).sort((a, b) => {
        if (!a.code) return 1;
        if (!b.code) return -1;
        return sortOrder === 'asc' 
            ? a.code.localeCompare(b.code)
            : b.code.localeCompare(a.code);
    });

    return (
        <div>
            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="仕入先名、コード、担当者で検索..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button icon={<Plus size={18} />} onClick={() => { setCurrentSupplier({}); setIsModalOpen(true); }}>
                    新規登録
                </Button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th 
                                style={{ cursor: 'pointer', userSelect: 'none', width: '150px' }}
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            >
                                仕入先コード {sortOrder === 'asc' ? '▲' : '▼'}
                            </th>
                            <th>仕入先名</th>
                            <th>担当者</th>
                            <th>電話番号</th>
                            <th>メールアドレス</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem' }}>
                                    <LoadingSpinner />
                                </td>
                            </tr>
                        ) : filteredSuppliers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={styles.emptyState}>データがありません</td>
                            </tr>
                        ) : (
                            filteredSuppliers.map(supplier => (
                                <tr key={supplier.id}>
                                    <td style={{ fontFamily: 'monospace' }}>{supplier.code || '-'}</td>
                                    <td style={{ fontWeight: 500 }}>{supplier.name}</td>
                                    <td>{supplier.contactPerson || '-'}</td>
                                    <td>{supplier.phone || '-'}</td>
                                    <td>{supplier.email || '-'}</td>
                                    <td>
                                        <div className={styles.actions} style={{ justifyContent: 'center' }}>
                                            <button className={styles.actionButton} onClick={() => { setCurrentSupplier(supplier); setIsModalOpen(true); }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDelete(supplier.id)}>
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
                    
<div className={styles.modal} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className={styles.modalHeader}>
                            <h2>{currentSupplier.id ? '仕入先編集' : '新規仕入先登録'}</h2>
                            <button type="button" className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className={styles.form}>
                            
                            {/* --- 基本情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem' }}>基本情報</h3>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="仕入先コード"
                                        value={currentSupplier.code || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, code: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="仕入先名"
                                        value={currentSupplier.name || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="メールアドレス"
                                        type="email"
                                        value={currentSupplier.email || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, email: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="電話番号 (代表)"
                                        value={currentSupplier.phone || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                                    />
                                    <Input
                                        label="FAX番号"
                                        value={currentSupplier.fax || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, fax: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="郵便番号"
                                        value={currentSupplier.postalCode || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, postalCode: e.target.value })}
                                        placeholder="例: 123-4567"
                                    />
                                </div>
                                <Input
                                    label="住所"
                                    value={currentSupplier.address || ''}
                                    onChange={e => setCurrentSupplier({ ...currentSupplier, address: e.target.value })}
                                />
                            </div>

                            {/* --- 代表者情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem' }}>代表者情報</h3>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="代表者名"
                                        value={currentSupplier.representativeName || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, representativeName: e.target.value })}
                                    />
                                    <Input
                                        label="代表者電話番号"
                                        value={currentSupplier.representativePhone || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, representativePhone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* --- 支払・口座情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem' }}>支払・口座情報</h3>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="インボイス登録番号"
                                        value={currentSupplier.invoiceRegistrationNumber || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, invoiceRegistrationNumber: e.target.value })}
                                        placeholder="T+13桁"
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
                                            締め日
                                        </label>
                                        <select
                                            value={currentSupplier.closingDate || ''}
                                            onChange={e => setCurrentSupplier({ ...currentSupplier, closingDate: e.target.value })}
                                            style={{
                                                padding: '0.625rem',
                                                borderRadius: '0.375rem',
                                                border: '1px solid #d1d5db',
                                                fontSize: '0.9375rem',
                                                width: '100%',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <option value="">(未設定)</option>
                                            <option value="5">5日</option>
                                            <option value="10">10日</option>
                                            <option value="15">15日</option>
                                            <option value="20">20日</option>
                                            <option value="25">25日</option>
                                            <option value="99">末日</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="支払条件"
                                        value={currentSupplier.paymentTerms || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, paymentTerms: e.target.value })}
                                        placeholder="例: 月末締め翌月末払い"
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="銀行名"
                                        value={currentSupplier.bankName || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, bankName: e.target.value })}
                                    />
                                    <Input
                                        label="支店名"
                                        value={currentSupplier.branchName || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, branchName: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
                                            口座種別
                                        </label>
                                        <select
                                            value={currentSupplier.accountType || ''}
                                            onChange={e => setCurrentSupplier({ ...currentSupplier, accountType: e.target.value })}
                                            style={{
                                                padding: '0.625rem',
                                                borderRadius: '0.375rem',
                                                border: '1px solid #d1d5db',
                                                fontSize: '0.9375rem',
                                                width: '100%',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <option value="">(未設定)</option>
                                            <option value="普通">普通</option>
                                            <option value="当座">当座</option>
                                        </select>
                                    </div>
                                    <Input
                                        label="口座番号"
                                        value={currentSupplier.accountNumber || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, accountNumber: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="口座名義"
                                        value={currentSupplier.accountHolder || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, accountHolder: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* --- 担当者情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', margin: 0 }}>担当者情報</h3>
                                    <Button 
                                        type="button" 
                                        variant="secondary" 
                                        icon={<Plus size={16} />}
                                        onClick={() => setCurrentSupplier({ ...currentSupplier, contacts: [...(currentSupplier.contacts || []), { name: '', position: '', mobile: '' }] })}
                                        style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                                    >
                                        追加
                                    </Button>
                                </div>
                                
                                {(!currentSupplier.contacts || currentSupplier.contacts.length === 0) ? (
                                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>担当者は登録されていません。</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {currentSupplier.contacts.map((contact, index) => (
                                            <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '6px', backgroundColor: 'white' }}>
                                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                                                    <Input
                                                        label="名前"
                                                        value={contact.name}
                                                        onChange={e => {
                                                            const newContacts = [...currentSupplier.contacts!];
                                                            newContacts[index].name = e.target.value;
                                                            setCurrentSupplier({ ...currentSupplier, contacts: newContacts });
                                                        }}
                                                        required
                                                    />
                                                    <Input
                                                        label="役職"
                                                        value={contact.position || ''}
                                                        onChange={e => {
                                                            const newContacts = [...currentSupplier.contacts!];
                                                            newContacts[index].position = e.target.value;
                                                            setCurrentSupplier({ ...currentSupplier, contacts: newContacts });
                                                        }}
                                                    />
                                                    <Input
                                                        label="電話番号・携帯番号"
                                                        value={contact.mobile || ''}
                                                        onChange={e => {
                                                            const newContacts = [...currentSupplier.contacts!];
                                                            newContacts[index].mobile = e.target.value;
                                                            setCurrentSupplier({ ...currentSupplier, contacts: newContacts });
                                                        }}
                                                    />
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const newContacts = currentSupplier.contacts!.filter((_, i) => i !== index);
                                                        setCurrentSupplier({ ...currentSupplier, contacts: newContacts });
                                                    }}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', marginTop: '1.5rem' }}
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={styles.formActions}>
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                    キャンセル
                                </Button>
                                <Button type="submit" icon={<Save size={16} />}>保存</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierMaster;
