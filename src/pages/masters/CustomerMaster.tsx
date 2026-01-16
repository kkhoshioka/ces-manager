import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { API_BASE_URL } from '../../config';
import styles from '../Inventory.module.css';

interface Customer {
    id: number;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    type: string | null;
    fax?: string | null;
    invoiceRegistrationNumber?: string | null;
    invoiceMailingAddress?: string | null;
    paymentTerms?: string | null;
    contactPerson?: string | null;
    closingDate?: string | null;
}

const CustomerMaster: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
        code: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        type: '',
        fax: '',
        invoiceRegistrationNumber: '',
        invoiceMailingAddress: '',
        paymentTerms: '',
        contactPerson: '',
        closingDate: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/customers`);
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
                setFilteredCustomers(data);
            }
        } catch (error) {
            console.error('Failed to fetch customers', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        setFilteredCustomers(
            customers.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.code.toLowerCase().includes(query) ||
                (c.type && c.type.toLowerCase().includes(query))
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `${API_BASE_URL}/customers/${editingId}`
                : `${API_BASE_URL}/customers`;

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchCustomers();
            } else {
                alert('保存に失敗しました。サーバーのエラーを確認してください。');
            }
        } catch (error) {
            console.error('Failed to save customer', error);
            alert('通信エラーが発生しました。');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchCustomers();
            }
        } catch (error) {
            console.error('Failed to delete customer', error);
        }
    };

    const openEdit = (customer: Customer) => {
        setEditingId(customer.id);
        setFormData({
            code: customer.code,
            name: customer.name,
            address: customer.address || '',
            phone: customer.phone || '',
            email: customer.email || '',
            type: customer.type || '',
            fax: customer.fax || '',
            invoiceRegistrationNumber: customer.invoiceRegistrationNumber || '',
            invoiceMailingAddress: customer.invoiceMailingAddress || '',
            paymentTerms: customer.paymentTerms || '',
            contactPerson: customer.contactPerson || '',
            closingDate: customer.closingDate || ''
        });
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingId(null);
        setFormData({
            code: '',
            name: '',
            address: '',
            phone: '',
            email: '',
            type: '',
            fax: '',
            invoiceRegistrationNumber: '',
            invoiceMailingAddress: '',
            paymentTerms: '',
            contactPerson: '',
            closingDate: ''
        });
        setIsModalOpen(true);
    };

    return (
        <div>
            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="顧客名、コード、種別で検索..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
                <Button icon={<Plus size={18} />} onClick={openAdd}>
                    新規登録
                </Button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>コード</th>
                            <th>顧客名</th>
                            <th>種別</th>
                            <th>電話番号</th>
                            <th>住所</th>
                            <th style={{ width: '100px' }}>アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} style={{ padding: '2rem' }}><LoadingSpinner /></td></tr>
                        ) : filteredCustomers.length === 0 ? (
                            <tr><td colSpan={5} className={styles.emptyState}>データがありません</td></tr>
                        ) : (
                            filteredCustomers.map(customer => (
                                <tr key={customer.id}>
                                    <td className={styles.partNumber}>{customer.code}</td>
                                    <td>{customer.name}</td>
                                    <td>
                                        {customer.type && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                backgroundColor: '#f1f5f9',
                                                color: '#475569',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                {customer.type}
                                            </span>
                                        )}
                                    </td>
                                    <td>{customer.phone || '-'}</td>
                                    <td>{customer.address || '-'}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionButton} onClick={() => openEdit(customer)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDelete(customer.id)}>
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
                    <div className={styles.modal} style={{ maxWidth: '600px' }}>
                        <div className={styles.modalHeader}>
                            <h2>{editingId ? '顧客編集' : '新規顧客登録'}</h2>
                            <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGrid}>
                                <Input
                                    label="顧客コード"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    required
                                />
                                <Input
                                    label="顧客名"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.formGrid}>
                                <Input
                                    label="得意先種別"
                                    value={formData.type || ''}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    list="customer-types"
                                    placeholder="例: ユーザー, 修理業者"
                                />
                                <datalist id="customer-types">
                                    <option value="ユーザー" />
                                    <option value="修理業者" />
                                    <option value="機械メーカー" />
                                    <option value="レンタル会社" />
                                </datalist>
                                <Input
                                    label="担当者名"
                                    value={formData.contactPerson || ''}
                                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGrid}>
                                <Input
                                    label="電話番号"
                                    value={formData.phone || ''}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                                <Input
                                    label="FAX番号"
                                    value={formData.fax || ''}
                                    onChange={e => setFormData({ ...formData, fax: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGrid}>
                                <Input
                                    label="メールアドレス"
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                                <Input
                                    label="インボイス登録番号"
                                    value={formData.invoiceRegistrationNumber || ''}
                                    onChange={e => setFormData({ ...formData, invoiceRegistrationNumber: e.target.value })}
                                    placeholder="T+13桁"
                                />
                            </div>

                            <div className={styles.formGrid}>
                                <Input
                                    label="支払条件"
                                    value={formData.paymentTerms || ''}
                                    onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                                    placeholder="例: 月末締め翌月末払い"
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
                                        締め日 (請求書発行用)
                                    </label>
                                    <select
                                        value={formData.closingDate || ''}
                                        onChange={e => setFormData({ ...formData, closingDate: e.target.value })}
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

                            <Input
                                label="住所"
                                value={formData.address || ''}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                            <Input
                                label="請求書送付先住所（住所と異なる場合）"
                                value={formData.invoiceMailingAddress || ''}
                                onChange={e => setFormData({ ...formData, invoiceMailingAddress: e.target.value })}
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

export default CustomerMaster;
