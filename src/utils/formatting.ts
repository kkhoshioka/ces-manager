export const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('ja-JP');
};

export const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '-';
    return `${value.toLocaleString('ja-JP')}円`;
};
