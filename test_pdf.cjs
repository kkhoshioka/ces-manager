const fs = require('fs');
const path = require('path');
const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts.js');

pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Create a dummy red square to act as the seal image (base64 PNG)
const dummySealBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const docDefinition = {
    pageMargins: [30, 30, 30, 30],
    content: [
        {
            columns: [
                {
                    width: 280,
                    stack: [
                        { text: 'Dummy Customer', fontSize: 13, bold: true }
                    ]
                },
                {
                    width: '*',
                    stack: [
                        { text: '株式会社シーイーエス中国', fontSize: 12, bold: true, alignment: 'right' },
                        {
                            image: dummySealBase64,
                            width: 45,
                            alignment: 'right',
                            margin: [0, -25, 20, -20]
                        },
                        {
                            text: '〒710-0825 岡山県倉敷市安江374-1\nTEL 086-441-3741\nFAX 086-441-3742',
                            fontSize: 9,
                            alignment: 'right',
                            color: '#555'
                        }
                    ]
                }
            ]
        }
    ]
};

const pdfDoc = pdfMake.createPdf(docDefinition);
pdfDoc.getBuffer((buffer) => {
    fs.writeFileSync('test_seal.pdf', buffer);
    console.log('PDF generated');
});
