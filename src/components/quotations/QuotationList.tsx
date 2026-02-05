import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import axios from 'axios';
import { Edit2, FileText, CheckCircle, Trash2, Plus, Copy } from 'lucide-react';

import { API_BASE_URL } from '../../config';

// Interfaces (Should be shared types)
interface Quotation {
    id: number;
    quotationNumber: string;
    issueDate: string;
    totalAmount: number;
    status: string;
    notes?: string;
    createdAt: string;
}

interface QuotationListProps {
    projectId: number;
    onEdit: (quotationId: number | null) => void; // null for new
    onApply: (quotationId: number) => void;
}

const QuotationList: React.FC<QuotationListProps> = ({ projectId, onEdit, onApply }) => {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuotations();
    }, [projectId]);

    const fetchQuotations = async () => {
        try {
            const res = await axios.get<Quotation[]>(`${API_BASE_URL}/projects/${projectId}/quotations`);
            if (Array.isArray(res.data)) {
                setQuotations(res.data);
            } else {
                console.error('API response is not an array:', res.data);
                setQuotations([]);
            }
        } catch (err) {
            console.error(err);
            setQuotations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        // Create a new draft immediately? Or open empty form?
        // Let's create new draft then open form
        if (!confirm('新しい見積を作成しますか？')) return;
        try {
            const url = `${API_BASE_URL}/projects/${projectId}/quotations`;
            // alert(`Debug: Asking URL: ${url}`); // Temporary Debug
            const res = await axios.post(url, { cloneFromProject: false });
            onEdit(res.data.id);
            fetchQuotations();
        } catch (err: any) {
            console.error(err);
            let errMsg = '作成に失敗しました';
            if (err.response) {
                errMsg += ` (Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)})`;
            } else if (err.request) {
                errMsg += ` (Network Error - No Response: ${err.message})`;
            } else {
                errMsg += ` (Error: ${err.message})`;
            }
            alert(errMsg + `\nTrying to access: ${API_BASE_URL}/projects/${projectId}/quotations`);
        }
    };

    const handleClone = async () => {
        if (!confirm('現在の案件詳細をコピーして見積を作成しますか？')) return;
        try {
            const res = await axios.post(`${API_BASE_URL}/projects/${projectId}/quotations`, { cloneFromProject: true });
            onEdit(res.data.id);
            fetchQuotations();
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.details || err.response?.data?.error || '作成に失敗しました';
            alert(`作成に失敗しました: ${message}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('この見積を削除してもよろしいですか？')) return;
        try {
            await axios.delete(`${API_BASE_URL}/quotations/${id}`);
            fetchQuotations();
        } catch (err) {
            console.error(err);
            alert('削除に失敗しました');
        }
    };

    const handleApply = async (id: number) => {
        if (!confirm('この見積内容を案件詳細（実績）に反映しますか？\n現在の案件詳細はすべて上書きされます。')) return;
        onApply(id);
    };

    const handlePdf = (id: number) => {
        window.open(`${API_BASE_URL}/projects/${projectId}/pdf/quotation?quotationId=${id}`, '_blank');
        // Note: Need to update backend PDF route to accept quotationId
    };

    if (loading) return <div>読み込み中...</div>;

    return (
        <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                    onClick={handleCreate}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Plus size={16} />
                    新規作成
                </button>
                <button
                    onClick={handleClone}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Copy size={16} />
                    現在の内容から作成
                </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>見積番号</th>
                        <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>発行日</th>
                        <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb', textAlign: 'right' }}>金額(税抜)</th>
                        <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>ステータス</th>
                        <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {quotations.map(q => (
                        <tr key={q.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '0.75rem' }}>{q.quotationNumber}</td>
                            <td style={{ padding: '0.75rem' }}>{format(new Date(q.issueDate), 'yyyy/MM/dd', { locale: ja })}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>¥{Number(q.totalAmount).toLocaleString()}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '999px',
                                    fontSize: '0.875rem',
                                    backgroundColor: q.status === 'approved' ? '#dcfce7' : '#f3f4f6',
                                    color: q.status === 'approved' ? '#166534' : '#374151'
                                }}>
                                    {{
                                        draft: '下書き',
                                        sent: '送付済',
                                        approved: '受注',
                                        rejected: '失注'
                                    }[q.status] || q.status}
                                </span>
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                    <button onClick={() => onEdit(q.id)} title="編集" style={{ padding: '0.25rem', cursor: 'pointer', border: 'none', background: 'transparent' }}>
                                        <Edit2 size={18} color="#4b5563" />
                                    </button>
                                    <button onClick={() => handlePdf(q.id)} title="PDF" style={{ padding: '0.25rem', cursor: 'pointer', border: 'none', background: 'transparent' }}>
                                        <FileText size={18} color="#4b5563" />
                                    </button>
                                    <button onClick={() => handleApply(q.id)} title="反映" style={{ padding: '0.25rem', cursor: 'pointer', border: 'none', background: 'transparent' }}>
                                        <CheckCircle size={18} color="#dc2626" />
                                    </button>
                                    <button onClick={() => handleDelete(q.id)} title="削除" style={{ padding: '0.25rem', cursor: 'pointer', border: 'none', background: 'transparent' }}>
                                        <Trash2 size={18} color="#9ca3af" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {quotations.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                見積履歴はありません
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default QuotationList;
