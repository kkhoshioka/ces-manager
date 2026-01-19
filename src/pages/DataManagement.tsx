
import React, { useState } from 'react';
import { Download, Server, Database, Settings, Truck, Users, Package, Tags, FileSpreadsheet, RotateCcw, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

type Category = 'Master' | 'Transaction' | 'System';

interface DataModel {
    id: string;
    label: string;
    description: string;
    category: Category;
    icon: React.ElementType;
    color: string; // Tailwind color class prefix (e.g., 'blue', 'green')
}

const MODELS: DataModel[] = [
    // Masters
    { id: 'customers', label: '顧客マスター', description: '顧客台帳、連絡先情報、取引履歴を管理します。', category: 'Master', icon: Users, color: 'blue' },
    { id: 'suppliers', label: '仕入先マスター', description: '仕入先情報、発注履歴、契約内容を管理します。', category: 'Master', icon: Truck, color: 'orange' },
    { id: 'products', label: '商品・部品マスター', description: '商品カタログ、価格設定、在庫情報を管理します。', category: 'Master', icon: Package, color: 'emerald' },
    { id: 'categories', label: '商品カテゴリー', description: '商品の分類区分、カテゴリー構成を管理します。', category: 'Master', icon: Tags, color: 'teal' },
    { id: 'machines', label: '機器マスター', description: '顧客所有機器の台帳、スペック情報を管理します。', category: 'Master', icon: Server, color: 'cyan' },
    { id: 'expenses', label: '経費科目マスター', description: '勘定科目マスター、取引履歴を管理します。', category: 'Master', icon: FileSpreadsheet, color: 'indigo' },

    // Transactions
    { id: 'projects', label: '案件（ヘッダー）', description: '修理・販売プロジェクトの基本情報を管理します。', category: 'Transaction', icon: FileSpreadsheet, color: 'violet' },
    { id: 'project-details', label: '案件（明細）', description: '各案件の売上・原価データの明細を管理します。', category: 'Transaction', icon: FileSpreadsheet, color: 'purple' },
    { id: 'project-photos', label: '案件（写真）', description: '案件に紐付く写真メタデータを管理します。', category: 'Transaction', icon: FileSpreadsheet, color: 'fuchsia' },
    { id: 'monthly-bill-status', label: '月次請求ステータス', description: '請求書の発行状況・履歴を管理します。', category: 'Transaction', icon: FileSpreadsheet, color: 'pink' },
    { id: 'monthly-expenses', label: '月次経費', description: '月次で入力された経費実績データを管理します。', category: 'Transaction', icon: FileSpreadsheet, color: 'rose' },

    // System
    { id: 'system-settings', label: 'システム設定', description: '消費税率、アプリ全体の基本設定を管理します。', category: 'System', icon: Settings, color: 'gray' },
];

const getColorClasses = (color: string) => {
    const map: Record<string, string> = {
        blue: 'from-blue-400 to-blue-600',
        orange: 'from-orange-400 to-orange-600',
        emerald: 'from-emerald-400 to-emerald-600',
        teal: 'from-teal-400 to-teal-600',
        cyan: 'from-cyan-400 to-cyan-600',
        indigo: 'from-indigo-400 to-indigo-600',
        violet: 'from-violet-400 to-violet-600',
        purple: 'from-purple-400 to-purple-600',
        fuchsia: 'from-fuchsia-400 to-fuchsia-600',
        pink: 'from-pink-400 to-pink-600',
        rose: 'from-rose-400 to-rose-600',
        gray: 'from-gray-400 to-gray-600',
    };
    return map[color] || 'from-blue-400 to-blue-600';
};

const DataManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Category>('Master');
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
            setTimeout(() => setMessage(null), 3000);
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
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Import failed', error);
            setMessage({ text: 'インポートに失敗しました。CSVの形式を確認してください。', type: 'error' });
        } finally {
            setLoading(null);
        }
    };

    const TabButton = ({ category, label }: { category: Category; label: string }) => (
        <button
            onClick={() => setActiveTab(category)}
            className={`
                px-6 py-3 rounded-full text-sm font-bold transition-all duration-200
                ${activeTab === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                }
            `}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-8 md:p-12">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Database className="w-7 h-7 text-blue-600" />
                            データバックアップ & 復元
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            システムデータの保護、エクスポート、および復元ポイントの管理をここで行います。
                        </p>
                    </div>
                    {message && (
                        <div className={`px-4 py-3 rounded-lg shadow-sm border text-sm font-medium animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {message.text}
                        </div>
                    )}
                </header>

                <div className="h-16"></div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2">
                    <TabButton category="Master" label="【マスターデータ】" />
                    <TabButton category="Transaction" label="【トランザクションデータ】" />
                    <TabButton category="System" label="【システム設定】" />
                </div>

                <div className="h-32"></div>

                {/* Main Grid Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
                    {MODELS.filter(m => m.category === activeTab).map((model) => (
                        <div
                            key={model.id}
                            className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 group flex items-start gap-6 relative overflow-hidden"
                        >
                            {/* Icon Square */}
                            <div className={`
                                w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
                                bg-gradient-to-br ${getColorClasses(model.color)} text-white
                            `}>
                                <model.icon className="w-10 h-10" />
                            </div>

                            {/* Info Area */}
                            <div className="flex-1 min-w-0 py-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                    {model.label}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed max-w-sm mb-6">
                                    {model.description}
                                </p>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3">
                                    {/* Export Button */}
                                    <button
                                        onClick={() => handleExport(model.id)}
                                        disabled={loading === model.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all disabled:opacity-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        CSV保存
                                    </button>

                                    {/* Import Button */}
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
                                            className="flex items-center gap-2 px-4 py-2 bg-transparent border border-transparent rounded-lg text-sm font-medium text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            復元
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Loading Overlay */}
                            {loading === model.id && (
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-blue-600 font-bold animate-fade-in">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                    <span className="text-sm">処理中...</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Info Footer */}
                <div className="mt-12 flex items-start gap-4 p-6 bg-yellow-50/50 border border-yellow-100 rounded-xl text-yellow-800/80 max-w-4xl mx-auto">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm leading-relaxed">
                        <strong className="block text-yellow-900 mb-1">データ復元時のご注意</strong>
                        CSVファイルのインポートを行うと、同じIDを持つ既存のデータは上書きされます。
                        また、データの整合性を保つため、「マスターデータ」を先に復元し、その後に「トランザクションデータ」を復元することを強く推奨します。
                        不明な点がある場合は、システム管理者にお問い合わせください。
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataManagement;
