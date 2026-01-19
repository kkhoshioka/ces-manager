import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, X, FileText, Trash2, ShoppingCart, Wrench, Camera } from 'lucide-react';
import type { Repair } from '../types/repair';
import { RepairService } from '../utils/repairService';
import { customerService } from '../utils/customerService';
import { supplierService } from '../utils/supplierService';
import { API_BASE_URL } from '../config';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import styles from './Repairs.module.css';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import type { Customer, CustomerMachine } from '../types/customer';
import type { ProjectPhoto, RepairStatus } from '../types/repair';
import type { Supplier } from '../types/supplier';
import type { ProductCategory } from '../types/inventory';

// Status helper
const getStatusStyle = (status: string) => {
    switch (status) {
        case 'received': return { bg: '#e2e8f0', color: '#1e293b', label: '仮登録' };
        case 'in_progress': return { bg: '#dbeafe', color: '#1e40af', label: '作業中' };
        case 'completed': return { bg: '#dcfce7', color: '#166534', label: '完了' };
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
    const [formState, setFormState] = useState<{
        customerName: string;
        machineModel: string;
        serialNumber: string;
        hourMeter: string;
        issueDescription: string;
        notes: string;
        orderDate: string;
        completionDate: string;
        status: RepairStatus;
    }>({
        customerName: '',
        machineModel: '',
        serialNumber: '',
        hourMeter: '',
        issueDescription: '',
        notes: '',
        orderDate: new Date().toISOString().split('T')[0], // Default to today
        completionDate: '',
        status: 'received'
    });

    // System Settings
    const [systemSettings, setSystemSettings] = useState<{
        defaultLaborRate: number;
        defaultTravelTimeRate: number;
        defaultTravelDistanceRate: number;
    }>({ defaultLaborRate: 8000, defaultTravelTimeRate: 3000, defaultTravelDistanceRate: 50 });

    useEffect(() => {
        fetch(`${API_BASE_URL}/system-settings`)
            .then(res => res.json())
            .then(data => {
                setSystemSettings({
                    defaultLaborRate: Number(data.defaultLaborRate) || 8000,
                    defaultTravelTimeRate: Number(data.defaultTravelTimeRate) || 3000,
                    defaultTravelDistanceRate: Number(data.defaultTravelDistanceRate) || 50
                });
            })
            .catch(console.error);
    }, []);

    // Selection Data
    // Selection Data
    // State for Master Data (Lazy Loading)
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [allMachines, setAllMachines] = useState<CustomerMachine[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    // Loading Flags
    const [isMasterDataLoaded, setIsMasterDataLoaded] = useState(false);
    const [isFormLoading, setIsFormLoading] = useState(false);
    const [isLoadingList, setIsLoadingList] = useState(true);

    // Derived state for available machines based on selected customer name
    const availableMachines = useMemo(() => {
        const customer = customers.find(c => c.name === formState.customerName);
        if (!customer) return [];
        return allMachines.filter(m => m.customerId === customer.id);
    }, [formState.customerName, customers, allMachines]);

    // Lazy load masters function
    const loadFormData = async () => {
        if (isMasterDataLoaded) return;

        setIsFormLoading(true);
        try {
            const [custs, machs, cats, supps] = await Promise.all([
                customerService.getAllCustomers().catch(() => []),
                customerService.getAllMachines().catch(() => []),
                fetch(`${API_BASE_URL}/categories`).then(r => r.json()).catch(() => []),
                fetch(`${API_BASE_URL}/suppliers`).then(r => r.json()).catch(() => [])
            ]);

            setCustomers(Array.isArray(custs) ? custs : []);
            setAllMachines(Array.isArray(machs) ? machs : []);
            setCategories(Array.isArray(cats) ? cats : []);
            setSuppliers(Array.isArray(supps) ? supps : []);

            setIsMasterDataLoaded(true);
        } catch (error) {
            console.error('Failed to load master data', error);
            alert('マスタデータの読み込みに失敗しました。');
        } finally {
            setIsFormLoading(false);
        }
    };

    // Details State
    interface DetailItem {
        lineType: 'labor' | 'part' | 'outsourcing' | 'travel' | 'other';
        travelType?: 'time' | 'distance'; // New field for Travel rows
        productCode?: string; // New field for Product Code
        description: string;
        supplier?: string;
        supplierId?: number | null;
        remarks?: string;
        quantity: number;
        unitPrice: number; // Sales Price
        unitCost: number;  // Cost Price
        productId?: number | null;
        productCategoryId?: number | null; // Selected Category ID
        section?: string; // Helper for UI
        amountCost: number;
        amountSales: number;
        originalIndex: number;
    }

    const [details, setDetails] = useState<DetailItem[]>([]);
    const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
    const [pendingPhotos, setPendingPhotos] = useState<File[]>([]); // New state for buffering
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length) return;

        const newFiles = Array.from(e.target.files);

        if (selectedProjectId) {
            // Existing logic: Upload immediately
            const formData = new FormData();
            newFiles.forEach(file => {
                formData.append('photos', file);
            });

            try {
                const uploaded = await RepairService.uploadPhotos(selectedProjectId, formData);
                setPhotos(prev => [...prev, ...uploaded]);
            } catch (error) {
                console.error('Failed to upload photos', error);
                alert(`写真のアップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } else {
            // New logic: Buffer locally
            setPendingPhotos(prev => [...prev, ...newFiles]);
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

    const nextIdRef = React.useRef(0);
    const addDetail = (type: DetailItem['lineType']) => {
        nextIdRef.current += 1;

        if (type === 'travel') {
            // Add Time and Distance rows
            const timeRow: DetailItem = {
                lineType: 'travel',
                travelType: 'time',
                description: '',
                supplier: '',
                supplierId: null,
                remarks: '',
                quantity: 1,
                unitPrice: systemSettings.defaultTravelTimeRate,
                unitCost: 0,
                amountCost: 0,
                amountSales: systemSettings.defaultTravelTimeRate,
                originalIndex: nextIdRef.current
            };
            nextIdRef.current += 1;
            const distanceRow: DetailItem = {
                lineType: 'travel',
                travelType: 'distance',
                description: '',
                supplier: '',
                supplierId: null,
                remarks: '',
                quantity: 10,
                unitPrice: systemSettings.defaultTravelDistanceRate,
                unitCost: 0,
                amountCost: 0,
                amountSales: systemSettings.defaultTravelDistanceRate * 10,
                originalIndex: nextIdRef.current
            };
            setDetails(prev => [...prev, timeRow, distanceRow]);
        } else {
            setDetails(prev => [...prev, {
                lineType: type,
                productCode: '',
                description: '',
                supplier: '',
                supplierId: null,
                remarks: '',
                quantity: 1,
                unitPrice: type === 'labor' ? systemSettings.defaultLaborRate : 0,
                unitCost: 0,
                amountCost: 0,
                amountSales: type === 'labor' ? systemSettings.defaultLaborRate : 0,
                originalIndex: nextIdRef.current
            }]);
        }
    };

    const removeDetail = (index: number) => {
        setDetails(details.filter((_, i) => i !== index));
    };

    const handleDetailChange = (index: number, field: keyof DetailItem, value: number | string | null) => {
        setDetails(prevDetails => {
            const newDetails = [...prevDetails];
            const item = { ...newDetails[index] }; // Copy item to avoid mutation of prev state

            if (field === 'quantity' || field === 'unitPrice' || field === 'unitCost') {
                const strVal = String(value).replace(/,/g, '');
                const numVal = Number(strVal);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (item as any)[field] = isNaN(numVal) ? 0 : numVal;
            } else if (field === 'productCategoryId') {
                // Ensure 0 becomes null (safe for optional relation)
                const numVal = Number(value);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (item as any)[field] = (numVal === 0 || isNaN(numVal)) ? null : numVal;
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        setIsLoadingList(true);
        try {
            // Default to loading top 50 for performance
            const data = await RepairService.getAll({ limit: 50 });
            setProjects(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load projects', error);
        } finally {
            setIsLoadingList(false);
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
                // Now uses backend search via Service
                const results = await RepairService.search(query);
                setProjects(results);
            }
        } catch (error) {
            console.error('Search failed', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFormState(prev => ({ ...prev, [name]: value as any }));
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
        if (isSubmitting) return;
        setIsSubmitting(true);
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

            // Supplier Auto-Registration Logic
            const uniqueNewSuppliers = Array.from(new Set(
                details
                    .filter(d => d.supplier && !suppliers.some(s => s.name === d.supplier))
                    .map(d => d.supplier as string)
            ));

            let currentSuppliers = [...suppliers];

            if (uniqueNewSuppliers.length > 0) {
                try {
                    const newSupplierPromises = uniqueNewSuppliers.map(name => supplierService.createSupplier(name));
                    const createdSuppliers = await Promise.all(newSupplierPromises);
                    currentSuppliers = [...currentSuppliers, ...createdSuppliers];
                    setSuppliers(currentSuppliers); // Update local state
                } catch (error) {
                    console.error('Failed to auto-register suppliers', error);
                    // Continue saving even if supplier registration fails (names will be text-only)
                }
            }

            const projectData = {
                type: formType, // Include type
                customerId: customer.id,
                customerMachineId: customerMachineId,
                machineModel: formState.machineModel,
                serialNumber: formState.serialNumber,
                hourMeter: formState.hourMeter,
                orderDate: formState.orderDate ? new Date(formState.orderDate) : new Date(), // Auto-fill today if empty
                completionDate: formState.completionDate ? new Date(formState.completionDate) : null,
                notes: ((formType === 'repair' || formType === 'inspection' || formType === 'maintenance') ? formState.issueDescription : '') + (formState.notes ? `\n\n備考: ${formState.notes}` : ''),
                status: formState.status,
                totalAmount: totals.totalSales,
                details: details.map(d => {
                    const safeQty = isNaN(Number(d.quantity)) ? 0 : Number(d.quantity);
                    const safePrice = isNaN(Number(d.unitPrice)) ? 0 : Number(d.unitPrice);
                    const safeCost = isNaN(Number(d.unitCost)) ? 0 : Number(d.unitCost);

                    // Sanitize Product Category ID
                    // If the selected ID is not in the current list of categories, null it out
                    let validCategoryId = d.productCategoryId;
                    if (validCategoryId && !categories.some(c => c.id === validCategoryId)) {
                        console.warn(`[Auto-Fix] Invalid Category ID ${validCategoryId} found. Clearing.`);
                        validCategoryId = null;
                    }

                    // Resolve Supplier ID
                    // If ID is present but not in list, try to match by name, or clear if name doesn't match
                    let validSupplierId = d.supplierId;
                    const matchedSupplier = currentSuppliers.find(s => s.name === d.supplier);

                    if (matchedSupplier) {
                        validSupplierId = matchedSupplier.id;
                    } else if (validSupplierId && !currentSuppliers.some(s => s.id === validSupplierId)) {
                        // ID exists but not found in list, and name didn't match a valid supplier
                        console.warn(`[Auto-Fix] Invalid Supplier ID ${validSupplierId} found. Clearing.`);
                        validSupplierId = null;
                    }

                    return {
                        lineType: d.lineType,
                        description: d.lineType === 'travel' && d.travelType
                            ? `【${d.travelType === 'time' ? '移動時間' : '移動距離'}】${d.description}`
                            : (d.lineType === 'part' && d.productCode
                                ? `【${d.productCode}】${d.description}`
                                : d.description),
                        supplier: d.supplier,
                        supplierId: validSupplierId,
                        remarks: d.remarks,
                        quantity: safeQty,
                        unitPrice: safePrice,
                        unitCost: safeCost,
                        productCategoryId: validCategoryId, // Pass to backend
                        amountCost: safeQty * safeCost,
                        amountSales: safeQty * safePrice
                    };
                })
            };

            let projectId = selectedProjectId;

            if (selectedProjectId) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await RepairService.update(selectedProjectId, projectData as any);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newProject = await RepairService.add(projectData as any);
                projectId = newProject.id;
            }

            // Upload pending photos if any
            if (pendingPhotos.length > 0 && projectId) {
                const formData = new FormData();
                pendingPhotos.forEach(file => formData.append('photos', file));
                try {
                    await RepairService.uploadPhotos(projectId, formData);
                } catch (photoErr) {
                    console.error('Failed to upload pending photos', photoErr);
                    alert('案件は保存されましたが、写真のアップロードに失敗しました。詳細画面から再度アップロードしてください。');
                }
            }

            resetForm();
            loadProjects();
        } catch (error) {
            console.error('Failed to save project', error);
            alert(`保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormState({
            customerName: '',
            machineModel: '',
            serialNumber: '',
            hourMeter: '',
            issueDescription: '',
            notes: '',
            orderDate: new Date().toISOString().split('T')[0],
            completionDate: '',
            status: 'received'
        });
        setDetails([]);
        setPendingPhotos([]); // Clear pending
        setPhotos([]); // Clear photos
        setSelectedProjectId(null);
        setIsFormOpen(false);
        setFormType('repair'); // Default reset
    };

    const openNewForm = async (type: 'repair' | 'sales') => {
        await loadFormData(); // Load masters before opening
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

    const handleRowClick = async (project: Repair) => {
        // Optimistic UI: Open immediately with loading state
        setIsFormOpen(true);
        setIsFormLoading(true);
        setSelectedProjectId(project.id);

        // Populate partial data from list view
        setFormType((project.type as 'repair' | 'sales') || 'repair');
        const noteParts = (project.notes || '').split('\n\n備考: ');
        setFormState({
            customerName: project.customer?.name || '',
            machineModel: project.machineModel || '',
            serialNumber: project.serialNumber || '',
            hourMeter: project.hourMeter || '',
            orderDate: project.orderDate ? new Date(project.orderDate).toISOString().split('T')[0] : '',
            completionDate: project.completionDate ? new Date(project.completionDate).toISOString().split('T')[0] : '',
            issueDescription: noteParts[0] || '',
            notes: noteParts[1] || '',
            status: (project.status as RepairStatus) || 'received'
        });

        // Clear details/photos initially or keep previous? Better to clear to avoid confusion
        setDetails([]);
        setPhotos([]);

        try {
            // Parallelize loading
            const [fullProject] = await Promise.all([
                RepairService.getById(project.id),
                loadFormData()
            ]);

            if (fullProject) {
                // Update with full details
                setSelectedProjectId(fullProject.id); // Confirm ID
                setFormType((fullProject.type as 'repair' | 'sales') || 'repair');

                const fullNoteParts = (fullProject.notes || '').split('\n\n備考: ');
                const fullIssue = fullNoteParts[0] || '';
                const fullExtraNotes = fullNoteParts[1] || '';

                setFormState(prev => ({
                    ...prev,
                    customerName: fullProject.customer?.name || prev.customerName,
                    machineModel: fullProject.machineModel || prev.machineModel,
                    serialNumber: fullProject.serialNumber || prev.serialNumber,
                    hourMeter: fullProject.hourMeter || prev.hourMeter,
                    orderDate: fullProject.orderDate ? new Date(fullProject.orderDate).toISOString().split('T')[0] : prev.orderDate,
                    completionDate: fullProject.completionDate ? new Date(fullProject.completionDate).toISOString().split('T')[0] : prev.completionDate,
                    issueDescription: fullIssue,
                    notes: fullExtraNotes,
                    status: (fullProject.status as RepairStatus) || prev.status
                }));

                if (fullProject.details) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setDetails(fullProject.details.map((d: any) => {
                        let tType: 'time' | 'distance' | undefined = undefined;
                        let pCode = '';
                        let desc = d.description;

                        if (d.lineType === 'travel') {
                            if (desc.startsWith('【移動時間】')) {
                                tType = 'time';
                                desc = desc.replace('【移動時間】', '');
                            } else if (desc.startsWith('【移動距離】')) {
                                tType = 'distance';
                                desc = desc.replace('【移動距離】', '');
                            } else if (desc === '移動時間' || desc === '移動時間(H)') {
                                tType = 'time';
                                desc = ''; // Clear legacy fixed text
                            } else if (desc === '移動距離' || desc === '移動距離(km)') {
                                tType = 'distance';
                                desc = ''; // Clear legacy fixed text
                            } else {
                                // Default fallback if data is weird or user manually entered something
                                tType = 'time';
                            }
                        } else if (d.lineType === 'part') {
                            // Parse Product Code: 【Code】Name
                            const codeMatch = desc.match(/^【(.*?)】(.*)/);
                            if (codeMatch) {
                                pCode = codeMatch[1];
                                desc = codeMatch[2];
                            }
                        }

                        return {
                            lineType: d.lineType,
                            travelType: tType,
                            productCode: pCode,
                            description: desc,
                            supplier: d.supplier || '',
                            supplierId: d.supplierId || null,
                            remarks: d.remarks || '',
                            quantity: Number(d.quantity),
                            unitPrice: Number(d.unitPrice),
                            unitCost: Number(d.unitCost),
                            productCategoryId: d.productCategoryId || (d.product ? d.product.categoryId : null), // Try to resolve category
                            section: d.category ? d.category.section : (d.product && d.product.productCategory ? d.product.productCategory.section : '') // Helper for UI
                        } as DetailItem;
                    }));
                } else {
                    setDetails([]);
                }

                setPhotos(fullProject.photos || []);
            }
        } catch (error) {
            console.error('Failed to fetch project details', error);
            alert('詳細データの取得に失敗しました。');
        } finally {
            setIsFormLoading(false);
        }
    };

    // Helper to render Detail Section
    const renderDetailTable = (title: string, type: DetailItem['lineType'], showSupplier: boolean = false) => {
        const sectionDetails = details.map((d, i) => ({ ...d, originalIndex: i })).filter(d => d.lineType === type);

        const subtotalCost = sectionDetails.reduce((sum, d) => sum + (d.quantity * d.unitCost), 0);
        const subtotalSales = sectionDetails.reduce((sum, d) => sum + (d.quantity * d.unitPrice), 0);


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

                            {type === 'part' && <th style={{ padding: '0.5rem', textAlign: 'left', width: '10%' }}>品番</th>}
                            {/* Travel Type has split columns */}
                            {type === 'travel' ? (
                                <>
                                    <th style={{ padding: '0.5rem', textAlign: 'left', width: '35%' }}>移動場所・区間</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'center', width: '20%' }}>項目</th>
                                </>
                            ) : (
                                <th style={{ padding: '0.5rem', textAlign: 'left', width: type === 'part' ? '25%' : '55%' }}>
                                    {type === 'part' ? '内容・品名' : '内容'}
                                </th>
                            )}

                            {showSupplier && <th style={{ padding: '0.5rem', textAlign: 'left', width: '10%' }}>仕入先</th>}
                            <th style={{ padding: '0.5rem', textAlign: 'center', width: '60px' }}>
                                {type === 'labor' ? '時間' : (type === 'travel' ? '数量' : '数量')}
                            </th>
                            {(type !== 'labor' && type !== 'travel') && (
                                <>
                                    <th style={{ padding: '0.5rem', textAlign: 'right', minWidth: '120px', whiteSpace: 'nowrap' }}>原価単価</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'right', minWidth: '120px', whiteSpace: 'nowrap' }}>原価計</th>
                                </>
                            )}
                            <th style={{ padding: '0.5rem', textAlign: 'right', minWidth: '120px', whiteSpace: 'nowrap' }}>請求単価</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', minWidth: '120px', whiteSpace: 'nowrap' }}>請求額</th>
                            <th style={{ width: '40px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sectionDetails.map((detail) => {
                            const costTotal = detail.quantity * detail.unitCost;
                            const salesTotal = detail.quantity * detail.unitPrice;
                            // Profit calculations removed from display


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

                            const currentSection = detail.section || selectedCategory?.section || '';

                            return (
                                <tr key={detail.originalIndex} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    {type === 'part' && (
                                        <td style={{ padding: '0.25rem' }}>
                                            <select
                                                className={styles.tableInput}
                                                value={currentSection}
                                                onChange={(e) => {
                                                    const newSec = e.target.value;
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                                    {type === 'part' && (
                                        <td style={{ padding: '0.25rem' }}>
                                            <input
                                                type="text"
                                                className={styles.tableInput}
                                                value={detail.productCode || ''}
                                                onChange={(e) => handleDetailChange(detail.originalIndex, 'productCode' as any, e.target.value)}
                                                placeholder="品番"
                                            />
                                        </td>
                                    )}

                                    {/* Description / Location Column */}
                                    {type === 'travel' ? (
                                        <>
                                            {/* Location Input Column */}
                                            <td style={{ padding: '0.25rem' }}>
                                                {detail.travelType === 'time' && (
                                                    <input
                                                        type="text"
                                                        className={styles.tableInput}
                                                        value={detail.description}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            // Custom update to sync Next Row (Distance)
                                                            setDetails(prev => {
                                                                const newDetails = [...prev];
                                                                // Update current (Time)
                                                                newDetails[detail.originalIndex] = { ...newDetails[detail.originalIndex], description: val };

                                                                // Try to update next (Distance) if it exists and matches
                                                                const nextIdx = detail.originalIndex + 1;
                                                                if (nextIdx < newDetails.length) {
                                                                    const nextItem = newDetails[nextIdx];
                                                                    if (nextItem.lineType === 'travel' && nextItem.travelType === 'distance') {
                                                                        newDetails[nextIdx] = { ...newDetails[nextIdx], description: val };
                                                                    }
                                                                }
                                                                return newDetails;
                                                            });
                                                        }}
                                                        placeholder="移動場所・区間など"
                                                    />
                                                )}
                                                {detail.travelType === 'distance' && (
                                                    <div style={{ height: '34px' }}></div> // Spacer for empty cell
                                                )}
                                            </td>
                                            {/* Fixed Item Label Column */}
                                            <td style={{ padding: '0.25rem', textAlign: 'center' }}>
                                                <span style={{
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 'bold',
                                                    color: '#475569',
                                                }}>
                                                    {detail.travelType === 'time' ? '移動時間' : '移動距離'}
                                                </span>
                                            </td>
                                        </>
                                    ) : (
                                        /* Standard Content Column for other types */
                                        <td style={{ padding: '0.25rem' }}>
                                            <input
                                                type="text"
                                                className={styles.tableInput}
                                                value={detail.description}
                                                onChange={(e) => handleDetailChange(detail.originalIndex, 'description', e.target.value)}
                                                placeholder={type === 'labor' ? '作業内容（点検、清掃、部品交換など）' : '詳細内容'}
                                            />
                                        </td>
                                    )}
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
                                        <div className={styles.currencyWrapper} style={{ justifyContent: 'center' }}>
                                            <input
                                                type="number"
                                                className={styles.tableInput}
                                                style={{ textAlign: 'center', width: '80px' }} // Widen for 3 digits + margin
                                                value={detail.quantity}
                                                onChange={(e) => handleDetailChange(detail.originalIndex, 'quantity', e.target.value)}
                                                min="0"
                                                step="0.1"
                                                placeholder={
                                                    type === 'travel' && detail.travelType === 'distance' ? '10' : '1.0'
                                                }
                                            />
                                            {/* Unit Logic */}
                                            <span className={styles.currencyUnit}>
                                                {type === 'labor' ? 'H' :
                                                    (type === 'travel' && detail.travelType === 'distance' ? 'km' :
                                                        (type === 'travel' ? 'H' : ''))}
                                            </span>
                                        </div>
                                    </td>
                                    {(type !== 'labor' && type !== 'travel') && (
                                        <>
                                            <td style={{ padding: '0.25rem' }}>
                                                <div className={styles.currencyWrapper}>
                                                    <CurrencyInput className={styles.tableInput} style={{ textAlign: 'right', minWidth: '100px' }} value={detail.unitCost} onChange={(val: number | string) => handleDetailChange(detail.originalIndex, 'unitCost', val)} />
                                                    <span className={styles.currencyUnit}>円</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.25rem', textAlign: 'right' }}>{costTotal.toLocaleString()}円</td>
                                        </>
                                    )}
                                    <td style={{ padding: '0.25rem' }}>
                                        <div className={styles.currencyWrapper}>
                                            <CurrencyInput className={styles.tableInput} style={{ textAlign: 'right', minWidth: '100px' }} value={detail.unitPrice} onChange={(val: number | string) => handleDetailChange(detail.originalIndex, 'unitPrice', val)} />
                                            <span className={styles.currencyUnit}>円</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.25rem', textAlign: 'right' }}>{salesTotal.toLocaleString()}円</td>
                                    {/* Remarks column removed */}
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
                            {(type !== 'labor' && type !== 'travel') && (
                                <>
                                    <td style={{ padding: '0.4rem', textAlign: 'right' }}></td>
                                    <td style={{ padding: '0.4rem', textAlign: 'right' }}>{subtotalCost.toLocaleString()}円</td>
                                </>
                            )}
                            <td style={{ padding: '0.4rem', textAlign: 'right' }}></td>
                            <td style={{ padding: '0.4rem', textAlign: 'right' }}>{subtotalSales.toLocaleString()}円</td>
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
                            <th>内容</th>
                            <th>アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingList ? (
                            <tr>
                                <td colSpan={7} className={styles.emptyState}>
                                    <LoadingSpinner />
                                </td>
                            </tr>
                        ) : projects.length === 0 ? (
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
                                            backgroundColor: project.type === 'sales' ? '#e0f2fe' :
                                                project.type === 'inspection' ? '#f3e8ff' :
                                                    project.type === 'maintenance' ? '#ffedd5' : '#fef9c3',
                                            color: project.type === 'sales' ? '#0369a1' :
                                                project.type === 'inspection' ? '#7e22ce' :
                                                    project.type === 'maintenance' ? '#c2410c' : '#854d0e',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {project.type === 'sales' ? '販売' :
                                                project.type === 'inspection' ? '点検' :
                                                    project.type === 'maintenance' ? '整備' : '修理'}
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
                                    <td className={styles.issue}>{(project.notes || '').split('\n\n備考: ')[0]}</td>
                                    <td>
                                        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => window.open(`${API_BASE_URL}/projects/${project.id}/pdf/invoice`, '_blank')}
                                                title="請求書PDF"
                                                style={{ color: '#2563eb', fontWeight: 'bold', border: '1px solid #bfdbfe', background: '#eff6ff', fontSize: '0.8rem', padding: '0.2rem 0.5rem', height: 'auto' }}
                                            >
                                                <FileText size={14} style={{ marginRight: '4px' }} /> 請求書
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => window.open(`${API_BASE_URL}/projects/${project.id}/pdf/delivery`, '_blank')}
                                                title="納品書PDF"
                                                style={{ color: '#059669', fontWeight: 'bold', border: '1px solid #a7f3d0', background: '#f0fdf4', fontSize: '0.8rem', padding: '0.2rem 0.5rem', height: 'auto' }}
                                            >
                                                <FileText size={14} style={{ marginRight: '4px' }} /> 納品書
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={(e) => handleDeleteProject(project.id, e)} title="削除" style={{ color: '#ef4444' }}>
                                                <Trash2 size={16} />
                                            </Button>
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
                    <div className={styles.modal} style={{ maxWidth: '1400px', width: '95%', position: 'relative' }}>
                        {isFormLoading && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 10, borderRadius: '8px'
                            }}>
                                <span style={{ fontWeight: 'bold' }}>データを準備中...</span>
                            </div>
                        )}
                        <div className={styles.modalHeader} style={{
                            backgroundColor: (formType === 'sales' ? '#e0f2fe' :
                                formType === 'inspection' ? '#f3e8ff' :
                                    formType === 'maintenance' ? '#ffedd5' : '#fef9c3'),
                            color: (formType === 'sales' ? '#0369a1' :
                                formType === 'inspection' ? '#7e22ce' :
                                    formType === 'maintenance' ? '#c2410c' : '#854d0e')
                        }}>
                            <h2>
                                {selectedProjectId ? '案件詳細・編集' : (formType === 'sales' ? '新規販売登録' : '新規修理受付')}
                            </h2>
                            <button className={styles.closeButton} onClick={() => setIsFormOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Summary Header */}
                            <div className={styles.summaryHeader}>
                                <div className={styles.formGrid}>
                                    {/* Linked Type Selector */}
                                    <div className="mb-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">案件タイプ</label>
                                        <select
                                            value={formType}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            onChange={(e) => setFormType(e.target.value as any)}
                                            className="border rounded-md p-2 text-sm form-select"
                                            style={{
                                                width: '160px',
                                                backgroundColor: (formType === 'sales' ? '#e0f2fe' :
                                                    formType === 'inspection' ? '#f3e8ff' :
                                                        formType === 'maintenance' ? '#ffedd5' : '#fef9c3'),
                                                color: (formType === 'sales' ? '#0369a1' :
                                                    formType === 'inspection' ? '#7e22ce' :
                                                        formType === 'maintenance' ? '#c2410c' : '#854d0e'),
                                                borderColor: (formType === 'sales' ? '#bae6fd' :
                                                    formType === 'inspection' ? '#e9d5ff' :
                                                        formType === 'maintenance' ? '#fed7aa' : '#fde047'),
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="repair" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>修理案件</option>
                                            <option value="inspection" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}>点検案件</option>
                                            <option value="maintenance" style={{ backgroundColor: '#ffedd5', color: '#c2410c' }}>整備案件</option>
                                            <option value="sales" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>販売案件</option>
                                        </select>
                                    </div>

                                    <div className="mb-2" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                                            <select
                                                name="status"
                                                value={formState.status}
                                                onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value as RepairStatus }))}
                                                className="border rounded-md p-2 text-sm font-bold"
                                                style={{
                                                    width: '160px',
                                                    backgroundColor: getStatusStyle(formState.status).bg,
                                                    color: getStatusStyle(formState.status).color,
                                                    borderColor: '#d1d5db'
                                                }}
                                            >
                                                <option value="received" style={{ backgroundColor: '#e2e8f0', color: '#1e293b' }}>仮登録</option>
                                                <option value="in_progress" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>作業中</option>
                                                <option value="completed" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>完了</option>
                                            </select>
                                        </div>
                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
                                            <div>
                                                <Input
                                                    type="date"
                                                    label="受付日"
                                                    name="orderDate"
                                                    value={formState.orderDate}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    type="date"
                                                    label="完了日"
                                                    name="completionDate"
                                                    value={formState.completionDate}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

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
                                                                    serialNumber: machine.serialNumber,
                                                                    hourMeter: machine.hourMeter || ''
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '150px' }}>
                                                    <Input
                                                        label="アワーメーター"
                                                        name="hourMeter"
                                                        value={formState.hourMeter}
                                                        onChange={handleInputChange}
                                                        placeholder="1234.5"
                                                    />
                                                </div>
                                                <span style={{ paddingTop: '1.5rem', fontWeight: 500, color: '#4b5563' }}>hr</span>
                                            </div>
                                        </>
                                    )}

                                </div>
                                <div className={styles.summaryStats}>
                                    <div style={{ textAlign: 'right', fontSize: '1.05rem', color: '#64748b' }}>
                                        <div>自社工賃: {totals.categoryTotals.labor.sales.toLocaleString()}</div>
                                        <div>自社出張費: {totals.categoryTotals.travel.sales.toLocaleString()}</div>
                                        <div>部品・商品: {totals.categoryTotals.part.sales.toLocaleString()}</div>
                                        <div>外注費: {totals.categoryTotals.outsourcing.sales.toLocaleString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontWeight: 'bold', marginLeft: 'auto' }}>
                                        <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>原価計: {totals.totalCost.toLocaleString()}円</div>
                                        <div style={{ fontSize: '2rem', color: '#0f172a', lineHeight: '1.2' }}>請求計: {totals.totalSales.toLocaleString()}円</div>
                                        <div style={{ fontSize: '1.2rem', color: '#10b981', marginTop: '0.5rem' }}>粗利額: {totals.grossProfit.toLocaleString()}円</div>
                                        <div style={{ fontSize: '1.1rem' }}>粗利率: {Math.round(totals.profitRate)}%</div>
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
                                </div>

                                {photos.length === 0 && pendingPhotos.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', border: '2px dashed #e2e8f0', borderRadius: '0.5rem' }}>
                                        登録された写真はありません
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                                        {/* Existing Server Photos */}
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

                                        {/* Pending Local Photos */}
                                        {pendingPhotos.map((file, index) => (
                                            <div key={`pending-${index}`} style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', border: '2px dashed #3b82f6', aspectRatio: '4/3' }}>
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt="pending"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                                                />
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                                    <span style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>未保存</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPendingPhotos(prev => prev.filter((_, i) => i !== index));
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
                                {formType !== 'sales' && renderDetailTable('自社工賃', 'labor', false)}
                                {formType !== 'sales' && renderDetailTable('自社出張費', 'travel', false)}
                                {renderDetailTable('部品・商品', 'part', true)}
                                {renderDetailTable('外注費', 'outsourcing', true)}
                                {renderDetailTable('その他', 'other', false)}
                            </div>

                            <div className={styles.formActions}>
                                {selectedProjectId && (
                                    <Button type="button" variant="ghost" onClick={() => handleDeleteProject(selectedProjectId)} style={{ color: '#ef4444', marginRight: 'auto' }}>
                                        <Trash2 size={16} style={{ marginRight: '4px' }} /> 削除
                                    </Button>
                                )}
                                <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>キャンセル</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? '保存中...' : (selectedProjectId ? '更新する' : '保存する')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }
            {/* Delete Confirmation Modal */}
            {
                deleteConfirmation.isOpen && (
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
                )
            }
        </div >
    );
};

export default Repairs;
