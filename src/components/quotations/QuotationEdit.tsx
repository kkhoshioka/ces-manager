import React, { useState, useEffect } from 'react';
import axios from 'axios';

const generateTempId = () => Math.random().toString(36).substr(2, 9);

// Interfaces
interface QuotationDetail {
    id?: number;
    tempId?: string; // For frontend tracking
    lineType: string;
    description: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    date?: string;
    travelType?: string;
    outsourcingDetailType?: string;
    remarks?: string;
}

interface Quotation {
    id: number;
    quotationNumber: string;
    issueDate: string;
    expirationDate?: string;
    status: string;
    notes?: string;
    details: QuotationDetail[];
}

interface QuotationEditProps {
    quotationId: number;
    onClose: () => void;
    onSaveSuccess: () => void;
}

const QuotationEdit: React.FC<QuotationEditProps> = ({ quotationId, onClose, onSaveSuccess }) => {
    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load data
    useEffect(() => {
        if (!quotationId) return;
        setLoading(true);
        axios.get(`/api/quotations/${quotationId}`) // We need a direct GET api/quotations/:id route? 
            // Logic check: Implementation plan says GET /api/projects/:id/quotations for list.
            // It didn't explicitly specify GET /api/quotations/:id details, but PUT is there.
            // Wait, I implemented `PUT /api/quotations/:id`. Initial GET is usually needed.
            // I might have missed implementing `GET /api/quotations/:id` in backend?
            // Let's check `quotations.ts`.
            // I implemented: GET project-list, POST, PUT, DELETE, POST apply.
            // I MISSED GET SINGLE QUOTATION!!
            // I need to add that to backend first or use fitler from list (not efficient for details).
            // I'll add GET /api/quotations/:id to backend.
            // For now, I'll write the frontend assuming it exists.
            .then(res => {
                const data = res.data;
                // Add tempIds
                data.details = data.details.map((d: any) => ({ ...d, tempId: uuidv4() }));
                setQuotation(data);
            })
            .catch(err => {
                console.error(err);
                alert('読み込みに失敗しました');
            })
            .finally(() => setLoading(false));
    }, [quotationId]);

    const handleDetailChange = (index: number, field: keyof QuotationDetail, value: any) => {
        if (!quotation) return;
        const newDetails = [...quotation.details];
        newDetails[index] = { ...newDetails[index], [field]: value };
        setQuotation({ ...quotation, details: newDetails });
    };

    const handleAddRow = () => {
        if (!quotation) return;
        setQuotation({
            ...quotation,
            details: [
                ...quotation.details,
                { tempId: generateTempId(), lineType: 'part', description: '', quantity: 1, unitPrice: 0, unitCost: 0 }
            ]
        });
    };

    const handleDeleteRow = (index: number) => {
        if (!quotation) return;
        const newDetails = [...quotation.details];
        newDetails.splice(index, 1);
        setQuotation({ ...quotation, details: newDetails });
    };

    const handleSave = async () => {
        if (!quotation) return;
        setSaving(true);
        try {
            await axios.put(`/api/quotations/${quotation.id}`, quotation);
            onSaveSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>読み込み中...</div>;
    if (!quotation) return <div style={{ padding: '2rem' }}>データが見つかりません</div>;

    const totalAmount = quotation.details.reduce((sum, d) => sum + (Number(d.quantity) * Number(d.unitPrice)), 0);
    const tax = Math.floor(totalAmount * 0.1);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50
        }}>
            <div style={{
                backgroundColor: 'white', width: '90%', height: '90%', borderRadius: '0.5rem',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>見積編集: {quotation.quotationNumber}</h2>
                    <button onClick={onClose} style={{ fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                    {/* Quotation Header Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>見積番号</label>
                            <input
                                type="text"
                                value={quotation.quotationNumber || ''}
                                onChange={e => setQuotation({ ...quotation, quotationNumber: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>発行日</label>
                            <input
                                type="date"
                                value={quotation.issueDate ? quotation.issueDate.split('T')[0] : ''}
                                onChange={e => setQuotation({ ...quotation, issueDate: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>有効期限</label>
                            <input
                                type="date"
                                value={quotation.expirationDate ? quotation.expirationDate.split('T')[0] : ''}
                                onChange={e => setQuotation({ ...quotation, expirationDate: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>ステータス</label>
                            <select
                                value={quotation.status}
                                onChange={e => setQuotation({ ...quotation, status: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                            >
                                <option value="draft">下書き</option>
                                <option value="sent">送付済</option>
                                <option value="approved">承認済</option>
                                <option value="rejected">却下</option>
                            </select>
                        </div>
                    </div>

                    {/* Details Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                                <th style={{ padding: '0.5rem', border: '1px solid #e5e7eb', width: '100px' }}>種類</th>
                                <th style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>内容</th>
                                <th style={{ padding: '0.5rem', border: '1px solid #e5e7eb', width: '80px' }}>数量</th>
                                <th style={{ padding: '0.5rem', border: '1px solid #e5e7eb', width: '100px' }}>単価</th>
                                <th style={{ padding: '0.5rem', border: '1px solid #e5e7eb', width: '100px' }}>金額</th>
                                <th style={{ padding: '0.5rem', border: '1px solid #e5e7eb', width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotation.details.map((detail, index) => (
                                <tr key={detail.tempId || detail.id}>
                                    <td style={{ padding: '0.25rem', border: '1px solid #e5e7eb' }}>
                                        <select
                                            value={detail.lineType}
                                            onChange={e => handleDetailChange(index, 'lineType', e.target.value)}
                                            style={{ width: '100%', padding: '0.25rem' }}
                                        >
                                            <option value="part">部品</option>
                                            <option value="labor">工賃</option>
                                            <option value="travel">出張費</option>
                                            <option value="outsourcing">外注</option>
                                            <option value="other">その他</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '0.25rem', border: '1px solid #e5e7eb' }}>
                                        <input
                                            type="text"
                                            value={detail.description}
                                            onChange={e => handleDetailChange(index, 'description', e.target.value)}
                                            style={{ width: '100%', padding: '0.25rem' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.25rem', border: '1px solid #e5e7eb' }}>
                                        <input
                                            type="number"
                                            value={detail.quantity}
                                            onChange={e => handleDetailChange(index, 'quantity', e.target.value)}
                                            style={{ width: '100%', padding: '0.25rem', textAlign: 'right' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.25rem', border: '1px solid #e5e7eb' }}>
                                        <input
                                            type="number"
                                            value={detail.unitPrice}
                                            onChange={e => handleDetailChange(index, 'unitPrice', e.target.value)}
                                            style={{ width: '100%', padding: '0.25rem', textAlign: 'right' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.25rem', border: '1px solid #e5e7eb', textAlign: 'right' }}>
                                        {Math.floor(Number(detail.quantity) * Number(detail.unitPrice)).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '0.25rem', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                                        <button onClick={() => handleDeleteRow(index)} style={{ color: 'red', cursor: 'pointer' }}>×</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={handleAddRow} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', cursor: 'pointer' }}>+ 行を追加</button>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '2rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                        <div>小計: ¥{totalAmount.toLocaleString()}</div>
                        <div>消費税: ¥{tax.toLocaleString()}</div>
                        <div>合計: ¥{(totalAmount + tax).toLocaleString()}</div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>備考</label>
                        <textarea
                            value={quotation.notes || ''}
                            onChange={e => setQuotation({ ...quotation, notes: e.target.value })}
                            style={{ width: '100%', height: '100px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                        />
                    </div>

                </div>

                {/* Footer */}
                <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '1rem', backgroundColor: '#f9fafb' }}>
                    <button onClick={onClose} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', backgroundColor: 'white', cursor: 'pointer' }}>キャンセル</button>
                    <button onClick={handleSave} disabled={saving} style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuotationEdit;
