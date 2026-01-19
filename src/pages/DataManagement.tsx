
import React, { useState } from 'react';
import { Download, Upload, Server, Database, Save, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

interface DataModel {
    id: string;
    label: string;
    description: string;
    category: 'Master' | 'Transaction' | 'System';
}

const MODELS: DataModel[] = [
    // Masters
    { id: 'customers', label: '顧客マスター', description: '顧客情報一覧', category: 'Master' },
    { id: 'suppliers', label: '仕入先マスター', description: '仕入先・外注先情報', category: 'Master' },
    { id: 'products', label: '商品・部品マスター', description: '商品および部品カタログ', category: 'Master' },
    { id: 'categories', label: '商品カテゴリー', description: '商品の分類', category: 'Master' },
    { id: 'machines', label: '機器マスター', description: '顧客所有の機器情報', category: 'Master' },
    { id: 'expenses', label: '経費科目マスター', description: '経費の勘定科目', category: 'Master' },

    // Transactions
    { id: 'projects', label: '案件（ヘッダー）', description: '修理・販売プロジェクトの基本情報', category: 'Transaction' },
    { id: 'project-details', label: '案件（明細）', description: 'プロジェクトの明細行', category: 'Transaction' },
    { id: 'project-photos', label: '案件（写真）', description: 'プロジェクトに関連付けられた写真メタデータ', category: 'Transaction' },
    { id: 'monthly-bill-status', label: '月次請求ステータス', description: '月ごとの請求書発行状況', category: 'Transaction' },
    { id: 'monthly-expenses', label: '月次経費', description: '月ごとの経費入力データ', category: 'Transaction' },

    // System
    { id: 'system-settings', label: 'システム設定', description: '消費税率やデフォルト設定', category: 'System' },
    // { id: 'profiles', label: 'ユーザープロファイル', description: 'ログインユーザー情報', category: 'System' }, // Admin only usually
];

const DataManagement: React.FC = () => {
    const [loading, setLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleExport = async (modelId: string) => {
        try {
            setLoading(modelId);
            const response = await axios.get(`${API_BASE_URL}/data/${modelId}/export`, {
                responseType: 'blob',
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `${modelId}_backup_${dateStr}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setMessage({ text: `${modelId} のエクスポートが完了しました`, type: 'success' });
        } catch (error) {
            console.error('Export failed', error);
            setMessage({ text: 'エクスポートに失敗しました', type: 'error' });
        } finally {
            setLoading(null);
        }
    };

    const handleImport = async (modelId: string, file: File) => {
        if (!window.confirm(`【警告】\n${modelId} のデータをインポートします。\n既存のデータIDが重複する場合、上書きされます。\nよろしいですか？`)) {
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(modelId);
            const response = await axios.post(`${API_BASE_URL}/data/${modelId}/import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage({ text: `インポート成功: ${response.data.count} 件のデータを処理しました`, type: 'success' });
        } catch (error) {
            console.error('Import failed', error);
            setMessage({ text: 'インポートに失敗しました。CSVの形式を確認してください。', type: 'error' });
        } finally {
            setLoading(null);
        }
    };

    const categories = ['Master', 'Transaction', 'System'];

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Database className="w-8 h-8 text-blue-600" />
                    データ管理・バックアップ
                </h1>
                <p className="text-gray-600 mt-2">
                    システムデータのバックアップ（CSVエクスポート）と復元（インポート）を行います。
                </p>

                {message && (
                    <div className={`mt-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}
            </header>

            <div className="space-y-8">
                {categories.map(category => (
                    <section key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                                {category === 'Master' && <Server className="w-5 h-5" />}
                                {category === 'Transaction' && <Save className="w-5 h-5" />}
                                {category === 'System' && <Database className="w-5 h-5" />}
                                {category === 'Master' ? 'マスターデータ' : category === 'Transaction' ? '取引データ' : 'システム設定'}
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {MODELS.filter(m => m.category === category).map(model => (
                                <div key={model.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{model.label}</h3>
                                        <p className="text-sm text-gray-500">{model.description}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleExport(model.id)}
                                            disabled={loading === model.id}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                                        >
                                            <Download className="w-4 h-4" />
                                            {loading === model.id ? '処理中...' : 'エクスポート'}
                                        </button>

                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".csv"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        handleImport(model.id, file);
                                                        e.target.value = ''; // Reset
                                                    }
                                                }}
                                                disabled={loading === model.id}
                                            />
                                            <button
                                                disabled={loading === model.id}
                                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                                            >
                                                <Upload className="w-4 h-4" />
                                                インポート
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                    <p className="font-bold mb-1">データの復元に関する注意</p>
                    <p>データをインポートする際は、以下の点にご注意ください：</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>同じIDを持つデータは上書きされます。</li>
                        <li>「案件（明細）」などのデータは、「案件（ヘッダー）」や「商品マスター」などの親データが存在しない場合、インポートに失敗することがあります。</li>
                        <li>データの不整合を防ぐため、マスターデータ → 取引データ の順で復元することを強く推奨します。</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DataManagement;
