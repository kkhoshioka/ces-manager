import React from 'react';
interface QuotationListProps {
    projectId: number;
    onEdit: (quotationId: number | null) => void;
    onApply: (quotationId: number) => void;
}
declare const QuotationList: React.FC<QuotationListProps>;
export default QuotationList;
