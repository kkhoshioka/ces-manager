
import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Plus, Trash2, X, Save, Eye, EyeOff, UserCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import styles from '../Inventory.module.css';
import { preventImplicitSubmit } from '../../utils/formUtils';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
    id: string;
    email: string;
    role: string;
    name: string | null;
    createdAt: string;
}

const UserMaster: React.FC = () => {
    const { user: currentUser, isAdmin } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // パスワードは既定で伏字。管理者は目のアイコンで打った内容を確認できる。
    const [showPassword, setShowPassword] = useState(false);

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
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
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
        setShowPassword(false);
        setError(null);
    };

    // 今ログインしているのが誰かを一覧から引く。プロフィールが未登録でも
    // ログイン中のメールアドレスは出せるようにしておく。
    const isCurrentUser = (u: UserProfile) =>
        !!currentUser && (u.id === currentUser.id || u.email === currentUser.email);
    const currentProfile = users.find(isCurrentUser);
    const currentUserLabel = currentProfile?.name || currentUser?.email || '不明';

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

            {/* 今どのIDで操作しているかが分かるようにする */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                padding: '0.6rem 0.9rem',
                marginBottom: '1rem',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                color: '#1e3a8a'
            }}>
                <UserCircle size={18} />
                <span>ログイン中：</span>
                <strong>{currentUserLabel}</strong>
                {currentProfile?.name && (
                    <span style={{ color: '#3b82f6' }}>（{currentProfile.email}）</span>
                )}
                <span style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: isAdmin ? '#f3e8ff' : '#d1fae5',
                    color: isAdmin ? '#7e22ce' : '#047857'
                }}>
                    {isAdmin ? 'admin' : 'staff'}
                </span>
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
                        {loading ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem' }}>
                                    <LoadingSpinner />
                                </td>
                            </tr>
                        ) : users.map((user) => {
                            const isMe = isCurrentUser(user);
                            return (
                            <tr key={user.id} className={isMe ? styles.highlightRow : undefined}>
                                <td style={{ fontWeight: 500 }}>
                                    {user.name || '-'}
                                    {isMe && (
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '0.1rem 0.45rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            backgroundColor: '#2563eb',
                                            color: 'white'
                                        }}>ログイン中</span>
                                    )}
                                </td>
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
                                        {/* ログイン中の自分を消すと操作できなくなるため押せないようにする */}
                                        <button
                                            onClick={() => handleDelete(user.id, user.email)}
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            disabled={isMe}
                                            style={isMe ? { opacity: 0.3, cursor: 'not-allowed' } : undefined}
                                            title={isMe ? 'ログイン中のユーザーは削除できません' : '削除'}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
                        {!loading && users.length === 0 && (
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

                        <form onSubmit={handleCreate} onKeyDown={preventImplicitSubmit} className={styles.form}>
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
                                {/* 既定では伏字。管理者は目のアイコンで入力内容を確認できる。 */}
                                <div style={{ position: 'relative' }}>
                                    <Input
                                        label="パスワード (必須: 6文字以上)"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        style={isAdmin ? { paddingRight: '2.75rem' } : undefined}
                                    />
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示する'}
                                            title={showPassword ? 'パスワードを隠す' : 'パスワードを表示する'}
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                bottom: 0,
                                                height: '40px',
                                                width: '2.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'none',
                                                border: 'none',
                                                color: '#64748b',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    )}
                                </div>
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
