import React from 'react';
interface CategoryData {
    name: string;
    value: number;
}
interface CategoryPieChartProps {
    data: CategoryData[];
    title: string;
}
export declare const CategoryPieChart: React.FC<CategoryPieChartProps>;
export {};
