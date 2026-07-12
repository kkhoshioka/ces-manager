const fs = require('fs');
const path = 'src/pages/dashboard/SupplierMonthlyReport.tsx';
let data = fs.readFileSync(path, 'utf8');

// 1. Insert handleDeletePurchase after handleEditPurchase
const searchStr = "    };\r\n\r\n    const handleDetailStatusChange";
const handleDeleteStr = `    };\r\n\r\n    const handleDeletePurchase = async (detail: SupplierDetail) => {
        if (!detail.isPurchase || !detail.purchaseId) {
            alert('このデータは案件から登録された外注費等です。案件画面から編集・削除してください。');
            return;
        }
        if (window.confirm('この仕入データを削除してよろしいですか？')) {
            try {
                const res = await fetch(\`\${API_BASE_URL}/purchases/\${detail.purchaseId}\`, {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error('Failed to delete purchase');
                fetchReport(true);
                if (selectedSupplier) {
                    handleRowClick(selectedSupplier);
                }
            } catch (err) {
                console.error(err);
                alert('削除に失敗しました');
            }
        }
    };\r\n\r\n    const handleDetailStatusChange`;
data = data.replace(searchStr, handleDeleteStr);

// 2. Add header
data = data.replace(
    '<th style={{ padding: \'0.75rem 0.5rem\', textAlign: \'right\' }}>金額</th>',
    '<th style={{ padding: \'0.75rem 0.5rem\', textAlign: \'right\' }}>金額</th>\r\n                                                                                <th style={{ padding: \'0.75rem 0.5rem\', textAlign: \'center\', width: \'80px\' }}>操作</th>'
);

// 3. Update colSpans for the group header and empty states
data = data.replace(
    '<td colSpan={3} style={{ borderTop: \'1px solid #e2e8f0\' }}></td>',
    '<td colSpan={4} style={{ borderTop: \'1px solid #e2e8f0\' }}></td>'
);
data = data.replace(/colSpan=\{9\}/g, 'colSpan={10}');

// 4. Add the operations cell
const amountCell = '<td style={{ padding: \'0.5rem\', textAlign: \'right\', fontWeight: \'bold\' }}>{formatCurrency(d.amount)}</td>';
const opCell = `<td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
                                                                                                            <button onClick={() => handleEditPurchase(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }} title="編集">
                                                                                                                <Edit size={14} />
                                                                                                            </button>
                                                                                                            <button onClick={() => handleDeletePurchase(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }} title="削除">
                                                                                                                <X size={14} />
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    </td>`;
data = data.replace(
    amountCell,
    amountCell + '\r\n                                                                                                    ' + opCell
);

fs.writeFileSync(path, data, 'utf8');
console.log('Update complete');
