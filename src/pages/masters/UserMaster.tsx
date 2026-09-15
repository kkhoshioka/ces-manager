
import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Plus, Trash2, X, Save, Eye, EyeOff, UserCircle, KeyRound, RefreshCw } from 'lucide-react';
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
    const { user: currentUser, isAdmin, session } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // パスワードは既定で伏字。管理者は目のアイコンで打った内容を確認できる。
    const [showPassword, setShowPassword] = useState(false);

    // パスワード再設定
    const [resetTarget, setResetTarget] = useState<UserProfile | null>(null);
    const [resetPassword, setResetPassword] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const [resetDone, setResetDone] = useState(false);

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

    // サーバー側で管理者かどうかを見るようになったので、どの呼び出しにもトークンを付ける
    const authHeaders = (): Record<string, string> => ({
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/users`, { headers: authHeaders() });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
                setError(null);
            } else {
                // 権限チェックを入れたので、期限切れ等で弾かれたときに黙って空にならないようにする
                const data = await response.json().catch(() => ({}));
                setError(data.error || 'ユーザー一覧を取得できませんでした');
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
            setError('ユーザー一覧の取得に失敗しました');
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
                headers: authHeaders(),
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
                method: 'DELETE',
                headers: authHeaders()
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

    const openResetModal = (user: UserProfile) => {
        setResetTarget(user);
        setResetPassword('');
        setShowResetPassword(false);
        setResetError(null);
        setResetDone(false);
    };

    /** 覚えやすく、そこそこ安全な仮パスワードを作る（紛らわしい 0/O/1/l は使わない） */
    const generatePassword = () => {
        const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const picked = Array.from(
            crypto.getRandomValues(new Uint32Array(10)),
            n => chars[n % chars.length]
        ).join('');
        setResetPassword(picked);
        setShowResetPassword(true);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetTarget) return;
        setResetError(null);
        setIsResetting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${resetTarget.id}/password`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ password: resetPassword })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'パスワードの再設定に失敗しました');
            }
            // 新しいパスワードを本人に伝えてもらうため、閉じずに画面に残す
            setResetDone(true);
            setShowResetPassword(true);
        } catch (err) {
            setResetError(err instanceof Error ? err.message : '不明なエラー');
        } finally {
            setIsResetting(false);
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

            {error && !showModal && (
                <div style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                }}>
                    {error}
                </div>
            )}

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
                                        <button
                                            onClick={() => openResetModal(user)}
                                            className={styles.actionButton}
                                            title="パスワードを再設定"
                                        >
                                            <KeyRound size={16} />
                                        </button>
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

            {resetTarget && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{ maxWidth: '480px' }}>
                        <div className={styles.modalHeader}>
                            <h2>パスワードの再設定</h2>
                            <button className={styles.closeButton} onClick={() => setResetTarget(null)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '0 1.5rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                fontSize: '0.9rem'
                            }}>
                                <div style={{ fontWeight: 600 }}>{resetTarget.name || '(名前なし)'}</div>
                                <div style={{ color: '#64748b' }}>{resetTarget.email}</div>
                            </div>
                        </div>

                        {resetDone ? (
                            <div style={{ padding: '0 1.5rem 1.5rem' }}>
                                <div style={{
                                    padding: '1rem',
                                    background: '#f0fdf4',
                                    border: '1px solid #86efac',
                                    borderRadius: '0.5rem',
                                    color: '#166534',
                                    fontSize: '0.9rem'
                                }}>
                                    パスワードを再設定しました。<br />
                                    下の新しいパスワードを本人にお伝えください。この画面を閉じると二度と表示できません。
                                </div>
                                <div style={{
                                    marginTop: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    background: '#0f172a',
                                    color: 'white',
                                    borderRadius: '0.5rem',
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                    fontSize: '1.1rem',
                                    letterSpacing: '0.05em',
                                    wordBreak: 'break-all'
                                }}>
                                    {resetPassword}
                                </div>
                                <div className={styles.formActions} style={{ marginTop: '1rem' }}>
                                    <Button type="button" variant="secondary" onClick={() => navigator.clipboard?.writeText(resetPassword)}>
                                        コピー
                                    </Button>
                                    <Button type="button" onClick={() => setResetTarget(null)}>
                                        閉じる
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {resetError && (
                                    <div style={{
                                        padding: '1rem',
                                        margin: '0 1.5rem',
                                        backgroundColor: '#fef2f2',
                                        color: '#dc2626',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.875rem'
                                    }}>
                                        {resetError}
                                    </div>
                                )}

                                <form onSubmit={handleResetPassword} onKeyDown={preventImplicitSubmit} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <div style={{ position: 'relative' }}>
                                            <Input
                                                label="新しいパスワード (6文字以上)"
                                                type={showResetPassword ? 'text' : 'password'}
                                                required
                                                minLength={6}
                                                value={resetPassword}
                                                onChange={e => setResetPassword(e.target.value)}
                                                style={{ paddingRight: '2.75rem' }}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowResetPassword(v => !v)}
                                                aria-label={showResetPassword ? 'パスワードを隠す' : 'パスワードを表示する'}
                                                title={showResetPassword ? 'パスワードを隠す' : 'パスワードを表示する'}
                                                style={{
                                                    position: 'absolute', right: 0, bottom: 0,
                                                    height: '40px', width: '2.75rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'
                                                }}
                                            >
                                                {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={generatePassword}
                                            icon={<RefreshCw size={14} />}
                                            style={{ marginTop: '0.5rem' }}
                                        >
                                            自動で作る
                                        </Button>
                                    </div>

                                    <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.7 }}>
                                        保存されているパスワードはハッシュ化されていて、元の文字列は誰にも読み出せません。
                                        そのため「確認する」のではなく、新しいパスワードで上書きする形になります。
                                        再設定後は、今までのパスワードでは入れなくなります。
                                    </div>

                                    <div className={styles.formActions}>
                                        <Button type="button" variant="secondary" onClick={() => setResetTarget(null)}>
                                            キャンセル
                                        </Button>
                                        <Button type="submit" disabled={isResetting} icon={<KeyRound size={16} />}>
                                            {isResetting ? '再設定中...' : '再設定する'}
                                        </Button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

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
