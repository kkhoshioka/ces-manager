import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface SupplierCost {
    name: string;
    totalCost: number;
    count: number;
}

const SupplierMonthlyReport = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [data, setData] = useState<SupplierCost[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/supplier-costs?year=${year}&month=${month}`);
            if (!response.ok) throw new Error('Failed to fetch data');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [year, month]);

    const handlePrevMonth = () => {
        if (month === 1) {
            setYear(y => y - 1);
            setMonth(12);
        } else {
            setMonth(m => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setYear(y => y + 1);
            setMonth(1);
        } else {
            setMonth(m => m + 1);
        }
    };

    const totalPeriodCost = data.reduce((sum, item) => sum + item.totalCost, 0);

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">仕入先別コスト集計</h1>
                    <p className="text-gray-500 text-sm mt-1">仕入先ごとの原価発生状況を月次で確認できます</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                    <Button variant="ghost" icon={<ChevronLeft size={16} />} onClick={handlePrevMonth} />
                    <span className="text-lg font-bold min-w-[120px] text-center text-slate-700">
                        {year}年 {month}月
                    </span>
                    <Button variant="ghost" icon={<ChevronRight size={16} />} onClick={handleNextMonth} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 mb-2">当月仕入総額</h3>
                    <div className="text-3xl font-bold text-slate-900">
                        ¥{totalPeriodCost.toLocaleString()}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 mb-2">取引先数</h3>
                    <div className="text-3xl font-bold text-slate-900">
                        {data.length} <span className="text-lg font-normal text-slate-500">社</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">仕入先別内訳</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">仕入先名</th>
                                <th className="px-6 py-4 text-right">取引回数</th>
                                <th className="px-6 py-4 text-right">仕入金額 (原価)</th>
                                <th className="px-6 py-4 text-right">構成比</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                            読み込み中...
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        データがありません
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                        <td className="px-6 py-4 text-right">{item.count} 回</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-700">
                                            ¥{item.totalCost.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500">
                                            {totalPeriodCost > 0
                                                ? `${((item.totalCost / totalPeriodCost) * 100).toFixed(1)}%`
                                                : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SupplierMonthlyReport;
