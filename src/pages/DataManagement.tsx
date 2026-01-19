
import React, { useState } from 'react';
import { Download, Upload, Server, Database, Save, AlertTriangle, FileSpreadsheet, Settings, Truck, Users, Package, Tags } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

interface DataModel {
    id: string;
    label: string;
    description: string;
    category: 'Master' | 'Transaction' | 'System';
    icon: React.ElementType;
}

const MODELS: DataModel[] = [
    // Masters
    { id: 'customers', label: '顧客マスター', description: '顧客の基本情報および連絡先', category: 'Master', icon: Users },
    { id: 'suppliers', label: '仕入先マスター', description: '仕入先・外注先の登録情報', category: 'Master', icon: Truck },
    { id: 'products', label: '商品・部品マスター', description: '取り扱い商品と部品のカタログ', category: 'Master', icon: Package },
    { id: 'categories', label: '商品カテゴリー', description: '商品の分類区分マスター', category: 'Master', icon: Tags },
    { id: 'machines', label: '機器マスター', description: '顧客が所有する機器の台帳', category: 'Master', icon: Server },
    { id: 'expenses', label: '経費科目マスター', description: '経費計上用の勘定科目', category: 'Master', icon: FileSpreadsheet },

    // Transactions
    { id: 'projects', label: '案件（ヘッダー）', description: '修理・販売の基本契約情報', category: 'Transaction', icon: FileSpreadsheet },
    { id: 'project-details', label: '案件（明細）', description: '各案件の売上・原価明細データ', category: 'Transaction', icon: FileSpreadsheet },
    { id: 'project-photos', label: '案件（写真）', description: '案件に紐付く写真データ', category: 'Transaction', icon: FileSpreadsheet },
    { id: 'monthly-bill-status', label: '月次請求ステータス', description: '請求書の発行管理ステータス', category: 'Transaction', icon: FileSpreadsheet },
    { id: 'monthly-expenses', label: '月次経費', description: '月ごとに入力された経費実績', category: 'Transaction', icon: FileSpreadsheet },

    // System
    { id: 'system-settings', label: 'システム設定', description: '消費税率などのシステム全般設定', category: 'System', icon: Settings },
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

    // Helper for category styles
    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Master': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Transaction': return 'bg-green-50 text-green-700 border-green-100';
            case 'System': return 'bg-gray-50 text-gray-700 border-gray-200';
            default: return 'bg-gray-50';
        }
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Master': return <Database className="w-5 h-5" />;
            case 'Transaction': return <Save className="w-5 h-5" />;
            case 'System': return <Settings className="w-5 h-5" />;
            default: return <Database className="w-5 h-5" />;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
                    <Database className="w-10 h-10 text-blue-600" />
                    データ管理コンソール
                </h1>
                <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                    システムデータのバックアップ（エクスポート）と復元（インポート）を一元管理します。<br />
                    定期的なバックアップをお勧めします。
                </p>

                {message && (
                    <div className={`mt-6 p-4 rounded-lg shadow-sm inline-block min-w-[300px] ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}
            </header>

            <div className="space-y-12">
                {categories.map(category => (
                    <section key={category}>
                        <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-200">
                            <span className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                                {getCategoryIcon(category)}
                            </span>
                            <h2 className="text-xl font-bold text-gray-800">
                                {category === 'Master' ? 'マスターデータ (基本台帳)' : category === 'Transaction' ? '取引データ (案件・明細)' : 'システムデータ'}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {MODELS.filter(m => m.category === category).map(model => (
                                <div key={model.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group">
                                    <div className="p-5 flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`p-2 rounded-lg ${getCategoryColor(category)} bg-opacity-50`}>
                                                <model.icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                                {model.id}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                                            {model.label}
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            {model.description}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleExport(model.id)}
                                            disabled={loading === model.id}
                                            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            <Download className="w-4 h-4" />
                                            保存
                                        </button>

                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".csv"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
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
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 active:transform active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                                            >
                                                <Upload className="w-4 h-4" />
                                                復元
                                            </button>
                                        </div>
                                    </div>

                                    {loading === model.id && (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <div className="mt-16 bg-white border border-yellow-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-yellow-400"></div>
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">データの復元（インポート）に関する重要なお知らせ</h3>
                        <div className="text-sm text-gray-600 space-y-2">
                            <p>
                                データの復元はシステム全体に影響を与える強力な操作です。以下の点に十分ご注意ください。
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2 bg-yellow-50/50 p-4 rounded-lg">
                                <li><strong className="text-yellow-800">上書き注意:</strong> 同じIDを持つデータは、CSVの内容で完全に上書きされます。</li>
                                <li><strong>依存関係:</strong> 「案件データ」を復元する前に、必ず関連する「顧客マスター」や「商品マスター」が存在することを確認してください。順序が逆の場合、エラーが発生する可能性があります。</li>
                                <li><strong>バックアップ推奨:</strong> 大規模なインポートを行う前には、必ず現在のデータをエクスポートしてバックアップを保存してください。</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataManagement;
