import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, X, FileText, Trash2 } from 'lucide-react';
import type { Repair, NewRepair } from '../types/repair';
import { RepairService } from '../utils/repairService';
import { customerService } from '../utils/customerService';
import { API_BASE_URL } from '../config';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import styles from './Repairs.module.css';
import { CurrencyInput } from '../components/ui/CurrencyInput';

const Repairs: React.FC = () => {
    const [repairs, setRepairs] = useState<Repair[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [formState, setFormState] = useState({
        customerName: '',
        machineModel: '',
        serialNumber: '',
        issueDescription: '',
        notes: ''
    });

    // Details State
    type DetailItem = {
        lineType: 'labor' | 'part' | 'outsourcing' | 'travel' | 'other';
        description: string;
        supplier?: string;
        remarks?: string;
        quantity: number;
        unitPrice: number; // Sales Price
        unitCost: number;  // Cost Price
    };

    const [details, setDetails] = useState<DetailItem[]>([]);

    const addDetail = (type: DetailItem['lineType']) => {
        setDetails([...details, {
            lineType: type,
            description: '',
            supplier: '',
            remarks: '',
            quantity: 1,
            unitPrice: 0,
            unitCost: 0
        }]);
    };

    const removeDetail = (index: number) => {
        setDetails(details.filter((_, i) => i !== index));
    };

    const handleDetailChange = (index: number, field: keyof DetailItem, value: any) => {
        const newDetails = [...details];
        const item = newDetails[index];

        if (field === 'quantity' || field === 'unitPrice' || field === 'unitCost') {
            (item as any)[field] = Number(value);
        } else {
            (item as any)[field] = value;
        }

        setDetails(newDetails);
    };

    const totals = useMemo(() => {
        let totalCost = 0;
        let totalSales = 0;

        const categoryTotals = {
            labor: { cost: 0, sales: 0 },
            part: { cost: 0, sales: 0 },
            outsourcing: { cost: 0, sales: 0 },
            travel: { cost: 0, sales: 0 },
            other: { cost: 0, sales: 0 }
        };

        details.forEach(d => {
            const cost = d.quantity * d.unitCost;
            const sales = d.quantity * d.unitPrice;

            totalCost += cost;
            totalSales += sales;

            if (categoryTotals[d.lineType]) {
                categoryTotals[d.lineType].cost += cost;
                categoryTotals[d.lineType].sales += sales;
            } else {
                categoryTotals.other.cost += cost;
                categoryTotals.other.sales += sales;
            }
        });

        const grossProfit = totalSales - totalCost;
        const profitRate = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

        return { totalCost, totalSales, grossProfit, profitRate, categoryTotals };
    }, [details]);

    // ... (LoadRepairs, HandleSearch, HandleSubmit logic mostly same, need to map details correctly) ...

    const loadRepairs = async () => {
        try {
            const data = await RepairService.getAll();
            setRepairs(data);
        } catch (error) {
            console.error('Failed to load repairs', error);
        }
    };

    useEffect(() => {
        loadRepairs();
    }, []);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        try {
            if (query.trim() === '') {
                await loadRepairs();
            } else {
                const results = await RepairService.search(query);
                setRepairs(results);
            }
        } catch (error) {
            console.error('Search failed', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const [selectedRepairId, setSelectedRepairId] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Customer & Machine Logic (Same as before)
            const customers = await customerService.getAllCustomers();
            let customer = customers.find(c => c.name === formState.customerName);

            if (!customer) {
                customer = await customerService.createCustomer({
                    // eslint-disable-next-line react-hooks/purity
                    code: `C${Date.now()}`,
                    name: formState.customerName
                });
            }

            let customerMachineId: number | undefined;
            if (formState.machineModel && formState.serialNumber) {
                const machines = await customerService.getAllMachines();
                let machine = machines.find(m =>
                    m.customerId === customer!.id &&
                    m.machineModel === formState.machineModel &&
                    m.serialNumber === formState.serialNumber
                );

                if (!machine) {
                    machine = await customerService.createMachine({
                        customerId: customer.id,
                        machineModel: formState.machineModel,
                        serialNumber: formState.serialNumber
                    });
                }
                customerMachineId = machine.id;
            }

            const repairData: any = {
                customerId: customer.id,
                customerMachineId: customerMachineId,
                machineModel: formState.machineModel,
                serialNumber: formState.serialNumber,
                notes: formState.issueDescription + (formState.notes ? `\n\n備考: ${formState.notes}` : ''),
                status: selectedRepairId ? undefined : 'received',
                totalAmount: totals.totalSales, // Save total amount explicitly
                details: details.map(d => ({
                    lineType: d.lineType,
                    description: d.description,
                    supplier: d.supplier,
                    remarks: d.remarks,
                    quantity: d.quantity,
                    unitPrice: d.unitPrice,
                    unitCost: d.unitCost,
                    amountCost: d.quantity * d.unitCost,
                    amountSales: d.quantity * d.unitPrice
                }))
            };

            if (selectedRepairId) {
                await RepairService.update(selectedRepairId, repairData);
            } else {
                await RepairService.add(repairData as NewRepair);
            }

            resetForm();
            loadRepairs();
        } catch (error) {
            console.error('Failed to save repair', error);
            alert('保存に失敗しました');
        }
    };

    const resetForm = () => {
        setFormState({
            customerName: '',
            machineModel: '',
            serialNumber: '',
            issueDescription: '',
            notes: ''
        });
        setDetails([]);
        setSelectedRepairId(null);
        setIsFormOpen(false);
    };

    const handleRowClick = async (repair: Repair) => {
        try {
            const fullRepair = await RepairService.getById(repair.id);
            if (fullRepair) {
                setSelectedRepairId(fullRepair.id);
                setFormState({
                    customerName: fullRepair.customer?.name || '',
                    machineModel: fullRepair.machineModel || '',
                    serialNumber: fullRepair.serialNumber || '',
                    issueDescription: fullRepair.notes?.split('\n\n備考: ')[0] || '', // Basic split attempt
                    notes: fullRepair.notes?.split('\n\n備考: ')[1] || ''
                });

                if (fullRepair.details) {
                    setDetails(fullRepair.details.map(d => ({
                        lineType: d.lineType as any,
                        description: d.description,
                        supplier: d.supplier || '',
                        remarks: d.remarks || '',
                        quantity: Number(d.quantity),
                        unitPrice: Number(d.unitPrice),
                        unitCost: Number(d.unitCost)
                    })));
                } else {
                    setDetails([]);
                }

                setIsFormOpen(true);
            }
        } catch (error) {
            console.error('Failed to fetch repair details', error);
        }
    };

    // Helper to render Detail Section
    const renderDetailTable = (title: string, type: DetailItem['lineType'], showSupplier: boolean = false) => {
        const sectionDetails = details.map((d, i) => ({ ...d, originalIndex: i })).filter(d => d.lineType === type);
        const subtotalCost = sectionDetails.reduce((sum, d) => sum + (d.quantity * d.unitCost), 0);
        const subtotalSales = sectionDetails.reduce((sum, d) => sum + (d.quantity * d.unitPrice), 0);
        const subtotalProfit = subtotalSales - subtotalCost;
        const subtotalRate = subtotalSales > 0 ? (subtotalProfit / subtotalSales) * 100 : 0;

        return (
            <div className={styles.detailTableWrapper}>
                <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                    <span>{title}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => addDetail(type)}>
                        <Plus size={16} /> 追加
                    </Button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'left', width: '25%' }}>内容</th>
                            {showSupplier && <th style={{ padding: '0.5rem', textAlign: 'left', width: '15%' }}>仕入先</th>}
                            <th style={{ padding: '0.5rem', textAlign: 'center', width: '80px' }}>数量/時間</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '100px' }}>原価単価</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '100px' }}>原価計</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '100px' }}>請求単価</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '100px' }}>請求額</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '80px' }}>粗利額</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '60px' }}>粗利率</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>備考</th>
                            <th style={{ width: '40px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sectionDetails.map((detail) => {
                            const costTotal = detail.quantity * detail.unitCost;
                            const salesTotal = detail.quantity * detail.unitPrice;
                            const profit = salesTotal - costTotal;
                            const rate = salesTotal > 0 ? (profit / salesTotal) * 100 : 0;

                            return (
                                <tr key={detail.originalIndex} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.25rem' }}>
                                        <input type="text" className={styles.tableInput} value={detail.description} onChange={(e) => handleDetailChange(detail.originalIndex, 'description', e.target.value)} />
                                    </td>
                                    {showSupplier && (
                                        <td style={{ padding: '0.25rem' }}>
                                            <input type="text" className={styles.tableInput} value={detail.supplier} onChange={(e) => handleDetailChange(detail.originalIndex, 'supplier', e.target.value)} />
                                        </td>
                                    )}
                                    <td style={{ padding: '0.25rem' }}>
                                        <input type="number" className={styles.tableInput} style={{ textAlign: 'center' }} value={detail.quantity} onChange={(e) => handleDetailChange(detail.originalIndex, 'quantity', e.target.value)} min="0" step="0.1" />
                                    </td>
                                    <td style={{ padding: '0.25rem' }}>
                                        <div className={styles.currencyWrapper}>
                                            <CurrencyInput className={styles.tableInput} style={{ textAlign: 'right' }} value={detail.unitCost} onChange={(val) => handleDetailChange(detail.originalIndex, 'unitCost', val)} />
                                            <span className={styles.currencyUnit}>円</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.25rem', textAlign: 'right' }}>{costTotal.toLocaleString()}円</td>
                                    <td style={{ padding: '0.25rem' }}>
                                        <div className={styles.currencyWrapper}>
                                            <CurrencyInput className={styles.tableInput} style={{ textAlign: 'right' }} value={detail.unitPrice} onChange={(val) => handleDetailChange(detail.originalIndex, 'unitPrice', val)} />
                                            <span className={styles.currencyUnit}>円</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.25rem', textAlign: 'right' }}>{salesTotal.toLocaleString()}円</td>
                                    <td style={{ padding: '0.25rem', textAlign: 'right' }}>{profit.toLocaleString()}円</td>
                                    <td style={{ padding: '0.25rem', textAlign: 'right' }}>{Math.round(rate)}%</td>
                                    <td style={{ padding: '0.25rem' }}>
                                        <input type="text" className={styles.tableInput} value={detail.remarks} onChange={(e) => handleDetailChange(detail.originalIndex, 'remarks', e.target.value)} />
                                    </td>
                                    <td style={{ padding: '0.25rem', textAlign: 'center' }}>
                                        <button type="button" onClick={() => removeDetail(detail.originalIndex)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {/* Subtotal Row */}
                        <tr style={{ background: '#fffbeb', fontWeight: 'bold' }}>
                            <td colSpan={showSupplier ? 3 : 2} style={{ textAlign: 'right', padding: '0.5rem' }}>小計</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}></td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>{subtotalCost.toLocaleString()}円</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}></td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>{subtotalSales.toLocaleString()}円</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>{subtotalProfit.toLocaleString()}円</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>{Math.round(subtotalRate)}%</td>
                            <td colSpan={2}></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    // ... (getStatusLabel, getStatusColor, etc - Unchanged) ...
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
        return styles[status] || styles.defaultStatus;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>修理管理</h1>
                    <p className={styles.subtitle}>修理案件の追跡と管理</p>
                </div>
                <Button icon={<Plus size={18} />} onClick={() => {
                    resetForm();
                    setIsFormOpen(true);
                }}>
                    新規修理受付
                </Button>
            </div>

            {/* Controls */}
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
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ステータス</th>
                            <th>受付日</th>
                            <th>顧客名</th>
                            <th>機種 / シリアル</th>
                            <th>備考</th>
                            <th>アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {repairs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={styles.emptyState}>データがありません</td>
                            </tr>
                        ) : (
                            repairs.map(repair => (
                                <tr key={repair.id} onClick={() => handleRowClick(repair)} style={{ cursor: 'pointer' }}>
                                    <td><span className={`${styles.statusBadge} ${getStatusColor(repair.status)}`}>{getStatusLabel(repair.status)}</span></td>
                                    <td>{repair.createdAt ? new Date(repair.createdAt).toLocaleDateString() : '-'}</td>
                                    <td className={styles.customerName}>{repair.customer?.name || '-'}</td>
                                    <td>
                                        <div className={styles.machineInfo}>
                                            <span className={styles.model}>{repair.machineModel || '-'}</span>
                                            <span className={styles.serial}>{repair.serialNumber || '-'}</span>
                                        </div>
                                    </td>
                                    <td className={styles.issue}>{repair.notes}</td>
                                    <td>
                                        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm" onClick={() => window.open(`${API_BASE_URL}/projects/${repair.id}/pdf/invoice`, '_blank')} title="請求書PDF"><FileText size={16} /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => window.open(`${API_BASE_URL}/projects/${repair.id}/pdf/delivery`, '_blank')} title="納品書PDF"><FileText size={16} color="#10b981" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isFormOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{ maxWidth: '1200px', width: '95%' }}>
                        <div className={styles.modalHeader}>
                            <h2>{selectedRepairId ? '修理案件詳細・編集' : '新規修理登録'}</h2>
                            <button className={styles.closeButton} onClick={() => setIsFormOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Summary Header */}
                            <div className={styles.summaryHeader}>
                                <div className={styles.formGrid}>
                                    <Input label="顧客名" name="customerName" value={formState.customerName} onChange={handleInputChange} required />
                                    <Input label="機種名" name="machineModel" value={formState.machineModel} onChange={handleInputChange} required />
                                    <Input label="シリアル番号" name="serialNumber" value={formState.serialNumber} onChange={handleInputChange} required />
                                </div>
                                <div className={styles.summaryStats}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div>工賃計: {totals.categoryTotals.labor.sales.toLocaleString()}円</div>
                                        <div>部品計: {totals.categoryTotals.part.sales.toLocaleString()}円</div>
                                        <div>外注計: {totals.categoryTotals.outsourcing.sales.toLocaleString()}円</div>
                                        <div>出張計: {totals.categoryTotals.travel.sales.toLocaleString()}円</div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                        <div style={{ color: '#64748b' }}>原価計: {totals.totalCost.toLocaleString()}円</div>
                                        <div style={{ fontSize: '1.2rem', color: '#0f172a' }}>請求計: {totals.totalSales.toLocaleString()}円</div>
                                        <div style={{ color: '#10b981' }}>粗利額: {totals.grossProfit.toLocaleString()}円</div>
                                        <div>粗利率: {Math.round(totals.profitRate)}%</div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.notesGrid}>
                                <Textarea label="症状・不具合内容" name="issueDescription" value={formState.issueDescription} onChange={handleInputChange} required />
                                <Textarea label="全体備考" name="notes" value={formState.notes} onChange={handleInputChange} />
                            </div>

                            {/* Details Sections */}
                            <div className={styles.detailsSection} style={{ background: 'none', border: 'none', padding: 0 }}>
                                {renderDetailTable('工賃', 'labor', false)}
                                {renderDetailTable('部品', 'part', true)}
                                {renderDetailTable('外注費', 'outsourcing', true)}
                                {renderDetailTable('出張費', 'travel', false)}
                            </div>

                            <div className={styles.formActions}>
                                <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>キャンセル</Button>
                                <Button type="submit">{selectedRepairId ? '更新する' : '保存する'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Repairs;
