const fs = require('fs');

let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

// Use a more relaxed regex to find the rental block and move it
const blockToMoveRegex = /\s*\{\/\* Rental Details \*\/\}\s*\{formType === 'rental' && \(\s*<div className=\{styles\.formGrid\} style=\{\{ marginTop: '1rem', padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '0\.5rem', border: '1px solid #a7f3d0' \}\}>\s*(<Input[\s\S]*?)<\/div>\s*\)\}/;

const match = code.match(blockToMoveRegex);

if (match) {
    const fullBlock = match[0];
    const innerInputs = match[1];
    
    // Remove from original location
    code = code.replace(fullBlock, '');
    
    // Insert before the closing div of the main formGrid
    // Find the end of the previous block
    const targetRegex = /(<span style=\{\{ paddingTop: '1\.5rem', fontWeight: 500, color: '#4b5563' \}\}>hr<\/span>\s*<\/div>\s*<\/>\s*\)\s*)\r?\n(\s*<\/div>)/;
    
    const replacement = `$1\n{formType === 'rental' && (\n<>\n${innerInputs}\n</>\n)}\n$2`;
    code = code.replace(targetRegex, replacement);
    console.log("Moved rental block successfully.");
} else {
    console.log("Could not match rental block");
}

const statsRegex = /<div className=\{styles\.summaryStats\}>\s*<div style=\{\{ textAlign: 'right', fontSize: '1\.05rem', color: '#64748b' \}\}>\s*<div>自社工賃: \{totals\.categoryTotals\.labor\.sales\.toLocaleString\(\)\}</div>\s*<div>自社出張費: \{totals\.categoryTotals\.travel\.sales\.toLocaleString\(\)\}</div>\s*<div>部品・商品: \{totals\.categoryTotals\.part\.sales\.toLocaleString\(\)\}</div>\s*<div>外注費: \{totals\.categoryTotals\.outsourcing\.sales\.toLocaleString\(\)\}</div>\s*<\/div>/;

const newStats = `<div className={styles.summaryStats}>
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

if (statsRegex.test(code)) {
    code = code.replace(statsRegex, newStats);
    console.log("Replaced summary stats successfully.");
} else {
    console.log("Could not match summary stats");
}

fs.writeFileSync('src/pages/Repairs.tsx', code);
