import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import type { CustomerMachine } from '../../types/customer';
import MachineForm from './MachineForm';
import MachinePrintModal from './MachinePrintModal';
import PrintableMachineList from './PrintableMachineList';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import { Printer } from 'lucide-react';
import Button from '../../components/ui/Button';
import styles from './MachineRegistry.module.css';
import { API_BASE_URL } from '../../config';

const MachineRegistry: React.FC = () => {
    const [machines, setMachines] = useState<CustomerMachine[]>([]);
    const [filteredMachines, setFilteredMachines] = useState<CustomerMachine[]>([]);
    const [filterText, setFilterText] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState<CustomerMachine | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [printData, setPrintData] = useState<CustomerMachine[]>([]);
    const [printTitle, setPrintTitle] = useState('');
    const printComponentRef = useRef<HTMLDivElement>(null);
    const [printDocTitle, setPrintDocTitle] = useState('機材台帳');

    const handleActualPrint = useReactToPrint({
        contentRef: printComponentRef,
        documentTitle: printDocTitle,
        onAfterPrint: () => setIsPrinting(false),
    });

    type SortColumn = 'customer' | 'model' | 'inspection' | null;
    type SortDirection = 'asc' | 'desc';
    const [sortColumn, setSortColumn] = useState<SortColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const fetchMachines = useCallback(async () => {
        setIsLoading(true);
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
                    if (nextDate <= oneMonthLater && m.enableInspectionAlert !== false) return 2;
                    return 1;
                };
                return getPriority(b) - getPriority(a);
            });

            setMachines(sortedData);
            setFilteredMachines(sortedData);
        } catch (error) {
            console.error('Failed to fetch machines', error);
            setMachines([]);
            setFilteredMachines([]);
        } finally {
            setIsLoading(false);
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

    const handlePrintExecute = (machinesToPrint: CustomerMachine[], title: string) => {
        setPrintData(machinesToPrint);
        setPrintTitle(title);
        setIsPrintModalOpen(false);
        setIsPrinting(true);
        
        const now = new Date();
        const yyyy = now.getFullYear();
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const HH = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setPrintDocTitle(`機材台帳_${yyyy}${MM}${dd}_${HH}${mm}`);

        setTimeout(() => {
            handleActualPrint();
        }, 100);
    };

    const handleSave = () => {
        fetchMachines();
        setIsFormOpen(false);
    };

    const handleDismissAlert = async (machine: CustomerMachine) => {
        if (!confirm('今年次の点検アラートを消去（非表示に）しますか？\n（次回の点検日を登録するまでアラートは出なくなります）')) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { customer, category, createdAt, updatedAt, ...cleanMachine } = machine;
            await axios.put(`${API_BASE_URL}/machines/${machine.id}`, {
                ...cleanMachine,
                enableInspectionAlert: false
            });
            fetchMachines();
        } catch (error) {
            console.error(error);
            alert('アラートの消去に失敗しました');
        }
    };

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            if (sortDirection === 'asc') setSortDirection('desc');
            else {
                setSortColumn(null);
                setSortDirection('asc');
            }
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const sortedFilteredMachines = [...filteredMachines].sort((a, b) => {
        if (!sortColumn) return 0;
        
        if (sortColumn === 'customer') {
            const nameA = a.customer?.name || '';
            const nameB = b.customer?.name || '';
            return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        
        if (sortColumn === 'model') {
            const modelA = a.machineModel || '';
            const modelB = b.machineModel || '';
            return sortDirection === 'asc' ? modelA.localeCompare(modelB) : modelB.localeCompare(modelA);
        }
        
        if (sortColumn === 'inspection') {
            const dateA = a.nextInspectionDate ? new Date(a.nextInspectionDate).getTime() : 0;
            const dateB = b.nextInspectionDate ? new Date(b.nextInspectionDate).getTime() : 0;
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        return 0;
    });

    const getSortIcon = (column: SortColumn) => {
        if (sortColumn !== column) return <ArrowUpDown size={14} style={{ color: '#cbd5e1', marginLeft: '4px' }} />;
        if (sortDirection === 'asc') return <ArrowUp size={14} style={{ color: '#3b82f6', marginLeft: '4px' }} />;
        return <ArrowDown size={14} style={{ color: '#3b82f6', marginLeft: '4px' }} />;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>機材台帳</h1>
                    <p className={styles.subtitle}>顧客保有機材の管理・登録</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button icon={<Printer size={18} />} onClick={() => setIsPrintModalOpen(true)} variant="outline">
                        印刷
                    </Button>
                    <Button icon={<Plus size={18} />} onClick={handleAdd}>
                        新規登録
                    </Button>
                </div>
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
                            <th onClick={() => handleSort('customer')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    顧客名 {getSortIcon('customer')}
                                </div>
                            </th>
                            <th onClick={() => handleSort('model')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    機種名 (モデル) {getSortIcon('model')}
                                </div>
                            </th>
                            <th>シリアルNo</th>
                            <th>アワーメーター</th>
                            <th onClick={() => handleSort('inspection')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    年次点検期限 {getSortIcon('inspection')}
                                </div>
                            </th>
                            <th style={{ width: '80px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6}>
                                    <div style={{ padding: '2rem' }}>
                                        <LoadingSpinner />
                                    </div>
                                </td>
                            </tr>
                        ) : sortedFilteredMachines.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={styles.emptyState}>データがありません</td>
                            </tr>
                        ) : (

                            sortedFilteredMachines.map((machine) => {
                                let isAlert = false;
                                let isExpired = false;
                                if (machine.nextInspectionDate) {
                                    const nextDate = new Date(machine.nextInspectionDate);
                                    const now = new Date();
                                    const oneMonthLater = new Date();
                                    oneMonthLater.setMonth(now.getMonth() + 1);
                                    
                                    if (machine.enableInspectionAlert !== false) {
                                        if (nextDate <= now) {
                                            isAlert = true;
                                            isExpired = true;
                                        } else if (nextDate <= oneMonthLater) {
                                            isAlert = true;
                                            isExpired = false;
                                        }
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
                                            {isAlert && (
                                                <button 
                                                    onClick={() => handleDismissAlert(machine)}
                                                    style={{ 
                                                        marginLeft: '8px', 
                                                        fontSize: '0.75rem', 
                                                        backgroundColor: isExpired ? '#991b1b' : '#e11d48', 
                                                        color: 'white', 
                                                        padding: '2px 6px', 
                                                        borderRadius: '4px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold'
                                                    }}
                                                    title="アラートを消去"
                                                >
                                                    {isExpired ? '期限切れ' : '期限近'}
                                                </button>
                                            )}
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

            <MachinePrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                currentFilteredMachines={sortedFilteredMachines}
                allMachines={machines}
                onPrintExecute={handlePrintExecute}
            />

            <div style={{ display: 'none' }}>
                <PrintableMachineList 
                    ref={printComponentRef}
                    machines={printData} 
                    printTitle={printTitle} 
                />
            </div>
        </div>
    );
};

export default MachineRegistry;
