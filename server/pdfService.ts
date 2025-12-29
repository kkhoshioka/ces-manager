import PdfPrinter from 'pdfmake';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define font paths properly
const notoSansRegular = path.join(__dirname, 'fonts/NotoSansJP-Regular.otf');
const notoSansBold = path.join(__dirname, 'fonts/NotoSansJP-Bold.otf');

const fonts = {
    Roboto: {
        normal: notoSansRegular,
        bold: notoSansBold,
        italics: notoSansRegular, // Fallback
        bolditalics: notoSansBold // Fallback
    }
};

const printer = new PdfPrinter(fonts);

interface ProjectDetail {
    description: string;
    quantity: number | string;
    unitPrice: number | string;
}

interface Customer {
    name: string;
}

interface Project {
    id: number | string;
    customer: Customer;
    machineModel: string;
    serialNumber: string;
    details: ProjectDetail[];
    notes?: string;
}

const formatCurrency = (amount: number | string) => {
    return `¥${Number(amount).toLocaleString()}`;
};

const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ja-JP');
};

export const generateInvoice = (project: Project) => {
    const subtotal = project.details.reduce((sum: number, d: ProjectDetail) => sum + (Number(d.quantity) * Number(d.unitPrice)), 0);
    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + tax;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docDefinition: any = {
        content: [
            { text: '御請求書', style: 'header', alignment: 'center', margin: [0, 0, 0, 20] },
            {
                columns: [
                    {
                        width: '*',
                        text: [
                            { text: `${project.customer.name} 御中\n`, fontSize: 14, bold: true },
                            `\n`,
                            `件名: ${project.machineModel} (${project.serialNumber}) 修理代金\n`,
                            `請求日: ${formatDate(new Date())}\n`,
                            `請求番号: INV-${project.id}-${Date.now().toString().slice(-6)}`
                        ]
                    },
                    {
                        width: 200,
                        text: [
                            { text: '株式会社シーイーエス\n', bold: true },
                            '〒000-0000\n',
                            '住所: 東京都XXXXX\n',
                            'TEL: 03-0000-0000\n',
                            '担当: 担当者名'
                        ],
                        alignment: 'right'
                    }
                ]
            },
            { text: '', margin: [0, 20] },
            {
                text: `御請求金額: ${formatCurrency(total)} (税込)`,
                style: 'totalAmount',
                alignment: 'center',
                margin: [0, 0, 0, 20],
                decoration: 'underline'
            },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto'],
                    body: [
                        [
                            { text: '品名 / 内容', style: 'tableHeader' },
                            { text: '数量', style: 'tableHeader', alignment: 'center' },
                            { text: '単価', style: 'tableHeader', alignment: 'center' },
                            { text: '金額', style: 'tableHeader', alignment: 'center' }
                        ],
                        ...project.details.map((d: ProjectDetail) => [
                            d.description,
                            { text: d.quantity, alignment: 'right' },
                            { text: formatCurrency(d.unitPrice), alignment: 'right' },
                            { text: formatCurrency(Number(d.quantity) * Number(d.unitPrice)), alignment: 'right' }
                        ]),
                        [
                            { text: '小計', colSpan: 3, alignment: 'right', bold: true },
                            {}, {},
                            { text: formatCurrency(subtotal), alignment: 'right' }
                        ],
                        [
                            { text: '消費税 (10%)', colSpan: 3, alignment: 'right', bold: true },
                            {}, {},
                            { text: formatCurrency(tax), alignment: 'right' }
                        ],
                        [
                            { text: '合計', colSpan: 3, alignment: 'right', bold: true, fontSize: 12 },
                            {}, {},
                            { text: formatCurrency(total), alignment: 'right', bold: true, fontSize: 12 }
                        ]
                    ]
                },
                layout: 'lightHorizontalLines'
            },
            { text: '備考:', margin: [0, 20, 0, 5] },
            { text: project.notes || 'なし', fontSize: 10, color: '#555' }
        ],
        defaultStyle: {
            font: 'Roboto',
            fontSize: 10
        },
        styles: {
            header: {
                fontSize: 18,
                bold: true
            },
            tableHeader: {
                bold: true,
                fontSize: 10,
                color: 'black',
                fillColor: '#eeeeee'
            },
            totalAmount: {
                fontSize: 16,
                bold: true
            }
        }
    };

    return printer.createPdfKitDocument(docDefinition);
};

export const generateDeliveryNote = (project: Project) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docDefinition: any = {
        content: [
            { text: '納品書', style: 'header', alignment: 'center', margin: [0, 0, 0, 20] },
            {
                columns: [
                    {
                        width: '*',
                        text: [
                            { text: `${project.customer.name} 御中\n`, fontSize: 14, bold: true },
                            `\n`,
                            `件名: ${project.machineModel} (${project.serialNumber}) 修理完了品\n`,
                            `納品日: ${formatDate(new Date())}\n`,
                            `納品番号: DEL-${project.id}-${Date.now().toString().slice(-6)}`
                        ]
                    },
                    {
                        width: 200,
                        text: [
                            { text: '株式会社シーイーエス\n', bold: true },
                            '〒000-0000\n',
                            '住所: 東京都XXXXX\n',
                            'TEL: 03-0000-0000\n',
                            '担当: 担当者名'
                        ],
                        alignment: 'right'
                    }
                ]
            },
            { text: '下記の通り納品いたしました。', margin: [0, 20] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto'],
                    body: [
                        [
                            { text: '品名 / 内容', style: 'tableHeader' },
                            { text: '数量', style: 'tableHeader', alignment: 'center' }
                        ],
                        ...project.details.map((d: ProjectDetail) => [
                            d.description,
                            { text: d.quantity, alignment: 'right' }
                        ])
                    ]
                },
                layout: 'lightHorizontalLines'
            },
            { text: '備考:', margin: [0, 20, 0, 5] },
            { text: project.notes || 'なし', fontSize: 10, color: '#555' }
        ],
        defaultStyle: {
            font: 'Roboto',
            fontSize: 10
        },
        styles: {
            header: {
                fontSize: 18,
                bold: true
            },
            tableHeader: {
                bold: true,
                fontSize: 10,
                color: 'black',
                fillColor: '#eeeeee'
            }
        }
    };

    return printer.createPdfKitDocument(docDefinition);
};
