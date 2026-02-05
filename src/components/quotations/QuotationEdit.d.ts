import React from 'react';
interface QuotationEditProps {
    quotationId: number;
    onClose: () => void;
    onSaveSuccess: () => void;
}
declare const QuotationEdit: React.FC<QuotationEditProps>;
export default QuotationEdit;
