import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { X, Printer } from 'lucide-react';
import type { CustomerMachine, Customer } from '../../types/customer';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

interface MachinePrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilteredMachines: CustomerMachine[];
    allMachines: CustomerMachine[];
    onPrintExecute: (machinesToPrint: CustomerMachine[], printTitle: string) => void;
}

const MachinePrintModal: React.FC<MachinePrintModalProps> = ({ 
    isOpen, 
    onClose, 
    currentFilteredMachines,
    allMachines,
    onPrintExecute 
}) => {
    const [printRange, setPrintRange] = useState<'current' | 'all' | 'customer' | 'alert'>('current');
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
    const [sortOption, setSortOption] = useState<'customer' | 'model' | 'inspection'>('customer');
    const [customers, setCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        if (isOpen) {
            axios.get<Customer[]>(`${API_BASE_URL}/customers`).then(res => {
                setCustomers(res.data);
            }).catch(err => console.error(err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePrintClick = () => {
        let targets = [...allMachines];
        let title = '機材台帳';

        // Apply Range Filter
        if (printRange === 'current') {
            targets = [...currentFilteredMachines];
            title = '機材台帳 (検索結果)';
        } else if (printRange === 'alert') {
            const now = new Date();
            const oneMonthLater = new Date();
            oneMonthLater.setMonth(now.getMonth() + 1);
            
            targets = targets.filter(m => {
                if (!m.nextInspectionDate || m.enableInspectionAlert === false) return false;
                const nextDate = new Date(m.nextInspectionDate);
                return nextDate <= oneMonthLater;
            });
            title = '機材台帳 (点検時期接近)';
        } else if (printRange === 'customer') {
            if (selectedCustomerId === '') {
                alert('顧客を選択してください');
                return;
            }
            targets = targets.filter(m => m.customerId === selectedCustomerId);
            const customerName = customers.find(c => c.id === selectedCustomerId)?.name || '';
            title = `機材台帳 (${customerName})`;
        } else {
            title = '機材台帳 (全件)';
        }

        // Apply Sort
        targets.sort((a, b) => {
            if (sortOption === 'customer') {
                const nameA = a.customer?.name || '';
                const nameB = b.customer?.name || '';
                return nameA.localeCompare(nameB);
            } else if (sortOption === 'model') {
                const modelA = a.machineModel || '';
                const modelB = b.machineModel || '';
                return modelA.localeCompare(modelB);
            } else if (sortOption === 'inspection') {
                const dateA = a.nextInspectionDate ? new Date(a.nextInspectionDate).getTime() : 0;
                const dateB = b.nextInspectionDate ? new Date(b.nextInspectionDate).getTime() : 0;
                return dateA - dateB;
            }
            return 0;
        });

        onPrintExecute(targets, title);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{
                background: 'white', borderRadius: '8px', width: '90%', maxWidth: '500px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>機材台帳 印刷設定</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>印刷範囲</label>
                        <select 
                            value={printRange} 
                            onChange={(e) => setPrintRange(e.target.value as any)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="current">画面に表示中のリストのみ ({currentFilteredMachines.length}件)</option>
                            <option value="all">すべての登録済み機材 ({allMachines.length}件)</option>
                            <option value="alert">点検時期が近い機材のみ</option>
                            <option value="customer">特定の顧客を指定する</option>
                        </select>
                    </div>

                    {printRange === 'customer' && (
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>顧客を選択</label>
                            <select 
                                value={selectedCustomerId}
                                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            >
                                <option value="" disabled>選択してください</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>並び順</label>
                        <select 
                            value={sortOption} 
                            onChange={(e) => setSortOption(e.target.value as any)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="customer">顧客名順 (あいうえお順)</option>
                            <option value="model">機種名順</option>
                            <option value="inspection">点検時期が近い順</option>
                        </select>
                    </div>
                </div>

                <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', backgroundColor: '#f8fafc', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                    <Button variant="outline" onClick={onClose} type="button">キャンセル</Button>
                    <Button onClick={handlePrintClick} type="button" icon={<Printer size={18} />}>
                        印刷プレビューを開く
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MachinePrintModal;
