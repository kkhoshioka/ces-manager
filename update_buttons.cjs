const fs = require('fs');

let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

const regex = /<div style=\{\{ display: 'flex', gap: '0\.75rem' \}\}>\r?\n\s*<Button icon=\{\<ShoppingCart size=\{18\} \/>\} onClick=\{\(\) => openNewForm\('sales'\)\} style=\{\{ backgroundColor: '#0ea5e9', border: 'none' \}\}>\r?\n\s*新規販売登録\r?\n\s*<\/Button>\r?\n\s*<Button icon=\{\<ShoppingCart size=\{18\} \/>\} onClick=\{\(\) => openNewForm\('rental'\)\} style=\{\{ backgroundColor: '#10b981', border: 'none' \}\}>\r?\n\s*レンタル案件登録\r?\n\s*<\/Button>\r?\n\s*<Button icon=\{\<Wrench size=\{18\} \/>\} onClick=\{\(\) => openNewForm\('repair'\)\}>\r?\n\s*新規修理受付\r?\n\s*<\/Button>\r?\n\s*<\/div>/;

const replacement = `<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Button icon={<ShoppingCart size={18} />} onClick={() => openNewForm('sales')} style={{ backgroundColor: '#0ea5e9', border: 'none' }}>
                        新規販売登録
                    </Button>
                    <Button icon={<ShoppingCart size={18} />} onClick={() => openNewForm('rental')} style={{ backgroundColor: '#10b981', border: 'none' }}>
                        レンタル登録
                    </Button>
                    <Button icon={<Wrench size={18} />} onClick={() => openNewForm('repair')}>
                        新規修理受付
                    </Button>
                    <Button icon={<Wrench size={18} />} onClick={() => openNewForm('inspection')} style={{ backgroundColor: '#8b5cf6', border: 'none' }}>
                        新規特定自主検査
                    </Button>
                    <Button icon={<Plus size={18} />} onClick={() => openNewForm('other')} style={{ backgroundColor: '#64748b', border: 'none' }}>
                        その他新規受付
                    </Button>
                </div>`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/pages/Repairs.tsx', code);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find regex!");
}
