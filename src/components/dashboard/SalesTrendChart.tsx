import React from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface TrendData {
    month: number;
    sales: number;
    cost: number;
    profit: number;
    operatingExpenses?: number;
    ordinaryProfit?: number;
}

interface SalesTrendChartProps {
    data: TrendData[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatYAxis = (value: any) => {
    return new Intl.NumberFormat('ja-JP', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(Number(value));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatTooltip = (value: any) => {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY'
    }).format(Number(value));
};

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 400 }}>
            <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#1e293b' }}>月別売上・粗利推移</h3>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20,
                    }}
                >
                    <CartesianGrid stroke="#f5f5f5" />
                    <XAxis
                        dataKey="month"
                        scale="band"
                        tickFormatter={(value) => `${value}月`}
                    />
                    <YAxis tickFormatter={formatYAxis} />
                    <Tooltip
                        formatter={formatTooltip}
                        labelFormatter={(value) => `${value}月`}
                    />
                    <Legend />
                    <Bar dataKey="sales" name="売上高" barSize={20} fill="#3b82f6" />
                    <Line type="monotone" dataKey="profit" name="粗利益" stroke="#16a34a" strokeWidth={2} />
                    {data.some(d => d.ordinaryProfit !== undefined) && (
                        <Line type="monotone" dataKey="ordinaryProfit" name="経常利益" stroke="#0d9488" strokeWidth={2} strokeDasharray="5 5" />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
