const fs = require('fs');

let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

// Move the Rental Details Block
const blockStartStr = "{/* Rental Details */}";
const blockEndStr = "</div>\n                                    )}";

const blockStartIndex = code.indexOf(blockStartStr);
const blockEndIndex = code.indexOf(blockEndStr, blockStartIndex) + blockEndStr.length;

if (blockStartIndex !== -1 && blockEndIndex !== -1) {
    let rentalBlock = code.substring(blockStartIndex, blockEndIndex);
    
    // Remove it from current position
    code = code.substring(0, blockStartIndex) + code.substring(blockEndIndex);
    
    // Convert the wrapper of rentalBlock from `<div className={styles.formGrid} style={{...}}>` to `<>`
    // The actual form fields start with `<Input label="貸出日"`
    const innerStart = rentalBlock.indexOf('<Input\n                                                label="貸出日"');
    const innerEnd = rentalBlock.lastIndexOf('</div>\n                                        </div>');
    
    if (innerStart !== -1 && innerEnd !== -1) {
        const innerInputs = rentalBlock.substring(innerStart, innerEnd + 6); // include the closing </div> of the select
        
        const newRentalBlock = `{formType === 'rental' && (\n                                            <>\n                                                ${innerInputs}\n                                            </>\n                                        )}`;
        
        // Find where to insert it: before the closing `</div>` of the main `styles.formGrid`
        // We know the main formGrid ends right before `</div>\n                                    \n                                    <div className={styles.summaryStats}>`
        // Since we removed the rental block, the code now has `</div>\n                                    \n                                    <div className={styles.summaryStats}>`
        const targetInsert = "                                    </div>\n                                    \n                                    <div className={styles.summaryStats}>";
        const newInsert = `                                        ${newRentalBlock}\n                                    </div>\n                                    \n                                    <div className={styles.summaryStats}>`;
        
        code = code.replace(targetInsert, newInsert);
        console.log("Moved rental block successfully.");
    } else {
        console.log("Could not find inner inputs");
    }
} else {
    console.log("Could not find rental block bounds");
}

// Update summary stats
const oldStatsStr = `<div className={styles.summaryStats}>
                                        <div style={{ textAlign: 'right', fontSize: '1.05rem', color: '#64748b' }}>
                                            <div>自社工賃: {totals.categoryTotals.labor.sales.toLocaleString()}</div>
                                            <div>自社出張費: {totals.categoryTotals.travel.sales.toLocaleString()}</div>
                                            <div>部品・商品: {totals.categoryTotals.part.sales.toLocaleString()}</div>
                                            <div>外注費: {totals.categoryTotals.outsourcing.sales.toLocaleString()}</div>
                                        </div>`;

const newStatsStr = `<div className={styles.summaryStats}>
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

if (code.includes(oldStatsStr)) {
    code = code.replace(oldStatsStr, newStatsStr);
    console.log("Replaced summary stats successfully.");
} else {
    console.log("Could not find old stats block.");
}

fs.writeFileSync('src/pages/Repairs.tsx', code);
