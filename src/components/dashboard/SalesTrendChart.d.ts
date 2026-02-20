import React from 'react';
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
export declare const SalesTrendChart: React.FC<SalesTrendChartProps>;
export {};
