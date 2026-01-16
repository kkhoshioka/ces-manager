
import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Plus, Search, Edit2, Trash2, Save, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import styles from '../Inventory.module.css';
import { API_BASE_URL } from '../../config';

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
    createdAt: string;
}

const SupplierMaster: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

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
                alert('削除に失敗しました');
            }
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.includes(searchQuery) ||
        (s.code && s.code.includes(searchQuery)) ||
        (s.contactPerson && s.contactPerson.includes(searchQuery))
    );

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
                            <th>コード</th>
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
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{currentSupplier.id ? '仕入先編集' : '新規仕入先登録'}</h2>
                            <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className={styles.form} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className={styles.formGrid}>
                                <Input
                                    label="仕入先コード"
                                    value={currentSupplier.code || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, code: e.target.value })}
                                />
                                <Input
                                    label="仕入先名 (必須)"
                                    value={currentSupplier.name || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.formGrid}>
                                <Input
                                    label="担当者名"
                                    value={currentSupplier.contactPerson || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, contactPerson: e.target.value })}
                                />
                                <Input
                                    label="電話番号"
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGrid}>
                                <Input
                                    label="FAX番号"
                                    value={currentSupplier.fax || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, fax: e.target.value })}
                                />
                                <Input
                                    label="メールアドレス"
                                    value={currentSupplier.email || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, email: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGrid}>
                                <Input
                                    label="インボイス登録番号"
                                    value={currentSupplier.invoiceRegistrationNumber || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, invoiceRegistrationNumber: e.target.value })}
                                    placeholder="T+13桁の番号"
                                />
                                <Input
                                    label="支払条件"
                                    value={currentSupplier.paymentTerms || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, paymentTerms: e.target.value })}
                                    placeholder="例: 月末締め翌月末払い"
                                />
                            </div>

                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0.5rem 0 0.25rem', color: '#4b5563' }}>口座情報</h3>
                            <div className={styles.formGrid}>
                                <Input
                                    label="銀行名"
                                    value={currentSupplier.bankName || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, bankName: e.target.value })}
                                    placeholder="例: 〇〇銀行"
                                />
                                <Input
                                    label="支店名"
                                    value={currentSupplier.branchName || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, branchName: e.target.value })}
                                    placeholder="例: 〇〇支店"
                                />
                            </div>
                            <div className={styles.formGrid}>
                                <Input
                                    label="口座種別"
                                    value={currentSupplier.accountType || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, accountType: e.target.value })}
                                    placeholder="例: 普通、当座"
                                />
                                <Input
                                    label="口座番号"
                                    value={currentSupplier.accountNumber || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, accountNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <Input
                                    label="口座名義"
                                    value={currentSupplier.accountHolder || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, accountHolder: e.target.value })}
                                    placeholder="例: カ）シーイーエス"
                                />
                            </div>

                            <div style={{ marginTop: '0.5rem' }}>
                                <Input
                                    label="住所"
                                    value={currentSupplier.address || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, address: e.target.value })}
                                />
                            </div>

                            <div className={styles.formActions}>
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>キャンセル</Button>
                                <Button type="submit" icon={<Save size={16} />}>保存</Button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default SupplierMaster;
