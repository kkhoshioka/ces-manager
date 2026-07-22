const fs = require('fs');
const path = 'api/_server/pdfService.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Add getLogoImage right below getSealImage
const sealImageRegex = /const getSealImage = \(\) => \{[\s\S]*?\};\n/;
const logoImageCode = `
const logoPath = path.join(process.cwd(), 'public', 'CES中国ロゴ01.png');
const getLogoImage = () => {
    try {
        if (fs.existsSync(logoPath)) {
            const ext = path.extname(logoPath).toLowerCase();
            const mime = ext === '.jpg' || ext === '.jpeg' ? 'jpeg' : 'png';
            const base64Data = fs.readFileSync(logoPath).toString('base64');
            return \`data:image/\${mime};base64,\${base64Data}\`;
        }
    } catch(e) {
        console.error('Error reading logo image:', e);
    }
    return null;
};
`;
if (!code.includes('getLogoImage')) {
    code = code.replace(sealImageRegex, match => match + logoImageCode);
}

// 2. Add the logo before "株式会社シーイーエス中国" everywhere
const companyNameString = "{ text: '株式会社シーイーエス中国', fontSize: 12, bold: true, alignment: 'right' },";
const logoInsertionCode = `
                            ...( (() => {
                                const logo = getLogoImage();
                                return logo ? [{
                                    image: logo,
                                    width: 140,
                                    alignment: 'right',
                                    margin: [0, 0, 0, 5]
                                }] : [];
                            })() ),
                            { text: '株式会社シーイーエス中国', fontSize: 12, bold: true, alignment: 'right' },
`;

// Replace all occurrences of companyNameString with logoInsertionCode
code = code.split(companyNameString).join(logoInsertionCode.trim());

// Save changes
fs.writeFileSync(path, code, 'utf8');
console.log('Script completed successfully.');
