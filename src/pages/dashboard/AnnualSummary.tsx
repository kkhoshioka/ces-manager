
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface AnnualData {
  month: number;
  year: number;
  sales: Record<string, number>;
  cost: Record<string, number>;
  sga: Record<string, number>;
  totalSales: number;
  totalCost: number;
  totalSga: number;
}

const AnnualSummary: React.FC = () => {
  const [year, setYear] = useState(() => {
    const now = new Date();
    // Fiscal year starts in July. 
    // If we are in Jan-Jun (0-5), the fiscal year started last calendar year.
    // If we are in Jul-Dec (6-11), the fiscal year started this calendar year.
    return now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();
  });
  const [data, setData] = useState<AnnualData[]>([]);
  const [loading, setLoading] = useState(false);

  // Month labels for display (Header)
  const months = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
  const displayMonths = months.map(m => `${m}月`);

  // Fixed categories
  const salesCategories = ["新車販売", "中古車販売", "アタッチメント販売", "レンタル", "修理", "部品・他", "美容品販売"];
  const costCategories = ["商品仕入", "レンタル仕入", "外注費", "材料費", "荷造運賃", "その他", "美容品仕入"];

  // More comprehensive SGA list based on seed
  const sgaBase = [
    "役員報酬", "給与", "社会保険料", "減価償却費", "消耗機器費", "地代家賃", "車両費", "リース料",
    "租税公課", "荷造運賃", "水道光熱費", "旅費交通費", "通信費", "広告宣伝費", "接待交際費",
    "販売促進費", "販売手数料", "損害保険料", "修繕費", "備品", "消耗品費", "事務用品費",
    "福利厚生費", "教育費", "雑費", "支払手数料",
    "雑収入", "未払費用", "設備費"
  ];

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/annual-summary?year=${year}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch annual summary', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return val === 0 ? '0' : Math.floor(val).toLocaleString();
  };

  const formatPercent = (val: number) => {
    if (!isFinite(val) || val === 0) return '0.0%';
    return (val * 100).toFixed(1) + '%';
  };

  // Calculations for Totals Column
  const calculateYearTotal = (category: string, type: 'sales' | 'cost' | 'sga') => {
    return data.reduce((sum, d) => sum + (d[type][category] || 0), 0);
  };

  const totalSalesSum = data.reduce((sum, d) => sum + d.totalSales, 0);
  const totalCostSum = data.reduce((sum, d) => sum + d.totalCost, 0);
  const totalSgaSum = data.reduce((sum, d) => sum + d.totalSga, 0);

  const grossProfitSum = totalSalesSum - totalCostSum;
  const operatingProfitSum = grossProfitSum - totalSgaSum;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">月次損益概況</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-lg shadow px-2 py-1">
            <button onClick={() => setYear(y => y - 1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="mx-4 font-bold text-lg">令和{year - 2018}年度 ({year}.7 - {year + 1}.6)</span>
            <button onClick={() => setYear(y => y + 1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
            <Download className="w-4 h-4" /> CSV出力
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
          <table className="w-full text-right text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border text-center w-40 sticky left-0 bg-gray-100 z-10">項目</th>
                {displayMonths.map((m, i) => (
                  <th key={i} className="p-2 border w-24">{m}</th>
                ))}
                <th className="p-2 border w-28 bg-gray-200">合計</th>
              </tr>
            </thead>
            <tbody>
              {/* Sales Section */}
              <tr className="bg-blue-50 font-bold">
                <td className="p-2 border text-left sticky left-0 bg-blue-50">売上高 合計</td>
                {data.map((d, i) => <td key={i} className="p-2 border">{formatCurrency(d.totalSales)}</td>)}
                <td className="p-2 border bg-blue-100">{formatCurrency(totalSalesSum)}</td>
              </tr>
              {salesCategories.map(cat => (
                <tr key={cat}>
                  <td className="p-1 pr-4 border text-left text-xs text-gray-600 sticky left-0 bg-white pl-4">{cat}</td>
                  {data.map((d, i) => <td key={i} className="p-1 border">{formatCurrency(d.sales[cat] || 0)}</td>)}
                  <td className="p-1 border bg-gray-50">{formatCurrency(calculateYearTotal(cat, 'sales'))}</td>
                </tr>
              ))}

              {/* Cost Section */}
              <tr className="bg-red-50 font-bold border-t-2 border-t-gray-400">
                <td className="p-2 border text-left sticky left-0 bg-red-50">売上原価 合計</td>
                {data.map((d, i) => <td key={i} className="p-2 border">{formatCurrency(d.totalCost)}</td>)}
                <td className="p-2 border bg-red-100">{formatCurrency(totalCostSum)}</td>
              </tr>
              {costCategories.map(cat => (
                <tr key={cat}>
                  <td className="p-1 pr-4 border text-left text-xs text-gray-600 sticky left-0 bg-white pl-4">{cat}</td>
                  {data.map((d, i) => <td key={i} className="p-1 border">{formatCurrency(d.cost[cat] || 0)}</td>)}
                  <td className="p-1 border bg-gray-50">{formatCurrency(calculateYearTotal(cat, 'cost'))}</td>
                </tr>
              ))}

              {/* Gross Profit */}
              <tr className="bg-yellow-50 font-bold border-t-2 border-t-black">
                <td className="p-2 border text-left sticky left-0 bg-yellow-50">粗利益 (売上総利益)</td>
                {data.map((d, i) => {
                  const gp = d.totalSales - d.totalCost;
                  return <td key={i} className={`p-2 border ${gp < 0 ? 'text-red-600' : ''}`}>{formatCurrency(gp)}</td>
                })}
                <td className="p-2 border bg-yellow-100">{formatCurrency(grossProfitSum)}</td>
              </tr>
              <tr className="bg-yellow-50/50 italic text-xs">
                <td className="p-1 border text-left sticky left-0 bg-yellow-50/50 pl-4">粗利率</td>
                {data.map((d, i) => {
                  const gp = d.totalSales - d.totalCost;
                  const rate = d.totalSales ? gp / d.totalSales : 0;
                  return <td key={i} className="p-1 border">{formatPercent(rate)}</td>
                })}
                <td className="p-1 border bg-yellow-100">{formatPercent(totalSalesSum ? grossProfitSum / totalSalesSum : 0)}</td>
              </tr>

              {/* SGA Expenses */}
              <tr className="bg-green-50 font-bold border-t-2 border-t-gray-400">
                <td className="p-2 border text-left sticky left-0 bg-green-50">販管費 合計</td>
                {data.map((d, i) => <td key={i} className="p-2 border">{formatCurrency(d.totalSga)}</td>)}
                <td className="p-2 border bg-green-100">{formatCurrency(totalSgaSum)}</td>
              </tr>
              {sgaBase.map(cat => {
                // Filter: Show row only if it has values anytime in the year? 
                // Or just show all to keep layout steady.
                // Let's show all for now.
                return (
                  <tr key={cat}>
                    <td className="p-1 pr-4 border text-left text-xs text-gray-600 sticky left-0 bg-white pl-4">{cat}</td>
                    {data.map((d, i) => <td key={i} className="p-1 border">{formatCurrency(d.sga[cat] || 0)}</td>)}
                    <td className="p-1 border bg-gray-50">{formatCurrency(calculateYearTotal(cat, 'sga'))}</td>
                  </tr>
                );
              })}

              {/* Operating Profit */}
              <tr className="bg-blue-100 font-bold border-t-2 border-t-black">
                <td className="p-2 border text-left sticky left-0 bg-blue-100">営業利益</td>
                {data.map((d, i) => {
                  const op = (d.totalSales - d.totalCost) - d.totalSga;
                  return <td key={i} className={`p-2 border ${op < 0 ? 'text-red-600' : ''}`}>{formatCurrency(op)}</td>
                })}
                <td className="p-2 border bg-blue-200">{formatCurrency(operatingProfitSum)}</td>
              </tr>
              <tr className="bg-blue-50 italic text-xs">
                <td className="p-1 border text-left sticky left-0 bg-blue-50 pl-4">営業利益率 (ROS)</td>
                {data.map((d, i) => {
                  const op = (d.totalSales - d.totalCost) - d.totalSga;
                  const rate = d.totalSales ? op / d.totalSales : 0;
                  return <td key={i} className="p-1 border">{formatPercent(rate)}</td>
                })}
                <td className="p-1 border bg-blue-100">{formatPercent(totalSalesSum ? operatingProfitSum / totalSalesSum : 0)}</td>
              </tr>

            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnnualSummary;
