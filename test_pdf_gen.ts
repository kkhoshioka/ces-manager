import PdfPrinter from 'pdfmake';
import fs from 'fs';

const fontPath = 'C:/Windows/Fonts/msgothic.ttc';

const fonts = {
    MSGothic: {
        normal: fontPath,
        bold: fontPath,
        italics: fontPath,
        bolditalics: fontPath
    }
};

const printer = new PdfPrinter(fonts);

const docDefinition: any = {
    content: [
        { text: 'Hello World', fontSize: 15 },
        { text: 'こんにちは世界', fontSize: 15 }
    ],
    defaultStyle: {
        font: 'MSGothic'
    }
};

const pdfDoc = printer.createPdfKitDocument(docDefinition);
pdfDoc.pipe(fs.createWriteStream('test_output.pdf'));
pdfDoc.end();

console.log('PDF generated');
