const fs = require('fs');
let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

// 1. Fix the modal header issue
const headerRegex = /<div className=\{styles\.modalHeader\} style=\{\{[\s\S]*?zIndex: 100\r?\n\s*\}\}>[\s\S]*?<button className=\{styles\.closeButton\}/;
const headerReplacement = `<div className={styles.modalHeader} style={{
                            backgroundColor: (formType === 'sales' ? '#e0f2fe' :
                                formType === 'inspection' ? '#f3e8ff' :
                                    formType === 'maintenance' ? '#ffedd5' :
                                        formType === 'rental' ? '#d1fae5' : '#fef9c3'),
                            color: (formType === 'sales' ? '#0369a1' :
                                formType === 'inspection' ? '#7e22ce' :
                                    formType === 'maintenance' ? '#c2410c' :
                                        formType === 'rental' ? '#047857' : '#854d0e'),
                            position: 'sticky',
                            top: 0,
                            zIndex: 100
                        }}>
                            <h2>
                                {selectedProjectId ? '案件詳細・編集' : (
                                    formType === 'sales' ? '新規販売登録' : 
                                    formType === 'rental' ? 'レンタル案件登録' : 
                                    formType === 'inspection' ? '新規特定自主検査受付' :
                                    formType === 'maintenance' ? '新規整備受付' :
                                    '新規修理受付'
                                )}
                            </h2>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {selectedProjectId && (
                                    <Button variant="outline" size="sm" onClick={() => handleDuplicateProject(selectedProjectId)}>
                                        <Copy size={16} style={{ marginRight: '0.25rem' }} /> 複製して新規作成
                                    </Button>
                                )}
                                <button className={styles.closeButton}`;

if (headerRegex.test(code)) {
    code = code.replace(headerRegex, headerReplacement);
    console.log("Fixed modal header");
}

fs.writeFileSync('src/pages/Repairs.tsx', code);
