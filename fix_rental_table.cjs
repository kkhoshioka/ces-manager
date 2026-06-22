const fs = require('fs');

let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

const targetStr = `                    <tfoot>
                        <tr style={{ background: '#fffbeb', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            <td colSpan={isWRental ? 8 : 7} style={{ padding: '0.5rem', textAlign: 'right' }}>小計:</td>
                            <td colSpan={isWRental ? 5 : 5} style={{ padding: '0.5rem', textAlign: 'right' }}>{subtotalSales.toLocaleString()}円</td>
                            {isWRental && <td style={{ padding: '0.5rem', textAlign: 'right', color: '#ef4444' }}>{subtotalCost.toLocaleString()}円 (原価)</td>}
                            <td></td>
                        </tr>
                    </tfoot>`;

const newStr = `                    <tfoot>
                        <tr style={{ background: '#fffbeb', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            <td colSpan={isWRental ? 7 : 6} style={{ padding: '0.5rem', textAlign: 'right' }}>小計:</td>
                            <td colSpan={4} style={{ padding: '0.5rem', textAlign: 'right' }}>{subtotalSales.toLocaleString()}円</td>
                            {isWRental && <td style={{ padding: '0.5rem', textAlign: 'right', color: '#ef4444' }}>{subtotalCost.toLocaleString()}円 (原価)</td>}
                            <td></td>
                        </tr>
                    </tfoot>`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, newStr);
    fs.writeFileSync('src/pages/Repairs.tsx', code);
    console.log("Updated footer colSpans successfully.");
} else {
    // try removing crlf
    const normalizedCode = code.replace(/\r\n/g, '\n');
    if (normalizedCode.includes(targetStr)) {
        code = normalizedCode.replace(targetStr, newStr);
        fs.writeFileSync('src/pages/Repairs.tsx', code);
        console.log("Updated footer colSpans successfully (CRLF normalized).");
    } else {
        console.log("Failed to find the target footer string.");
    }
}
