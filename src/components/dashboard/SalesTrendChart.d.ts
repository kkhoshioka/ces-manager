import React from 'react';
interface TrendData {
    month: number;
    sales: number;
    cost: number;
    profit: number;
}
interface SalesTrendChartProps {
    data: TrendData[];
}
export declare const SalesTrendChart: React.FC<SalesTrendChartProps>;
export {};
