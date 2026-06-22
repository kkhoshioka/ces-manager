const fs = require('fs');

let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

// The block to remove starts from `{/* Rental Details - Moved to match other fields */}`
// and ends with `)}`
// Let's use indexOf and substring
const targetStrStart = "{/* Rental Details - Moved to match other fields */}";
const startIndex = code.indexOf(targetStrStart);

if (startIndex !== -1) {
    // Find the end of this block
    // It's inside a `{formType === 'rental' && (` block, which ends with `)}`
    
    // We can search for `<option value="cancelled">キャンセル</option>\n                                                    </select>\n                                                </div>\n                                            </>\n                                        )}`
    const targetStrEnd = `<option value="cancelled">キャンセル</option>\n                                                    </select>\n                                                </div>\n                                            </>\n                                        )}`;
    
    // Normalize line endings for reliable matching
    let normalizedCode = code.replace(/\r\n/g, '\n');
    let nStartIndex = normalizedCode.indexOf(targetStrStart);
    let nEndIndex = normalizedCode.indexOf(targetStrEnd, nStartIndex);
    
    if (nEndIndex !== -1) {
        // Extract the exact exact block to remove, including leading whitespace
        // Wait, just let's remove from start to end
        let blockToRemove = normalizedCode.substring(nStartIndex, nEndIndex + targetStrEnd.length);
        
        // Find leading whitespace before targetStrStart
        const lastNewline = normalizedCode.lastIndexOf('\n', nStartIndex);
        if (lastNewline !== -1) {
            blockToRemove = normalizedCode.substring(lastNewline + 1, nEndIndex + targetStrEnd.length);
            
            // Also grab trailing newline to avoid leaving an empty line
            if (normalizedCode.charAt(nEndIndex + targetStrEnd.length) === '\n') {
                blockToRemove += '\n';
            }
        }
        
        normalizedCode = normalizedCode.replace(blockToRemove, "");
        fs.writeFileSync('src/pages/Repairs.tsx', normalizedCode);
        console.log("Removed rental details top block successfully.");
    } else {
        console.log("Failed to find end of block.");
    }
} else {
    console.log("Failed to find start of block.");
}
