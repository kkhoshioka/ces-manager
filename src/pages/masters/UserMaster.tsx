
import React, { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Plus, Trash2, X, Save } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import styles from '../Inventory.module.css';

interface UserProfile {
    id: string;
    email: string;
    role: string;
    name: string | null;
    createdAt: string;
}

const UserMaster: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('staff');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/users`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, role })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create user');
            }

            // Success
            fetchUsers();
            setShowModal(false);
            resetForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, email: string) => {
        if (!window.confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchUsers();
            } else {
                alert('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setName('');
        setRole('staff');
        setError(null);
    };

    if (loading) return <div className={styles.emptyState}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>ユーザー管理</h1>
                    <p className={styles.subtitle}>システム利用者の管理・登録</p>
                </div>
                <Button onClick={() => setShowModal(true)} icon={<Plus size={18} />}>
                    新規ユーザー登録
                </Button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>名前</th>
                            <th>メールアドレス</th>
                            <th>権限 (Role)</th>
                            <th>登録日</th>
                            <th style={{ textAlign: 'right' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td style={{ fontWeight: 500 }}>{user.name || '-'}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        backgroundColor: user.role === 'admin' ? '#f3e8ff' : '#d1fae5',
                                        color: user.role === 'admin' ? '#7e22ce' : '#047857'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleDelete(user.id, user.email)}
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            title="削除"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className={styles.emptyState}>データがありません</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{ maxWidth: '500px' }}>
                        <div className={styles.modalHeader}>
                            <h2>新規ユーザー登録</h2>
                            <button className={styles.closeButton} onClick={() => setShowModal(false)}>
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

                        <form onSubmit={handleCreate} className={styles.form}>
                            <div className={styles.formGroup}>
                                <Input
                                    label="メールアドレス (必須)"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <Input
                                    label="パスワード (必須: 6文字以上)"
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <Input
                                    label="名前"
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>権限</label>
                                <select
                                    className={styles.select}
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                >
                                    <option value="staff">Staff (一般)</option>
                                    <option value="admin">Admin (管理者)</option>
                                </select>
                            </div>

                            <div className={styles.formActions}>
                                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                                    キャンセル
                                </Button>
                                <Button type="submit" disabled={isSubmitting} icon={<Save size={16} />}>
                                    {isSubmitting ? '登録中...' : '登録'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMaster;
