const fs = require('fs');
let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

// 1. Add search state and function
const stateRegex = /(const \[pastProjects, setPastProjects\] = useState<Repair\[\]>\(\[\]\);\r?\n\s*const \[isPastProjectsLoading, setIsPastProjectsLoading\] = useState\(false\);)/;
const stateReplacement = `$1
    const [pastProjectsSearchText, setPastProjectsSearchText] = useState('');

    const searchPastProjects = async (searchText: string = pastProjectsSearchText) => {
        if (!formState.customerName) return;
        setIsPastProjectsLoading(true);
        try {
            const customer = customers.find(c => c.name === formState.customerName);
            if (!customer) throw new Error('Customer not found');
            const data = await RepairService.getAll({ customerId: customer.id, limit: 100, search: searchText || undefined });
            setPastProjects(data.filter(p => p.id !== selectedProjectId));
        } catch (error) {
            console.error('Failed to load past projects', error);
            alert('過去の案件の読み込みに失敗しました');
        } finally {
            setIsPastProjectsLoading(false);
        }
    };
`;
code = code.replace(stateRegex, stateReplacement);

// 2. Clear search text when opening modal
const openModalRegex = /(const openPastProjectsModal = async \(\) => \{\r?\n\s*if \(\!formState\.customerName\) \{\r?\n\s*alert\('顧客を選択してください'\);\r?\n\s*return;\r?\n\s*\}\r?\n\s*setIsPastProjectsModalOpen\(true\);\r?\n\s*setIsPastProjectsLoading\(true\);)/;
const openModalReplacement = `$1\n        setPastProjectsSearchText('');`;
code = code.replace(openModalRegex, openModalReplacement);

// 3. Update the Modal UI
const modalUIRegex = /<div className=\{styles\.modalOverlay\}>\r?\n\s*<div className=\{styles\.modalContent\} style=\{\{ maxWidth: '800px', width: '90%' \}\}>\r?\n\s*<div className=\{styles\.modalHeader\}>\r?\n\s*<h2>過去の案件から明細をコピー<\/h2>\r?\n\s*<button className=\{styles\.closeButton\} onClick=\{\(\) => setIsPastProjectsModalOpen\(false\)\}>\s*<X size=\{24\} \/>\s*<\/button>\r?\n\s*<\/div>\r?\n\s*<div className=\{styles\.modalBody\} style=\{\{ maxHeight: '60vh', overflowY: 'auto', padding: '1rem' \}\}>/g;

const modalUIReplacement = `<div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
                    <div className={styles.modal} style={{ maxWidth: '800px', width: '90%' }}>
                        <div className={styles.modalHeader}>
                            <h2>過去の案件から明細をコピー</h2>
                            <button className={styles.closeButton} onClick={() => setIsPastProjectsModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className={styles.modalBody} style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1.5rem', backgroundColor: '#f8fafc' }}>
                            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    type="text" 
                                    placeholder="機種、シリアル、備考などで検索..." 
                                    value={pastProjectsSearchText}
                                    onChange={(e) => setPastProjectsSearchText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchPastProjects()}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                                <Button type="button" onClick={() => searchPastProjects()}>
                                    検索
                                </Button>
                            </div>
`;
code = code.replace(modalUIRegex, modalUIReplacement);

fs.writeFileSync('src/pages/Repairs.tsx', code);
console.log("Repairs.tsx updated");
