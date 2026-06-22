const fs = require('fs');

let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

// Normalize line endings for easier matching
const originalCode = code;
code = code.replace(/\r\n/g, '\n');

// The original block looks like:
const oldRentalBlockStartStr = "{/* Rental Details */}";
const oldRentalBlockEndStr = "</div>\n                                    )}";

const oldRentalBlockStart = code.indexOf(oldRentalBlockStartStr);
const oldRentalBlockEnd = code.indexOf(oldRentalBlockEndStr, oldRentalBlockStart);

if (oldRentalBlockStart !== -1 && oldRentalBlockEnd !== -1) {
    const rentalBlockWithWrapper = code.substring(oldRentalBlockStart, oldRentalBlockEnd + oldRentalBlockEndStr.length);
    
    // Remove it from the code
    code = code.replace(rentalBlockWithWrapper, "");
    
    const insertAfterStr = "</span>\n                                                </div>\n                                            </>\n                                        )}\n";
    
    const fieldsToInsert = `
                                        {/* Rental Details - Moved to match other fields */}
                                        {formType === 'rental' && (
                                            <>
                                                <Input
                                                    label="貸出日"
                                                    type="date"
                                                    name="rentalStartDate"
                                                    value={formState.rentalStartDate}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <Input
                                                    label="返却予定日"
                                                    type="date"
                                                    name="rentalEndDate"
                                                    value={formState.rentalEndDate}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <Input
                                                    label="実際の返却日"
                                                    type="date"
                                                    name="actualReturnDate"
                                                    value={formState.actualReturnDate}
                                                    onChange={handleInputChange}
                                                />
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">レンタルステータス</label>
                                                    <select
                                                        name="rentalStatus"
                                                        value={formState.rentalStatus}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                                    >
                                                        <option value="reserved">予約中</option>
                                                        <option value="rented_out">貸出中</option>
                                                        <option value="returned">返却済</option>
                                                        <option value="cancelled">キャンセル</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}
`;
    
    const insertPos = code.indexOf(insertAfterStr);
    if (insertPos !== -1) {
        code = code.substring(0, insertPos + insertAfterStr.length) + fieldsToInsert + code.substring(insertPos + insertAfterStr.length);
        console.log("Moved rental fields successfully");
    } else {
        console.log("Failed to find insertion point");
    }
} else {
    console.log("Failed to find rental block");
}

const statsBlockStart = `<div className={styles.summaryStats}>
                                        <div style={{ textAlign: 'right', fontSize: '1.05rem', color: '#64748b' }}>
                                            <div>自社工賃: {totals.categoryTotals.labor.sales.toLocaleString()}</div>
                                            <div>自社出張費: {totals.categoryTotals.travel.sales.toLocaleString()}</div>
                                            <div>部品・商品: {totals.categoryTotals.part.sales.toLocaleString()}</div>
                                            <div>外注費: {totals.categoryTotals.outsourcing.sales.toLocaleString()}</div>
                                        </div>`;

const newStatsBlock = `<div className={styles.summaryStats}>
                                        <div style={{ textAlign: 'right', fontSize: '1.05rem', color: '#64748b' }}>
                                            {formType === 'rental' ? (
                                                <>
                                                    <div>自社在庫レンタル: {totals.categoryTotals.part.sales.toLocaleString()}</div>
                                                    <div>他社Wレンタル: {totals.categoryTotals.outsourcing.sales.toLocaleString()}</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div>自社工賃: {totals.categoryTotals.labor.sales.toLocaleString()}</div>
                                                    <div>自社出張費: {totals.categoryTotals.travel.sales.toLocaleString()}</div>
                                                    <div>部品・商品: {totals.categoryTotals.part.sales.toLocaleString()}</div>
                                                    <div>外注費: {totals.categoryTotals.outsourcing.sales.toLocaleString()}</div>
                                                </>
                                            )}
                                        </div>`;

if (code.indexOf(statsBlockStart) !== -1) {
    code = code.replace(statsBlockStart, newStatsBlock);
    console.log("Updated summary stats successfully");
} else {
    console.log("Failed to find summary stats block");
}

// Convert back to original line endings if needed (though TS handles LF fine, Git handles CRLF/LF)
fs.writeFileSync('src/pages/Repairs.tsx', code);
