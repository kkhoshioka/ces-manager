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
    lineType?: string; // Added for grouping logic
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

// Helper: Group Travel Time/Distance into one "Travel Expenses" line
const processProjectDetails = (details: ProjectDetail[]): ProjectDetail[] => {
    let travelTotal = 0;
    let hasTravel = false;

    const filteredDetails: ProjectDetail[] = [];

    details.forEach(Detail => {
        // Check for Travel items by lineType or Description convention
        // lineType is preferred if available.
        const isTravel = Detail.lineType === 'travel' ||
            Detail.description.startsWith('【移動時間】') ||
            Detail.description.startsWith('【移動距離】') ||
            Detail.description === '移動時間' ||
            Detail.description === '移動距離';

        if (isTravel) {
            hasTravel = true;
            travelTotal += Number(Detail.quantity) * Number(Detail.unitPrice);
        } else {
            filteredDetails.push(Detail);
        }
    });

    if (hasTravel) {
        // Insert "Travel Expenses" at the position where travel items usually appear?
        // Or just append? Standard practice is often near the end or just where it fits.
        // We'll append it before "Other" or just at the end of the filtered list for simplicity,
        // or effectively replacing the block of travel items.
        // For now, let's append it as a single line.
        filteredDetails.push({
            description: '出張費',
            quantity: 1,
            unitPrice: travelTotal,
            lineType: 'travel_grouped'
        });
    }

    return filteredDetails;
};

export const generateInvoice = (project: Project) => {
    // Process details to group travel expenses
    const processedDetails = processProjectDetails(project.details);

    const subtotal = processedDetails.reduce((sum: number, d: ProjectDetail) => sum + (Number(d.quantity) * Number(d.unitPrice)), 0);
    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + tax;

    const now = new Date();
    const billingDate = formatDate(now);
    // Assuming deadline is end of next month for now, or just leave blank/generic
    const closingDateStr = project.customer?.name?.includes('締') ? '末' : '20'; // Placeholder logic

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docDefinition: any = {
        pageMargins: [30, 30, 30, 30], // Narrower margins
        content: [
            // Top Header Line: Zip and Page No?
            {
                columns: [
                    { text: '〒710-0825\n岡山県倉敷市安江374-1', fontSize: 9 },
                    { text: `Page 1`, alignment: 'right', fontSize: 9 }
                ]
            },
            { text: '', margin: [0, 5] },

            // Title and Date Line
            {
                columns: [
                    // Title (Centered-ish)
                    { width: '*', text: '' }, // Spacer
                    {
                        width: 150,
                        table: {
                            body: [[
                                { text: '請 求 書', style: 'titleLabel', alignment: 'center', fillColor: '#4287f5', color: 'white' }
                            ]]
                        },
                        layout: 'noBorders',
                    },
                    { width: '*', text: '' }, // Spacer
                ]
            },
            {
                columns: [
                    { width: '*', text: '' },
                    {
                        width: 'auto',
                        text: [
                            `令和 ${now.getFullYear() - 2018} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日  締切分 No.`,
                            { text: ` ${project.id.toString().padStart(6, '0')}`, bold: true }
                        ],
                        fontSize: 9,
                        alignment: 'right',
                        margin: [0, -15, 0, 0] // Pull up
                    }
                ]
            },
            { text: '', margin: [0, 15] },

            // Recipient and Company Info
            {
                columns: [
                    {
                        width: 280,
                        stack: [
                            { text: `${project.customer.name} 御中`, fontSize: 13, bold: true, decoration: 'underline' },
                            { text: '\n' },
                            { text: 'お客様コード  (       )', fontSize: 9 },
                            { text: '\n\n' },
                            { text: '毎度ありがとうございます。', fontSize: 9 },
                            { text: '下記の通り御請求申し上げます。', fontSize: 9 }
                        ]
                    },
                    {
                        width: '*',
                        stack: [
                            { text: '株式会社シーイーエス中国', fontSize: 12, bold: true, alignment: 'right' }, // Using dummy name from image or real? User said "CES" logo. I'll use "株式会社シーイーエス" as per code.
                            // Image shows "株式会社シーイーエス中国" but typically we use DB data or config. 
                            // Current code had "株式会社シーイーエス". I will stick to what was there or generic. The user said "use this image".
                            // I'll update address to match image if legible?
                            // Image: 〒710-0825 岡山県倉敷市安江3...
                            // Previous code had dummy. I'll use the image address.
                            {
                                text: [
                                    '〒710-0825 岡山県倉敷市安江374-1\n',
                                    'TEL 086-441-3741\n',
                                    'FAX 086-441-3742\n',
                                    '登録番号 T4260001033325'
                                ],
                                fontSize: 9,
                                alignment: 'right',
                                color: '#555'

                            },
                            // Han (Stamp) placeholder would go here
                        ]
                    }
                ]
            },

            // Summary Table
            {
                style: 'summaryTable',
                table: {
                    widths: ['*', '*', '*', '*', '*', '*'],
                    body: [
                        [
                            { text: '前回御請求額', style: 'blueHeader' },
                            { text: '御入金額', style: 'blueHeader' },
                            { text: '繰越金額', style: 'blueHeader' },
                            { text: '今回御買上額', style: 'blueHeader' },
                            { text: '消 費 税', style: 'blueHeader' },
                            { text: '今回御請求額', style: 'blueHeaderUnique' } // Darker blue
                        ],
                        [
                            { text: '', style: 'summaryCell' }, // Previous
                            { text: '', style: 'summaryCell' }, // Payment
                            { text: '', style: 'summaryCell' }, // Carry over
                            { text: formatCurrency(subtotal).replace('¥', ''), style: 'summaryCell' },
                            { text: formatCurrency(tax).replace('¥', ''), style: 'summaryCell' },
                            { text: formatCurrency(total).replace('¥', ''), style: 'summaryCell' }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: (i: number) => i === 0 || i === 2 ? 1 : 0.5,
                    vLineWidth: (i: number) => i === 0 || i === 6 ? 1 : 0.5,
                    hLineColor: '#4287f5',
                    vLineColor: '#4287f5',
                },
                margin: [0, 20, 0, 5]
            },

            // Detail Table
            {
                style: 'detailTable',
                table: {
                    headerRows: 1,
                    // Col widths: Date, Code/Name, Qty, Unit, Price, Amount, Check?
                    widths: [55, '*', 25, 25, 55, 60, 40],
                    body: [
                        [
                            { text: '日付/伝票番号', style: 'blueHeaderSmall' },
                            { text: '商品コード / 商品名', style: 'blueHeaderSmall' },
                            { text: '数量', style: 'blueHeaderSmall' },
                            { text: '単位', style: 'blueHeaderSmall' },
                            { text: '単価', style: 'blueHeaderSmall' },
                            { text: '金額', style: 'blueHeaderSmall' },
                            { text: '備考', style: 'blueHeaderSmall' }
                        ],
                        // Data Rows
                        ...processedDetails.map((d: ProjectDetail) => [
                            { text: billingDate, fontSize: 8 }, // Using billing date as placeholder for row date
                            { text: d.description, fontSize: 9 },
                            { text: d.quantity, alignment: 'right', fontSize: 9 },
                            { text: '式', alignment: 'center', fontSize: 9 }, // Unit placeholder
                            { text: formatCurrency(d.unitPrice).replace('¥', ''), alignment: 'right', fontSize: 9 },
                            { text: formatCurrency(Number(d.quantity) * Number(d.unitPrice)).replace('¥', ''), alignment: 'right', fontSize: 9 },
                            { text: '', fontSize: 9 } // Remarks
                        ]),
                        // Empty rows to fill space? (Optional, maybe later)

                        // Totals in grid?
                        [
                            { text: '', border: [true, false, true, false] },
                            { text: '消費税', colSpan: 1, alignment: 'left', fontSize: 9, border: [false, false, false, false] },
                            { text: '', border: [true, false, true, false] },
                            { text: '', border: [true, false, true, false] },
                            { text: '', border: [true, false, true, false] },
                            { text: formatCurrency(tax).replace('¥', ''), alignment: 'right', fontSize: 9 },
                            { text: '', border: [true, false, true, false] }
                        ],
                        [
                            { text: '', border: [true, false, true, true] },
                            { text: '【合計 課税10.0% 税抜額】', colSpan: 3, fontSize: 9, border: [false, false, false, true] },
                            {}, {},
                            { text: formatCurrency(subtotal).replace('¥', ''), colSpan: 2, alignment: 'right', fontSize: 9, border: [false, false, true, true] },
                            {},
                            {}
                        ],
                        [
                            { text: '', border: [false, false, true, true] },
                            { text: '【合計 課税10.0% 消費税額】', colSpan: 3, fontSize: 9, border: [false, false, false, true] },
                            {}, {},
                            { text: formatCurrency(tax).replace('¥', ''), colSpan: 2, alignment: 'right', fontSize: 9, border: [false, false, true, true] },
                            {},
                            {}
                        ]
                    ]
                },
                layout: {
                    hLineWidth: function (i: number, node: any) {
                        return (i === 0 || i === node.table.body.length) ? 1 : 0.5;
                    },
                    vLineWidth: function (i: number, node: any) {
                        return (i === 0 || i === node.table.widths.length) ? 1 : 0.5;
                    },
                    hLineColor: '#4287f5',
                    vLineColor: '#4287f5',
                }
            },

            // Bank Info
            {
                text: [
                    '【お振込先】 中国銀行 倉敷駅前支店 普通 2533151\n',
                    '　　　　　　 玉島信用金庫 八王寺支店 普通 0159950\n',
                    '※振込手数料は貴社ご負担にてお願いいたします。'
                ],
                fontSize: 9,
                margin: [0, 20, 0, 0]
            }
        ],
        defaultStyle: {
            font: 'Roboto',
            fontSize: 10
        },
        styles: {
            titleLabel: {
                fontSize: 16,
                bold: true,
                letterSpacing: 5
            },
            blueHeader: {
                fillColor: '#bde0fe', // Light blue
                color: '#000',
                fontSize: 9,
                alignment: 'center',
                bold: true,
                margin: [0, 2]
            },
            blueHeaderUnique: {
                fillColor: '#4287f5', // Darker blue
                color: '#fff',
                fontSize: 9,
                alignment: 'center',
                bold: true,
                margin: [0, 2]
            },
            blueHeaderSmall: {
                fillColor: '#bde0fe',
                color: '#000',
                fontSize: 8,
                alignment: 'center',
                bold: true
            },
            summaryCell: {
                fontSize: 10,
                alignment: 'center',
                margin: [0, 5]
            }
        }
    };

    return printer.createPdfKitDocument(docDefinition);
};

export const generateDeliveryNote = (project: Project) => {
    // Process details to group travel expenses (Quantity logic for Delivery Note: just show 1 for Exps is fine?)
    // Delivery note typically doesn't show prices, but Quantity is relevant.
    // For "Travel Expenses", Quantity 1 is appropriate.
    const processedDetails = processProjectDetails(project.details);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docDefinition: any = {
        content: [
            { text: '納品書', style: 'header', alignment: 'center', margin: [0, 0, 0, 20] },
            {
                columns: [
                    {
                        width: '*',
                        text: [
                            { text: `${project.customer?.name} 御中\n`, fontSize: 14, bold: true },
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
                        ...processedDetails.map((d: ProjectDetail) => [
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
