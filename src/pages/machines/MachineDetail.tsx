
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import type { CustomerMachine } from '../../types/customer';
import type { Repair } from '../../types/repair';
import styles from './MachineRegistry.module.css';
import { API_BASE_URL } from '../../config';

const MachineDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [machine, setMachine] = useState<CustomerMachine | null>(null);
    const [history, setHistory] = useState<Repair[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const [machineRes, historyRes] = await Promise.all([
                    axios.get<CustomerMachine>(`${API_BASE_URL}/machines/${id}`),
                    axios.get<Repair[]>(`${API_BASE_URL}/machines/${id}/history`)
                ]);
                setMachine(machineRes.data);
                setHistory(historyRes.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <div className={styles.emptyState}>Loading...</div>;
    if (!machine) return <div className={styles.emptyState}>機材が見つかりません</div>;

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'completed': return styles.statusCompleted;
            case 'in_progress': return styles.statusInProgress;
            default: return styles.statusReceived;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <Link to="/machines" className={styles.backLink}>
                        <ArrowLeft size={16} />
                        台帳一覧に戻る
                    </Link>
                    <h1 className={styles.title} style={{ marginTop: '0.5rem' }}>機材詳細</h1>
                </div>
            </div>

            {/* Basic Info */}
            <div className={styles.detailCard}>
                <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>所有顧客</span>
                        <span className={styles.detailValue}>{machine.customer?.name}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>機種名 (モデル)</span>
                        <span className={styles.detailValue} style={{ fontWeight: 'bold' }}>{machine.machineModel}</span>
                    </div>

                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>種別 (カテゴリー)</span>
                        <span className={styles.detailValue}>
                            {machine.category ? (
                                <>
                                    <span style={{ color: '#6b7280', fontSize: '0.85em', marginRight: '0.5em' }}>
                                        [{machine.category.section}]
                                    </span>
                                    {machine.category.name}
                                </>
                            ) : '-'}
                        </span>
                    </div>

                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>シリアルNo</span>
                        <span className={styles.detailValueMono}>{machine.serialNumber}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>購入日</span>
                        <span className={styles.detailValue}>
                            {machine.purchaseDate ? format(new Date(machine.purchaseDate), 'yyyy/MM/dd') : '-'}
                        </span>
                    </div>
                    <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                        <span className={styles.detailLabel}>備考</span>
                        <span className={styles.detailValue} style={{ whiteSpace: 'pre-wrap' }}>
                            {machine.notes || '-'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Repair History */}
            <div>
                <h2 className={styles.sectionTitle}>修理・対応履歴</h2>
                <div className={styles.tableContainer}>
                    {history.length === 0 ? (
                        <div className={styles.emptyState}>履歴はありません</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>日付</th>
                                    <th>ステータス</th>
                                    <th>対応内容 / 詳細</th>
                                    <th style={{ textAlign: 'right' }}>金額 (税抜)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((record) => (
                                    <tr key={record.id}>
                                        <td>
                                            {format(new Date(record.createdAt), 'yyyy/MM/dd')}
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${getStatusBadgeClass(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{record.notes}</div>
                                            {record.details && record.details.length > 0 && (
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                    {record.details.map(d => d.description).join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            {Number(record.totalAmount).toLocaleString()} 円
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MachineDetail;
