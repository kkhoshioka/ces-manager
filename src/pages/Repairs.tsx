import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
import type { Repair, NewRepair } from '../types/repair';
import { RepairService } from '../utils/repairService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import styles from './Repairs.module.css';

const Repairs: React.FC = () => {
    const [repairs, setRepairs] = useState<Repair[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formData, setFormData] = useState<NewRepair>({
        customerName: '',
        machineModel: '',
        serialNumber: '',
        issueDescription: '',
        notes: ''
    });

    useEffect(() => {
        loadRepairs();
    }, []);

    const loadRepairs = () => {
        setRepairs(RepairService.getAll());
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim() === '') {
            loadRepairs();
        } else {
            setRepairs(RepairService.search(query));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        RepairService.add(formData);
        setFormData({
            customerName: '',
            machineModel: '',
            serialNumber: '',
            issueDescription: '',
            notes: ''
        });
        setIsFormOpen(false);
        loadRepairs();
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            received: '受付済',
            diagnosing: '診断中',
            in_progress: '作業中',
            completed: '完了',
            delivered: '引渡済'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
        // Note: We are using vanilla CSS, so we'll return a class name mapped in CSS module
        return styles[status] || styles.defaultStatus;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>修理管理</h1>
                    <p className={styles.subtitle}>修理案件の追跡と管理</p>
                </div>
                <Button icon={<Plus size={18} />} onClick={() => setIsFormOpen(true)}>
                    新規修理受付
                </Button>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="顧客名、機種、シリアル番号で検索..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
                <Button variant="secondary" icon={<Filter size={18} />}>
                    フィルター
                </Button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ステータス</th>
                            <th>受付日</th>
                            <th>顧客名</th>
                            <th>機種 / シリアル</th>
                            <th>症状</th>
                            <th>アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {repairs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={styles.emptyState}>
                                    データがありません
                                </td>
                            </tr>
                        ) : (
                            repairs.map(repair => (
                                <tr key={repair.id}>
                                    <td>
                                        <span className={`${styles.statusBadge} ${getStatusColor(repair.status)}`}>
                                            {getStatusLabel(repair.status)}
                                        </span>
                                    </td>
                                    <td>{new Date(repair.receivedDate).toLocaleDateString()}</td>
                                    <td className={styles.customerName}>{repair.customerName}</td>
                                    <td>
                                        <div className={styles.machineInfo}>
                                            <span className={styles.model}>{repair.machineModel}</span>
                                            <span className={styles.serial}>{repair.serialNumber}</span>
                                        </div>
                                    </td>
                                    <td className={styles.issue}>{repair.issueDescription}</td>
                                    <td>
                                        <Button variant="ghost" size="sm">詳細</Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* New Repair Modal */}
            {isFormOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>新規修理受付</h2>
                            <button className={styles.closeButton} onClick={() => setIsFormOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGrid}>
                                <Input
                                    label="顧客名"
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Input
                                    label="機種名"
                                    name="machineModel"
                                    value={formData.machineModel}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Input
                                    label="シリアル番号"
                                    name="serialNumber"
                                    value={formData.serialNumber}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <Textarea
                                label="症状・不具合内容"
                                name="issueDescription"
                                value={formData.issueDescription}
                                onChange={handleInputChange}
                                required
                            />
                            <Textarea
                                label="備考"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                            />
                            <div className={styles.formActions}>
                                <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                                    キャンセル
                                </Button>
                                <Button type="submit">
                                    登録する
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Repairs;
