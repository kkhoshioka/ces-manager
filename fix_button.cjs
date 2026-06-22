const fs = require('fs');
let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

const targetStr = `                                {/* Details Sections */}
                                <div className={styles.detailsSection} style={{ background: 'none', border: 'none', padding: 0 }}>`;

const replaceStr = `                                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', borderTop: '1px solid #e2e8f0', marginTop: '1rem' }}>
                                    <Button type="button" variant="outline" size="sm" onClick={openPastProjectsModal}>
                                        <Copy size={16} style={{ marginRight: '0.25rem' }} /> 過去の案件から明細をコピー
                                    </Button>
                                </div>

                                {/* Details Sections */}
                                <div className={styles.detailsSection} style={{ background: 'none', border: 'none', padding: 0 }}>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/pages/Repairs.tsx', code);
console.log("Trigger button added");
