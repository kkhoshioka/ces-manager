import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save } from 'lucide-react';
import type { Customer, CustomerMachine } from '../../types/customer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import styles from './MachineRegistry.module.css';
import { API_BASE_URL } from '../../config';

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
    const [manufacturingDate, setManufacturingDate] = useState(machine?.manufacturingDate || '');
    const [deliveryDate, setDeliveryDate] = useState(machine?.deliveryDate ? machine.deliveryDate.toString().split('T')[0] : '');
    const [lastInspectionDate, setLastInspectionDate] = useState(machine?.lastInspectionDate ? machine.lastInspectionDate.toString().split('T')[0] : '');
    const [nextInspectionDate, setNextInspectionDate] = useState(machine?.nextInspectionDate ? machine.nextInspectionDate.toString().split('T')[0] : '');
    const [hourMeter, setHourMeter] = useState(machine?.hourMeter || '');
    const [notes, setNotes] = useState(machine?.notes || '');
    const [enableInspectionAlert, setEnableInspectionAlert] = useState(machine?.enableInspectionAlert !== false); // Default true if undefined
    const [productCategoryId, setProductCategoryId] = useState<string>(machine?.productCategoryId?.toString() || '');
    const [categories, setCategories] = useState<{ id: number; section: string; name: string; code: string | null }[]>([]);

    useEffect(() => {
        // Fetch masters
        const loadMasters = async () => {
            try {
                const [custRes, catRes] = await Promise.all([
                    axios.get<Customer[]>(`${API_BASE_URL}/customers`),
                    axios.get<{ id: number; section: string; name: string; code: string | null }[]>(`${API_BASE_URL}/categories`)
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

    // Auto-calculate next inspection date
    // Auto-calculate next inspection date moved to onChange handler
    const handleLastInspectionDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLastInspectionDate(val);
        if (val) {
            const date = new Date(val);
            date.setFullYear(date.getFullYear() + 1);
            setNextInspectionDate(date.toISOString().split('T')[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            customerId: Number(customerId),
            machineModel,
            serialNumber,
            manufacturingDate: manufacturingDate || null,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
            lastInspectionDate: lastInspectionDate ? new Date(lastInspectionDate) : null,
            nextInspectionDate: nextInspectionDate ? new Date(nextInspectionDate) : null,
            hourMeter: hourMeter || null,
            notes,
            productCategoryId: productCategoryId ? Number(productCategoryId) : null,
            enableInspectionAlert
        };

        try {
            if (machine) {
                await axios.put(`${API_BASE_URL}/machines/${machine.id}`, payload);
            } else {
                await axios.post(`${API_BASE_URL}/machines`, payload);
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="製造年月"
                                type="month"
                                value={manufacturingDate}
                                onChange={e => setManufacturingDate(e.target.value)}
                            />
                            <Input
                                label="納入日"
                                type="date"
                                value={deliveryDate}
                                onChange={e => setDeliveryDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <Input
                            label="現在のアワーメーター"
                            value={hourMeter}
                            onChange={e => setHourMeter(e.target.value)}
                            placeholder="例: 1234.5 Hr"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="前回年次点検日"
                                type="date"
                                value={lastInspectionDate}
                                onChange={handleLastInspectionDateChange}
                            />
                            <Input
                                label="年次点検期限 (前回+1年)"
                                type="date"
                                value={nextInspectionDate}
                                onChange={e => setNextInspectionDate(e.target.value)}
                            />
                        </div>
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
