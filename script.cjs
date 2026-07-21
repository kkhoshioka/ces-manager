const fs = require('fs');
const path = 'api/_server/pdfService.ts';
let data = fs.readFileSync(path, 'utf8');

// We want to replace the image block.
const searchStr = `                            ...(fs.existsSync(sealPath) ? [{
                                image: sealPath,
                                width: 45,
                                alignment: 'right',
                                margin: [0, -35, 10, -10]
                            }] : []),`;

const getBase64Logic = `
const getSealImage = () => {
    try {
        if (fs.existsSync(sealPath)) {
            const ext = path.extname(sealPath).toLowerCase();
            const mime = ext === '.jpg' || ext === '.jpeg' ? 'jpeg' : 'png';
            const base64Data = fs.readFileSync(sealPath).toString('base64');
            return \`data:image/\${mime};base64,\${base64Data}\`;
        }
    } catch(e) {
        console.error('Error reading seal image:', e);
    }
    return null;
};
`;

if (!data.includes('const getSealImage')) {
    data = data.replace("const sealPath = path.join(process.cwd(), 'public', 'seal.png');", 
        "const sealPath = path.join(process.cwd(), 'public', 'seal.png');" + getBase64Logic);
}

const replaceStr = `                            ...( (() => {
                                const seal = getSealImage();
                                return seal ? [{
                                    image: seal,
                                    width: 45,
                                    alignment: 'right',
                                    margin: [0, -35, 10, -10]
                                }] : [];
                            })() ),`;

data = data.split(searchStr).join(replaceStr);

fs.writeFileSync(path, data, 'utf8');
console.log('Update complete');
