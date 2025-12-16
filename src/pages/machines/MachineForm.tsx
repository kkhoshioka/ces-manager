import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save } from 'lucide-react';
import type { Customer, CustomerMachine } from '../../types/customer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import styles from './MachineRegistry.module.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    machine?: CustomerMachine;
}

const MachineForm: React.FC<Props> = ({ isOpen, onClose, onSave, machine }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);

    // Form States
    const [customerId, setCustomerId] = useState<string>(machine?.customerId.toString() || '');
    const [machineModel, setMachineModel] = useState(machine?.machineModel || '');
    const [serialNumber, setSerialNumber] = useState(machine?.serialNumber || '');
    const [purchaseDate, setPurchaseDate] = useState(machine?.purchaseDate ? machine.purchaseDate.toString().split('T')[0] : '');
    const [notes, setNotes] = useState(machine?.notes || '');
    const [productCategoryId, setProductCategoryId] = useState<string>(machine?.productCategoryId?.toString() || '');
    const [categories, setCategories] = useState<{ id: number; section: string; name: string; code: string | null }[]>([]);

    useEffect(() => {
        // Fetch masters
        const loadMasters = async () => {
            try {
                const [custRes, catRes] = await Promise.all([
                    axios.get<Customer[]>('/api/customers'),
                    axios.get<{ id: number; section: string; name: string; code: string | null }[]>('/api/categories')
                ]);

                setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
                setCategories(Array.isArray(catRes.data) ? catRes.data : []);
            } catch (error) {
                console.error('Failed to load form dependencies', error);
                // Fallback to empty arrays
                setCustomers([]);
                setCategories([]);
            }
        };
        loadMasters();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            customerId: Number(customerId),
            machineModel,
            serialNumber,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
            notes,
            productCategoryId: productCategoryId ? Number(productCategoryId) : null
        };

        try {
            if (machine) {
                await axios.put(`/api/machines/${machine.id}`, payload);
            } else {
                await axios.post('/api/machines', payload);
            }
            onSave();
        } catch (error) {
            alert('保存に失敗しました');
            console.error(error);
        }
    };

    if (!isOpen) return null;

    // Group categories by section
    const groupedCategories: Record<string, typeof categories> = {};
    categories.forEach(cat => {
        if (!groupedCategories[cat.section]) groupedCategories[cat.section] = [];
        groupedCategories[cat.section].push(cat);
    });

    const sortedSections = Object.keys(groupedCategories).sort();

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2>{machine ? '機材編集' : '機材登録'}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>顧客 (必須)</label>
                        <select
                            required
                            className={styles.select}
                            value={customerId}
                            onChange={e => setCustomerId(e.target.value)}
                        >
                            <option value="">選択してください</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>種別 (カテゴリー)</label>
                        <select
                            className={styles.select}
                            value={productCategoryId}
                            onChange={e => setProductCategoryId(e.target.value)}
                        >
                            <option value="">未選択</option>
                            {sortedSections.map(section => (
                                <optgroup key={section} label={section}>
                                    {groupedCategories[section].map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.code ? `${cat.code}: ` : ''}{cat.name}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>



                    <div className={styles.formGrid}>
                        <Input
                            label="機種名/型式 (必須)"
                            value={machineModel}
                            onChange={e => setMachineModel(e.target.value)}
                            required
                        />
                        <Input
                            label="シリアルNo (必須)"
                            value={serialNumber}
                            onChange={e => setSerialNumber(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <Input
                            type="date"
                            label="購入日"
                            value={purchaseDate}
                            onChange={e => setPurchaseDate(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <Textarea
                            label="備考"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className={styles.formActions}>
                        <Button type="button" variant="secondary" onClick={onClose}>キャンセル</Button>
                        <Button type="submit" icon={<Save size={16} />}>保存</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MachineForm;
