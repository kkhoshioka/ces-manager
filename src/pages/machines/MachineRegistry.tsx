import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';
import type { CustomerMachine } from '../../types/customer';
import MachineForm from './MachineForm';
import Button from '../../components/ui/Button';
import styles from './MachineRegistry.module.css';
import { API_BASE_URL } from '../../config';

const MachineRegistry: React.FC = () => {
    const [machines, setMachines] = useState<CustomerMachine[]>([]);
    const [filteredMachines, setFilteredMachines] = useState<CustomerMachine[]>([]);
    const [filterText, setFilterText] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState<CustomerMachine | undefined>(undefined);

    const fetchMachines = useCallback(async () => {
        try {
            const res = await axios.get<CustomerMachine[]>(`${API_BASE_URL}/machines`);
            const data = Array.isArray(res.data) ? res.data : [];

            // Sort: Machines with inspection within 1 month come first
            const now = new Date();
            const oneMonthLater = new Date();
            oneMonthLater.setMonth(now.getMonth() + 1);

            const sortedData = [...data].sort((a, b) => {
                const getPriority = (m: CustomerMachine) => {
                    if (!m.nextInspectionDate) return 0;
                    const nextDate = new Date(m.nextInspectionDate);
                    return nextDate <= oneMonthLater ? 2 : 1;
                };
                return getPriority(b) - getPriority(a);
            });

            setMachines(sortedData);
            setFilteredMachines(sortedData);
        } catch (error) {
            console.error('Failed to fetch machines', error);
            setMachines([]);
            setFilteredMachines([]);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line
        fetchMachines();
    }, [fetchMachines]);


    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setFilterText(text);
        if (!text) {
            setFilteredMachines(machines);
        } else {
            const lower = text.toLowerCase();
            const filtered = machines.filter(m =>
                m.customer?.name.toLowerCase().includes(lower) ||
                m.machineModel.toLowerCase().includes(lower) ||
                m.serialNumber.toLowerCase().includes(lower)
            );
            setFilteredMachines(filtered);
        }
    };

    const handleEdit = (machine: CustomerMachine) => {
        setEditingMachine(machine);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingMachine(undefined);
        setIsFormOpen(true);
    };

    const handleSave = () => {
        fetchMachines();
        setIsFormOpen(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>機材台帳</h1>
                    <p className={styles.subtitle}>顧客保有機材の管理・登録</p>
                </div>
                <Button icon={<Plus size={18} />} onClick={handleAdd}>
                    新規登録
                </Button>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="顧客名、機種名、シリアルNoで検索..."
                        className={styles.searchInput}
                        value={filterText}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>顧客名</th>
                            <th>機種名 (モデル)</th>
                            <th>シリアルNo</th>
                            <th>アワーメーター</th>
                            <th>年次点検期限</th>
                            <th style={{ width: '80px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMachines.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={styles.emptyState}>データがありません</td>
                            </tr>
                        ) : (

                            filteredMachines.map((machine) => {
                                let isAlert = false;
                                if (machine.nextInspectionDate) {
                                    const nextDate = new Date(machine.nextInspectionDate);
                                    const now = new Date();
                                    const oneMonthLater = new Date();
                                    oneMonthLater.setMonth(now.getMonth() + 1);
                                    if (nextDate <= oneMonthLater) {
                                        isAlert = true;
                                    }
                                }

                                return (
                                    <tr key={machine.id} style={isAlert ? { backgroundColor: '#fff1f2' } : {}}>
                                        <td>{machine.customer?.name}</td>
                                        <td>
                                            <Link to={`/machines/${machine.id}`} className={styles.modelName}>
                                                {machine.machineModel}
                                            </Link>
                                        </td>
                                        <td style={{ fontFamily: 'monospace' }}>{machine.serialNumber}</td>
                                        <td>{machine.hourMeter || '-'}</td>
                                        <td style={isAlert ? { color: '#e11d48', fontWeight: 'bold' } : {}}>
                                            {machine.nextInspectionDate ? format(new Date(machine.nextInspectionDate), 'yyyy/MM/dd') : '-'}
                                            {isAlert && <span style={{ marginLeft: '8px', fontSize: '0.75rem', backgroundColor: '#e11d48', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>期限近</span>}
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button className={styles.actionButton} onClick={() => handleEdit(machine)} title="編集">
                                                    <Edit size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <MachineForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                    machine={editingMachine}
                />
            )}
        </div>
    );
};

export default MachineRegistry;
