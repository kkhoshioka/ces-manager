import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';
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
        type: ''
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
            type: customer.type || ''
        });
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingId(null);
        setEditingId(null);
        setFormData({ code: '', name: '', address: '', phone: '', email: '', type: '' });
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
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</td></tr>
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
                            <div>
                                <Input
                                    label="得意先種別"
                                    value={formData.type || ''}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    list="customer-types"
                                    placeholder="例: ユーザー, 修理業者, 機械メーカー"
                                />
                                <datalist id="customer-types">
                                    <option value="ユーザー" />
                                    <option value="修理業者" />
                                    <option value="機械メーカー" />
                                    <option value="レンタル会社" />
                                </datalist>
                            </div>
                            <div className={styles.formGrid}>
                                <Input
                                    label="電話番号"
                                    value={formData.phone || ''}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <Input
                                label="住所"
                                value={formData.address || ''}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
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
