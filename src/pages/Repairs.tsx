import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, X, FileText, Trash2, ShoppingCart, Wrench } from 'lucide-react';
import type { Repair, NewRepair } from '../types/repair';
import { RepairService } from '../utils/repairService';
import { customerService } from '../utils/customerService';
import { API_BASE_URL } from '../config';
import Button from '../components/ui/Button';
import { Camera } from 'lucide-react';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import styles from './Repairs.module.css';
import { CurrencyInput } from '../components/ui/CurrencyInput';

// Status helper
const getStatusStyle = (status: string) => {
    switch (status) {
        case 'received': return { bg: '#e2e8f0', color: '#1e293b', label: '受付済' };
        case 'diagnosing': return { bg: '#fef3c7', color: '#92400e', label: '診断中' };
        case 'in_progress': return { bg: '#dbeafe', color: '#1e40af', label: '作業中' };
        case 'completed': return { bg: '#dcfce7', color: '#166534', label: '完了' };
        case 'delivered': return { bg: '#f3f4f6', color: '#4b5563', label: '引渡済' };
        default: return { bg: '#f3f4f6', color: '#4b5563', label: status };
    }
};

const StatusBadge = ({ status }: { status: string }) => {
    const style = getStatusStyle(status);
    return (
        <span style={{
            backgroundColor: style.bg,
            color: style.color,
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '600',
            whiteSpace: 'nowrap'
        }}>
            {style.label}
        </span>
    );
};

const Repairs: React.FC = () => {
    const [projects, setProjects] = useState<Repair[]>([]); // Renamed from repairs to projects
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formType, setFormType] = useState<'repair' | 'sales' | 'inspection' | 'maintenance'>('repair');
    const [formState, setFormState] = useState({
        customerName: '',
        machineModel: '',
        serialNumber: '',
        issueDescription: '',
        notes: '',
        status: 'received'
    });

    // Selection Data
    const [customers, setCustomers] = useState<any[]>([]);
    const [allMachines, setAllMachines] = useState<any[]>([]);

    // Derived state for available machines based on selected customer name
    const availableMachines = useMemo(() => {
        const customer = customers.find(c => c.name === formState.customerName);
        if (!customer) return [];
        return allMachines.filter(m => m.customerId === customer.id);
    }, [formState.customerName, customers, allMachines]);

    useEffect(() => {
        // Load masters
        const loadMasters = async () => {
            const [custs, machs] = await Promise.all([
                customerService.getAllCustomers(),
                customerService.getAllMachines()
            ]);
            setCustomers(custs);
            setAllMachines(machs);
        };
        loadMasters();
    }, []);

    // Category State
    const [categories, setCategories] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    useEffect(() => {
        // Fetch Categories
        fetch(`${API_BASE_URL}/categories`)
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error('Failed to load categories', err));

        // Fetch Suppliers
        fetch(`${API_BASE_URL}/suppliers`)
            .then(res => res.json())
            .then(data => setSuppliers(data))
            .catch(err => console.error('Failed to load suppliers', err));
    }, []);

    // Details State
    type DetailItem = {
        lineType: 'labor' | 'part' | 'outsourcing' | 'travel' | 'other';
        description: string;
        supplier?: string;
        remarks?: string;
        quantity: number;
        unitPrice: number; // Sales Price
        unitCost: number;  // Cost Price
        productCategoryId?: number | null; // Selected Category ID
    };

    const [details, setDetails] = useState<DetailItem[]>([]);
    const [photos, setPhotos] = useState<any[]>([]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length || !selectedProjectId) return;

        const formData = new FormData();
        Array.from(e.target.files).forEach(file => {
            formData.append('photos', file);
        });

        try {
            const uploaded = await RepairService.uploadPhotos(selectedProjectId, formData);
            setPhotos(prev => [...prev, ...uploaded]);
        } catch (error) {
            console.error('Failed to upload photos', error);
            alert(`写真のアップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handlePhotoDelete = async (photoId: number) => {
        if (!confirm('この写真を削除しますか？')) return;
        try {
            await RepairService.deletePhoto(photoId);
            setPhotos(prev => prev.filter(p => p.id !== photoId));
        } catch (error) {
            console.error('Failed to delete photo', error);
            alert(`写真の削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

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
        setDetails(prevDetails => {
            const newDetails = [...prevDetails];
            const item = { ...newDetails[index] }; // Copy item to avoid mutation of prev state

            if (field === 'quantity' || field === 'unitPrice' || field === 'unitCost') {
                const strVal = String(value).replace(/,/g, '');
                const numVal = Number(strVal);
                (item as any)[field] = isNaN(numVal) ? 0 : numVal;
            } else if (field === 'productCategoryId') {
                // Ensure 0 becomes null (safe for optional relation)
                const numVal = Number(value);
                (item as any)[field] = (numVal === 0 || isNaN(numVal)) ? null : numVal;
            } else {
                (item as any)[field] = value;
            }

            newDetails[index] = item;
            return newDetails;
        });
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

    const loadProjects = async () => {
        try {
            const data = await RepairService.getAll();
            setProjects(data);
        } catch (error) {
            console.error('Failed to load projects', error);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        try {
            if (query.trim() === '') {
                await loadProjects();
            } else {
                const results = await RepairService.search(query);
                setProjects(results);
            }
        } catch (error) {
            console.error('Search failed', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, targetId: number | null }>({ isOpen: false, targetId: null });

    const handleDeleteProject = async (id: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setDeleteConfirmation({ isOpen: true, targetId: id });
    };

    const confirmDelete = async () => {
        const id = deleteConfirmation.targetId;
        if (!id) return;

        try {
            await RepairService.delete(id);
            if (selectedProjectId === id) {
                setIsFormOpen(false);
                setSelectedProjectId(null);
            }
            loadProjects();
            setDeleteConfirmation({ isOpen: false, targetId: null });
        } catch (error) {
            console.error('Failed to delete project', error);
            alert(`削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Customer Logic
            const customers = await customerService.getAllCustomers();
            let customer = customers.find(c => c.name === formState.customerName);

            if (!customer) {
                customer = await customerService.createCustomer({
                    // eslint-disable-next-line react-hooks/purity
                    code: `C${Date.now()}`,
                    name: formState.customerName
                });
            }

            // Customer Machine Logic (Only for Repair or if info provided)
            let customerMachineId: number | undefined;
            if (formState.machineModel) { // Changed condition: always try if model exists
                const machines = await customerService.getAllMachines();
                // Find machine globally by model and serial
                let machine = machines.find(m =>
                    m.machineModel === formState.machineModel &&
                    m.serialNumber === formState.serialNumber
                );

                if (machine) {
                    // Check if owner is different
                    if (machine.customerId !== customer.id) {
                        // Update owner to current customer
                        await customerService.updateMachine(machine.id, {
                            customerId: customer.id,
                            machineModel: formState.machineModel,
                            serialNumber: formState.serialNumber
                        });
                    }
                } else {
                    // Not found, create new
                    machine = await customerService.createMachine({
                        customerId: customer.id,
                        machineModel: formState.machineModel,
                        serialNumber: formState.serialNumber || ''
                    });
                }
                customerMachineId = machine.id;
            }

            const projectData: any = {
                type: formType, // Include type
                customerId: customer.id,
                customerMachineId: customerMachineId,
                machineModel: formState.machineModel,
                serialNumber: formState.serialNumber,
                notes: ((formType === 'repair' || formType === 'inspection' || formType === 'maintenance') ? formState.issueDescription : '') + (formState.notes ? `\n\n備考: ${formState.notes}` : ''),
                status: formState.status,
                totalAmount: totals.totalSales,
                details: details.map(d => {
                    const safeQty = isNaN(Number(d.quantity)) ? 0 : Number(d.quantity);
                    const safePrice = isNaN(Number(d.unitPrice)) ? 0 : Number(d.unitPrice);
                    const safeCost = isNaN(Number(d.unitCost)) ? 0 : Number(d.unitCost);

                    return {
                        lineType: d.lineType,
                        description: d.description,
                        supplier: d.supplier,
                        remarks: d.remarks,
                        quantity: safeQty,
                        unitPrice: safePrice,
                        unitCost: safeCost,
                        productCategoryId: d.productCategoryId, // Pass to backend
                        amountCost: safeQty * safeCost,
                        amountSales: safeQty * safePrice
                    };
                })
            };

            if (selectedProjectId) {
                await RepairService.update(selectedProjectId, projectData);
            } else {
                await RepairService.add(projectData as NewRepair);
            }

            resetForm();
            loadProjects();
        } catch (error) {
            console.error('Failed to save project', error);
            alert(`保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const resetForm = () => {
        setFormState({
            customerName: '',
            machineModel: '',
            serialNumber: '',
            issueDescription: '',
            notes: '',
            status: 'received'
        });
        setDetails([]);
        setSelectedProjectId(null);
        setIsFormOpen(false);
        setFormType('repair'); // Default reset
    };

    const openNewForm = (type: 'repair' | 'sales') => {
        resetForm();
        setFormType(type);
        setIsFormOpen(true);
        // Pre-add a detail line for convenience
        if (type === 'sales') {
            addDetail('part'); // Sales usually implies parts/products
        } else {
            addDetail('labor');
        }
    };

    const handleRowClick = async (project: any) => {
        try {
            const fullProject = await RepairService.getById(project.id);
            if (fullProject) {
                setSelectedProjectId(fullProject.id);
                setFormType((fullProject.type as 'repair' | 'sales') || 'repair');

                // Parse notes back to issue + notes
                const noteParts = (fullProject.notes || '').split('\n\n備考: ');
                const issue = noteParts[0] || '';
                const extraNotes = noteParts[1] || '';

                setFormState({
                    customerName: fullProject.customer?.name || '',
                    machineModel: fullProject.machineModel || '',
                    serialNumber: fullProject.serialNumber || '',
                    issueDescription: issue,
                    notes: extraNotes,
                    status: fullProject.status || 'received'
                });

                if (fullProject.details) {
                    setDetails(fullProject.details.map((d: any) => ({
                        lineType: d.lineType,
                        description: d.description,
                        supplier: d.supplier || '',
                        remarks: d.remarks || '',
                        quantity: Number(d.quantity),
                        unitPrice: Number(d.unitPrice),
                        unitCost: Number(d.unitCost),
                        productCategoryId: d.productCategoryId || (d.product ? d.product.categoryId : null), // Try to resolve category
                        section: d.category ? d.category.section : (d.product && d.product.productCategory ? d.product.productCategory.section : '') // Helper for UI
                    })));
                } else {
                    setDetails([]);
                }

                setPhotos(fullProject.photos || []);

                setIsFormOpen(true);
            }
        } catch (error) {
            console.error('Failed to fetch project details', error);
        }
    };

    // Helper to render Detail Section
    const renderDetailTable = (title: string, type: DetailItem['lineType'], showSupplier: boolean = false) => {
        const sectionDetails = details.map((d, i) => ({ ...d, originalIndex: i })).filter(d => d.lineType === type);

        const subtotalCost = sectionDetails.reduce((sum, d) => sum + (d.quantity * d.unitCost), 0);
        const subtotalSales = sectionDetails.reduce((sum, d) => sum + (d.quantity * d.unitPrice), 0);
        const subtotalProfit = subtotalSales - subtotalCost;
        const subtotalRate = subtotalSales > 0 ? (subtotalProfit / subtotalSales) * 100 : 0;

        // Unique Sections for Dropdown
        const sections = Array.from(new Set(categories.map(c => c.section)));

        return (
            <div className={styles.detailTableWrapper}>
                <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', color: '#334155' }}>
                    <span>{title}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => addDetail(type)}>
                        <Plus size={16} /> 追加
                    </Button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                            {type === 'part' && <th style={{ padding: '0.5rem', textAlign: 'left', width: '12%' }}>部門</th>}
                            {type === 'part' && <th style={{ padding: '0.5rem', textAlign: 'left', width: '12%' }}>種別</th>}
                            <th style={{ padding: '0.5rem', textAlign: 'left', width: type === 'part' ? '20%' : '25%' }}>内容</th>
                            {showSupplier && <th style={{ padding: '0.5rem', textAlign: 'left', width: '10%' }}>仕入先</th>}
                            <th style={{ padding: '0.5rem', textAlign: 'center', width: '60px' }}>数量</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '80px' }}>原価単価</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '80px' }}>原価計</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '80px' }}>請求単価</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '80px' }}>請求額</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '60px' }}>粗利額</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', width: '50px' }}>粗利率</th>
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

                            // Find current category object if selected
                            const selectedCategory = categories.find(c => c.id === detail.productCategoryId);
                            // Determine current section (either from selected category or user selection state - wait, we only store ID)
                            // We need to know the 'current section' to filter the type dropdown.
                            // If `productCategoryId` is set, section is determined.
                            // If not, we might want a UI-only state? Or just deduce?
                            // Issue: If ID is null, we don't know section.
                            // Solution: This is a controlled input problem. The user selects Section first.
                            // However, we don't have a field for 'section' in `detail`.
                            // Strategy: The Section dropdown value is derived from `selectedCategory?.section`.
                            // But if `selectedCategory` is null, Section is empty.
                            // If user changes `Section`, we should probably reset `productCategoryId`?
                            // Or simpler: We can't easily implement "Select Section -> Then Select Type" cleanly without transient state unless we allow filtering `categories` by looking at all of them.

                            // Let's rely on finding standard patterns or use a composite selector?
                            // No, User asked for "Section" and "Type" specifically.
                            // We will use a local variable `currentSection` derived from `selectedCategory?.section`.
                            // But what if user wants to change section?
                            // We need a way to select a section even if no category is selected.
                            // Since we can't add state per row easily without complicating `details`, 
                            // we'll assume the user picks a Section, and that filters the Type dropdown. 
                            // But the `select` element needs a value.
                            // Hack: We can use the first matching section? No.

                            // Better approach: Just show "Category Name (Section)" in one dropdown? 
                            // User asked specifically for "Section" and "Type Name".

                            // Let's try:
                            // The "Section" dropdown is controlled by `selectedCategory?.section` BUT if we want to change it, we need to temporarily hold it?
                            // or, `onChange` of Section simply clears the ID? But then how do we know which section is selected to filter the second list?
                            // WE NEED `section` in `DetailItem` purely for UI logic if we want this 2-step flow strictly.
                            // OR, just iterate categories and group them in the second dropdown?
                            // `<optgroup>` is the native way!
                            // "Section" column can be read-only display?
                            // "部門は明細内では選択だけで" -> "Select only".
                            // If I make Section specific, I need to store it.

                            // Let's add `tempSection` to DetailItem? Or just iterate all types in one list groups by section?
                            // User request: "部門と種別名を選択または入力できるようにして" -> "Make Section and Type Name selectable".

                            // Implementation:
                            // 1. Section Select: `onChange` -> resets `productCategoryId` to null, but we need to know what section was picked to show in Type.
                            //    We can't store "what section was picked" if we reset ID and don't have a field.
                            //    So, I WILL ADD `tempSection` to the `DetailItem` type or just `section` field?
                            //    Adding `section` field to `DetailItem` is safe. It won't be saved to DB directly (or ignored).

                            const currentSection = (detail as any).section || selectedCategory?.section || '';

                            return (
                                <tr key={detail.originalIndex} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    {type === 'part' && (
                                        <td style={{ padding: '0.25rem' }}>
                                            <select
                                                className={styles.tableInput}
                                                value={currentSection}
                                                onChange={(e) => {
                                                    const newSec = e.target.value;
                                                    handleDetailChange(detail.originalIndex, 'section' as any, newSec);
                                                    // Also clear category ID if section changes
                                                    handleDetailChange(detail.originalIndex, 'productCategoryId', null);
                                                }}
                                            >
                                                <option value="">-</option>
                                                {sections.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                    )}
                                    {type === 'part' && (
                                        <td style={{ padding: '0.25rem' }}>
                                            <select
                                                className={styles.tableInput}
                                                value={detail.productCategoryId || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value ? Number(e.target.value) : null;
                                                    handleDetailChange(detail.originalIndex, 'productCategoryId', val);
                                                    // Auto update section if category selected directly (if we allowed it)
                                                    const cat = categories.find(c => c.id === val);
                                                    if (cat) handleDetailChange(detail.originalIndex, 'section' as any, cat.section);
                                                }}
                                                disabled={!currentSection}
                                            >
                                                <option value="">-</option>
                                                {categories
                                                    .filter(c => c.section === currentSection)
                                                    .map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))
                                                }
                                            </select>
                                        </td>
                                    )}

                                    <td style={{ padding: '0.25rem' }}>
                                        <input type="text" className={styles.tableInput} value={detail.description} onChange={(e) => handleDetailChange(detail.originalIndex, 'description', e.target.value)} />
                                    </td>
                                    {showSupplier && (
                                        <td style={{ padding: '0.25rem' }}>
                                            <input
                                                type="text"
                                                className={styles.tableInput}
                                                value={detail.supplier}
                                                list={`supplier-list-${detail.originalIndex}`}
                                                onChange={(e) => handleDetailChange(detail.originalIndex, 'supplier', e.target.value)}
                                            />
                                            <datalist id={`supplier-list-${detail.originalIndex}`}>
                                                {suppliers.map(s => (
                                                    <option key={s.id} value={s.name}>{s.name}</option>
                                                ))}
                                            </datalist>
                                        </td>
                                    )}
                                    <td style={{ padding: '0.25rem' }}>
                                        <input type="number" className={styles.tableInput} style={{ textAlign: 'center' }} value={detail.quantity} onChange={(e) => handleDetailChange(detail.originalIndex, 'quantity', e.target.value)} min="0" step="0.1" />
                                    </td>
                                    <td style={{ padding: '0.25rem' }}>
                                        <div className={styles.currencyWrapper}>
                                            <CurrencyInput className={styles.tableInput} style={{ textAlign: 'right' }} value={detail.unitCost} onChange={(val) => handleDetailChange(detail.originalIndex, 'unitCost', val)} />
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.25rem', textAlign: 'right' }}>{costTotal.toLocaleString()}</td>
                                    <td style={{ padding: '0.25rem' }}>
                                        <div className={styles.currencyWrapper}>
                                            <CurrencyInput className={styles.tableInput} style={{ textAlign: 'right' }} value={detail.unitPrice} onChange={(val) => handleDetailChange(detail.originalIndex, 'unitPrice', val)} />
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.25rem', textAlign: 'right' }}>{salesTotal.toLocaleString()}</td>
                                    <td style={{ padding: '0.25rem', textAlign: 'right' }}>{profit.toLocaleString()}</td>
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
                        <tr style={{ background: '#fffbeb', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            <td colSpan={type === 'part' ? (showSupplier ? 5 : 4) : (showSupplier ? 3 : 2)} style={{ textAlign: 'right', padding: '0.4rem' }}>小計</td>
                            <td style={{ padding: '0.4rem', textAlign: 'right' }}></td>
                            <td style={{ padding: '0.4rem', textAlign: 'right' }}>{subtotalCost.toLocaleString()}</td>
                            <td style={{ padding: '0.4rem', textAlign: 'right' }}></td>
                            <td style={{ padding: '0.4rem', textAlign: 'right' }}>{subtotalSales.toLocaleString()}</td>
                            <td style={{ padding: '0.4rem', textAlign: 'right' }}>{subtotalProfit.toLocaleString()}</td>
                            <td style={{ padding: '0.4rem', textAlign: 'right' }}>{Math.round(subtotalRate)}%</td>
                            <td colSpan={2}></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };



    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>修理・販売管理</h1>
                    <p className={styles.subtitle}>案件の登録・進捗管理</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button icon={<ShoppingCart size={18} />} onClick={() => openNewForm('sales')} style={{ backgroundColor: '#0ea5e9', border: 'none' }}>
                        新規販売登録
                    </Button>
                    <Button icon={<Wrench size={18} />} onClick={() => openNewForm('repair')}>
                        新規修理受付
                    </Button>
                </div>
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
                            <th style={{ width: '80px' }}>タイプ</th>
                            <th>ステータス</th>
                            <th>受付/販売日</th>
                            <th>顧客名</th>
                            <th>機種 / シリアル (件名)</th>
                            <th>備考</th>
                            <th>アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.length === 0 ? (
                            <tr>
                                <td colSpan={7} className={styles.emptyState}>データがありません</td>
                            </tr>
                        ) : (
                            projects.map(project => (
                                <tr key={project.id} onClick={() => handleRowClick(project)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            backgroundColor: (project as any).type === 'sales' ? '#e0f2fe' :
                                                (project as any).type === 'inspection' ? '#f3e8ff' :
                                                    (project as any).type === 'maintenance' ? '#ffedd5' : '#fef9c3',
                                            color: (project as any).type === 'sales' ? '#0369a1' :
                                                (project as any).type === 'inspection' ? '#7e22ce' :
                                                    (project as any).type === 'maintenance' ? '#c2410c' : '#854d0e',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {(project as any).type === 'sales' ? '販売' :
                                                (project as any).type === 'inspection' ? '点検' :
                                                    (project as any).type === 'maintenance' ? '整備' : '修理'}
                                        </span>
                                    </td>
                                    <td><StatusBadge status={project.status || 'received'} /></td>
                                    <td>{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'}</td>
                                    <td className={styles.customerName}>{project.customer?.name || '-'}</td>
                                    <td>
                                        <div className={styles.machineInfo}>
                                            <span className={styles.model}>{project.machineModel || '-'}</span>
                                            <span className={styles.serial}>{project.serialNumber || '-'}</span>
                                        </div>
                                    </td>
                                    <td className={styles.issue}>{project.notes}</td>
                                    <td>
                                        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm" onClick={() => window.open(`${API_BASE_URL}/projects/${project.id}/pdf/invoice`, '_blank')} title="請求書PDF"><FileText size={16} /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => window.open(`${API_BASE_URL}/projects/${project.id}/pdf/delivery`, '_blank')} title="納品書PDF"><FileText size={16} color="#10b981" /></Button>
                                            <Button variant="ghost" size="sm" onClick={(e) => handleDeleteProject(project.id, e)} title="削除" style={{ color: '#ef4444' }}><Trash2 size={16} /></Button>
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
                            <h2>
                                {selectedProjectId ? '案件詳細・編集' : (formType === 'sales' ? '新規販売登録' : '新規修理受付')}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <select
                                    value={formType}
                                    onChange={(e) => setFormType(e.target.value as any)}
                                    className="border rounded p-1 text-sm form-select"
                                    style={{
                                        borderColor: '#cbd5e1',
                                        color: '#334155',
                                        fontWeight: 'bold',
                                        padding: '0.25rem 2rem 0.25rem 0.5rem'
                                    }}
                                >
                                    <option value="repair">修理案件</option>
                                    <option value="inspection">点検案件</option>
                                    <option value="maintenance">整備案件</option>
                                    <option value="sales">販売案件</option>
                                </select>
                                <button className={styles.closeButton} onClick={() => setIsFormOpen(false)}><X size={24} /></button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Summary Header */}
                            <div className={styles.summaryHeader}>
                                <div className={styles.formGrid}>
                                    <div>
                                        <Input
                                            label="顧客名"
                                            name="customerName"
                                            value={formState.customerName}
                                            onChange={handleInputChange}
                                            required
                                            list="customer-list"
                                            autoComplete="off"
                                        />
                                        <datalist id="customer-list">
                                            {customers.map(c => <option key={c.id} value={c.name} />)}
                                        </datalist>
                                    </div>

                                    {/* Show Machine Info for Repairs/Inspection/Maintenance OR if data is present */}
                                    {((formType === 'repair' || formType === 'inspection' || formType === 'maintenance') || formState.machineModel) && (
                                        <>
                                            {/* Machine Select (Optional helper) */}
                                            {availableMachines.length > 0 && (
                                                <div className="mb-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">登録済機材から選択</label>
                                                    <select
                                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                                        onChange={(e) => {
                                                            const mId = Number(e.target.value);
                                                            const machine = allMachines.find(m => m.id === mId);
                                                            if (machine) {
                                                                setFormState(prev => ({
                                                                    ...prev,
                                                                    machineModel: machine.machineModel,
                                                                    serialNumber: machine.serialNumber
                                                                }));
                                                            }
                                                        }}
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>機材を選択...</option>
                                                        {availableMachines.map(m => (
                                                            <option key={m.id} value={m.id}>
                                                                {m.machineModel} / {m.serialNumber}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <Input label="機種名" name="machineModel" value={formState.machineModel} onChange={handleInputChange} required={formType !== 'sales'} />
                                            <Input label="シリアル番号" name="serialNumber" value={formState.serialNumber} onChange={handleInputChange} required={formType !== 'sales'} />
                                        </>
                                    )}

                                    {/* Status Selection */}
                                    <div className="mb-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                                        <select
                                            name="status"
                                            value={formState.status}
                                            onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value }))}
                                            className="w-full border rounded-md p-2 text-sm font-bold"
                                            style={{
                                                backgroundColor: getStatusStyle(formState.status).bg,
                                                color: getStatusStyle(formState.status).color,
                                                borderColor: '#d1d5db'
                                            }}
                                        >
                                            <option value="received" style={{ backgroundColor: '#e2e8f0', color: '#1e293b' }}>受付済</option>
                                            <option value="diagnosing" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>診断中</option>
                                            <option value="in_progress" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>作業中</option>
                                            <option value="completed" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>完了</option>
                                            <option value="delivered" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>引渡済</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.summaryStats}>
                                    <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#64748b' }}>
                                        <div>工賃: {totals.categoryTotals.labor.sales.toLocaleString()}</div>
                                        <div>部品: {totals.categoryTotals.part.sales.toLocaleString()}</div>
                                        <div>外注: {totals.categoryTotals.outsourcing.sales.toLocaleString()}</div>
                                        <div>出張: {totals.categoryTotals.travel.sales.toLocaleString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontWeight: 'bold', marginLeft: '2rem' }}>
                                        <div>原価計: {totals.totalCost.toLocaleString()}円</div>
                                        <div style={{ fontSize: '1.25rem', color: '#0f172a' }}>請求計: {totals.totalSales.toLocaleString()}円</div>
                                        <div style={{ color: '#10b981' }}>粗利: {totals.grossProfit.toLocaleString()}円</div>
                                        <div>率: {Math.round(totals.profitRate)}%</div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.notesGrid}>
                                {formType !== 'sales' && (
                                    <Textarea label="症状・不具合内容" name="issueDescription" value={formState.issueDescription} onChange={handleInputChange} required />
                                )}
                                <Textarea label="全体備考" name="notes" value={formState.notes} onChange={handleInputChange} />
                            </div>

                            {/* Photos Section */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>写真管理</h3>
                                    {selectedProjectId && (
                                        <div>
                                            <input
                                                type="file"
                                                id="photo-upload"
                                                multiple
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={handlePhotoUpload}
                                            />
                                            <label htmlFor="photo-upload">
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.5rem 1rem',
                                                    backgroundColor: 'white',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '0.375rem',
                                                    fontSize: '0.875rem',
                                                    color: '#334155',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontWeight: 500
                                                }}>
                                                    <Camera size={16} /> 写真を追加
                                                </span>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {!selectedProjectId ? (
                                    <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem', border: '2px dashed #e2e8f0', borderRadius: '0.5rem', backgroundColor: '#f1f5f9' }}>
                                        <p>案件を保存した後に写真を登録できます。</p>
                                        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>まずは「保存する」ボタンを押して案件を作成してください。</p>
                                    </div>
                                ) : photos.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', border: '2px dashed #e2e8f0', borderRadius: '0.5rem' }}>
                                        登録された写真はありません
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                                        {photos.map(photo => (
                                            <div key={photo.id} style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0', aspectRatio: '4/3' }}>
                                                <img
                                                    src={photo.filePath}
                                                    alt={photo.fileName}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                                    onClick={() => setPreviewPhoto(photo.filePath)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePhotoDelete(photo.id);
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '0.25rem',
                                                        right: '0.25rem',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        padding: '0.25rem',
                                                        cursor: 'pointer',
                                                        color: '#ef4444',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Lightbox Modal */}
                            {previewPhoto && (
                                <div
                                    style={{
                                        position: 'fixed',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                        zIndex: 9999,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setPreviewPhoto(null)}
                                >
                                    <button
                                        style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            background: 'none',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setPreviewPhoto(null)}
                                    >
                                        <X size={32} />
                                    </button>
                                    <img
                                        src={previewPhoto}
                                        alt="Preview"
                                        style={{
                                            maxWidth: '90vw',
                                            maxHeight: '90vh',
                                            objectFit: 'contain',
                                            borderRadius: '4px',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                        }}
                                        onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
                                    />
                                </div>
                            )}

                            {/* Details Sections */}
                            <div className={styles.detailsSection} style={{ background: 'none', border: 'none', padding: 0 }}>
                                {formType !== 'sales' && renderDetailTable('工賃', 'labor', false)}
                                {renderDetailTable('部品・商品', 'part', true)}
                                {renderDetailTable('外注費', 'outsourcing', true)}
                                {formType !== 'sales' && renderDetailTable('出張費', 'travel', false)}
                                {renderDetailTable('その他', 'other', false)}
                            </div>

                            <div className={styles.formActions}>
                                {selectedProjectId && (
                                    <Button type="button" variant="ghost" onClick={() => handleDeleteProject(selectedProjectId)} style={{ color: '#ef4444', marginRight: 'auto' }}>
                                        <Trash2 size={16} style={{ marginRight: '4px' }} /> 削除
                                    </Button>
                                )}
                                <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>キャンセル</Button>
                                <Button type="submit">{selectedProjectId ? '更新する' : '保存する'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
                    <div className={styles.modal} style={{ maxWidth: '400px', padding: '0' }}>
                        <div className={styles.modalHeader} style={{ background: '#fee2e2', borderBottom: '1px solid #fecaca' }}>
                            <h2 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Trash2 size={20} /> 削除の確認
                            </h2>
                            <button className={styles.closeButton} onClick={() => setDeleteConfirmation({ isOpen: false, targetId: null })}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <p style={{ marginBottom: '1rem', color: '#1f2937' }}>
                                本当にこの案件を削除しますか？<br />
                                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>※削除すると復元することはできません。</span>
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <Button variant="secondary" onClick={() => setDeleteConfirmation({ isOpen: false, targetId: null })}>キャンセル</Button>
                                <Button onClick={confirmDelete} style={{ backgroundColor: '#ef4444', border: 'none', color: 'white' }}>削除する</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Repairs;
