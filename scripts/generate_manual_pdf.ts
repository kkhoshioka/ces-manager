
import PdfPrinter from 'pdfmake';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const fontDir = path.join(__dirname, '../server/fonts');
const artifactDir = 'C:/Users/pipip/.gemini/antigravity/brain/df0bf9fb-8540-4595-89a3-56f860ad0bb4';
const outputDir = artifactDir;

// Font Configuration
const fonts = {
    Roboto: {
        normal: path.join(fontDir, 'NotoSansJP-Regular.otf'),
        bold: path.join(fontDir, 'NotoSansJP-Bold.otf'),
        italics: path.join(fontDir, 'NotoSansJP-Regular.otf'),
        bolditalics: path.join(fontDir, 'NotoSansJP-Bold.otf')
    }
};

const printer = new PdfPrinter(fonts);

// Header/Footer style
const headerStyle = { fontSize: 9, color: '#888', margin: [40, 20, 40, 0] };
const footerStyle = { fontSize: 9, color: '#888', margin: [40, 0, 40, 0], alignment: 'center' };

// Document Definition
const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
        // Cover Page
        {
            text: 'CES Manager',
            style: 'coverTitle',
            alignment: 'center',
            margin: [0, 150, 0, 20]
        },
        {
            text: '操作マニュアル',
            style: 'coverSubtitle',
            alignment: 'center',
            margin: [0, 0, 0, 200]
        },
        {
            text: 'Ver 1.0',
            alignment: 'center',
            fontSize: 12,
            color: '#555'
        },
        {
            text: new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }),
            alignment: 'center',
            fontSize: 12,
            color: '#555',
            pageBreak: 'after'
        },

        // Table of Contents (Manual for simplicity or auto-generated)
        { text: '目次', style: 'h1', margin: [0, 0, 0, 20] },
        {
            ul: [
                '1. はじめに',
                '2. ダッシュボードの見方',
                '3. 修理・販売案件の管理',
                '4. 新規案件の登録方法',
                '5. 請求書・納品書の発行',
                '6. よくある質問',
            ],
            style: 'toc',
            pageBreak: 'after'
        },

        // Chapter 1: Introduction
        { text: '1. はじめに', style: 'h1' },
        { text: 'この度は、CES Manager（修理・販売管理システム）をご利用いただきありがとうございます。', style: 'body' },
        { text: '本システムは、日々の修理受付から見積もり、請求書発行までを一元管理し、業務効率を飛躍的に向上させることを目的としています。本マニュアルでは、システムの基本的な操作方法から便利な機能まで、詳しく解説いたします。', style: 'body' },
        { text: 'ご不明な点がございましたら、システム管理者までお問い合わせください。', style: 'body', margin: [0, 0, 0, 40] },

        // Chapter 2: Dashboard
        { text: '2. ダッシュボードの見方', style: 'h1' },
        { text: 'システムにログインすると、最初にダッシュボードが表示されます。ここでは、ビジネスの全体像を一目で把握できます。', style: 'body' },
        {
            image: path.join(artifactDir, 'dashboard_metrics_mockup_1768833652887.png'),
            width: 480,
            margin: [0, 20, 0, 10]
        },
        { text: '画面解説', style: 'h3' },
        {
            ul: [
                { text: 'ナビゲーションメニュー（左側）: 各機能へのショートカットです。「修理/販売」「顧客マスター」などへワンクリックで移動できます。', margin: [0, 0, 0, 5] },
                { text: '重要指標カード（上部）: 「月間売上」「進行中案件数」「未入金請求額」「今月の利益」がリアルタイムで更新されます。', margin: [0, 0, 0, 5] },
                { text: '売上トレンドグラフ（中央）: 過去1年間の売上推移を視覚的に確認できます。マウスオーバーで詳細な数値が表示されます。', margin: [0, 0, 0, 5] },
                { text: '最近のアクティビティ（下部）: 直近に行われた操作履歴が表示され、誰が何をしたかを把握できます。', margin: [0, 0, 0, 5] }
            ],
            style: 'body',
            pageBreak: 'after'
        },

        // Chapter 3: Repairs List
        { text: '3. 修理・販売案件の管理', style: 'h1' },
        { text: 'サイドメニューの「修理 / 販売」をクリックすると、案件一覧画面が表示されます。', style: 'body' },
        {
            image: path.join(artifactDir, 'repairs_list_view_mockup_1768833534445.png'),
            width: 480,
            margin: [0, 20, 0, 10]
        },
        { text: '機能詳細', style: 'h3' },
        {
            ul: [
                { text: '検索機能: 画面右上の検索ボックスより、顧客名、機種名、シリアル番号などで素早く検索可能です。', margin: [0, 0, 0, 5] },
                { text: 'ステータス管理: 「作業中」「完了」などの状態が色分けされたバッジで表示され、進捗状況が一目でわかります。', margin: [0, 0, 0, 5] },
                { text: '帳票の即時発行: 一覧の右側にあるボタンから、PDFを直接発行できます。', margin: [0, 0, 0, 5] }
            ],
            style: 'body'
        },
        {
            text: '💡 ヒント: 青色の「請求書」ボタンと、緑色の「納品書」ボタンは、それぞれクリックするだけで新しいタブでPDFが開きます。',
            style: 'tipBox',
            margin: [20, 10, 20, 20]
        },
        { text: '', pageBreak: 'after' },

        // Chapter 4: New Registration
        { text: '4. 新規案件の登録方法', style: 'h1' },
        { text: '新しい修理依頼や販売案件が発生した場合は、画面右上の「新規修理受付」または「新規販売登録」ボタンをクリックします。', style: 'body' },
        {
            image: path.join(artifactDir, 'repair_form_mockup_1768833805714.png'),
            width: 400,
            margin: [0, 20, 0, 10],
            alignment: 'center'
        },
        { text: '入力のポイント', style: 'h3' },
        {
            ol: [
                { text: '顧客名の入力: 既存の顧客はリストから選択できます。新規顧客の場合は直接入力してください。', margin: [0, 0, 0, 5] },
                { text: '機器情報の入力: 「機種名」と「シリアル番号」を正確に入力することで、後から履歴を追跡しやすくなります。', margin: [0, 0, 0, 5] },
                { text: '不具合内容の記録: お客様からのヒアリング内容を詳細に記録します。', margin: [0, 0, 0, 5] },
                { text: '写真の添付: 現場の写真や、修理前の状態を写真で残すことができます。ドラッグ＆ドロップで簡単に添付可能です。', margin: [0, 0, 0, 5] }
            ],
            style: 'body',
            pageBreak: 'after'
        },

        // Chapter 5: PDF Issuance
        { text: '5. 請求書・納品書の発行', style: 'h1' },
        { text: '案件が完了したら、お客様にお渡しする書類を発行しましょう。本システムでは、プロフェッショナルなデザインの帳票をワンクリックで作成できます。', style: 'body' },
        { text: '発行手順', style: 'h3' },
        { text: '1. 一覧画面または詳細画面を開きます。', style: 'body' },
        { text: '2. 対象の案件の「請求書（青）」または「納品書（緑）」ボタンをクリックします。', style: 'body' },
        { text: '3. 新しいタブでPDFが表示されますので、印刷またはダウンロードしてご利用ください。', style: 'body' },
        {
            table: {
                widths: ['30%', '70%'],
                body: [
                    [{ text: '帳票の種類', style: 'tableHeader' }, { text: '特徴', style: 'tableHeader' }],
                    ['請求書', '金額、振込先情報、明細が含まれます。青色を基調としたデザインです。'],
                    ['納品書', '数量、品名、備考のみが表示され、金額は記載されません。現場での機材受け渡し時に最適です。']
                ]
            },
            margin: [0, 20, 0, 20]
        },

        // Chapter 6: FAQ
        { text: '6. よくある質問', style: 'h1', pageBreak: 'before' },
        { text: 'Q: 登録した顧客情報を修正したいのですが？', style: 'question' },
        { text: 'A: サイドメニューの「顧客マスター」から修正可能です。対象の顧客を検索し、編集ボタンを押してください。', style: 'answer' },
        { text: 'Q: 誤って削除した案件は復元できますか？', style: 'question' },
        { text: 'A: セキュリティのため、一度削除（ゴミ箱アイコン）した案件は復元できません。削除の際は十分にご注意ください。', style: 'answer' },
        { text: 'Q: 写真は何枚まで登録できますか？', style: 'question' },
        { text: 'A: 1案件につき、特に制限はありませんが、動作の快適さを保つため10枚程度までを推奨しております。', style: 'answer' },

        { text: '末筆ながら、貴社の業務発展に本システムがお役に立てることを心より願っております。', style: 'body', margin: [0, 50, 0, 0], italics: true, alignment: 'center' }
    ],
    styles: {
        coverTitle: {
            fontSize: 36,
            bold: true,
            color: '#2563eb'
        },
        coverSubtitle: {
            fontSize: 24,
            bold: true,
            color: '#555'
        },
        h1: {
            fontSize: 22,
            bold: true,
            color: '#2563eb', // Standardized Blue
            margin: [0, 10, 0, 10],
            border: [false, false, false, true], // Underline
            borderColor: '#e5e7eb'
        },
        h3: {
            fontSize: 14,
            bold: true,
            color: '#333',
            margin: [0, 15, 0, 10]
        },
        body: {
            fontSize: 10,
            lineHeight: 1.6,
            color: '#333',
            margin: [0, 0, 0, 10]
        },
        toc: {
            fontSize: 12,
            lineHeight: 2,
            margin: [20, 0, 0, 0]
        },
        tipBox: {
            fontSize: 10,
            color: '#1e40af',
            background: '#eff6ff',
            margin: [10, 10, 10, 10],
            padding: 10
        },
        tableHeader: {
            bold: true,
            fontSize: 10,
            color: 'white',
            fillColor: '#2563eb',
            alignment: 'center'
        },
        question: {
            fontSize: 11,
            bold: true,
            color: '#2563eb',
            margin: [0, 15, 0, 5]
        },
        answer: {
            fontSize: 10,
            color: '#333',
            margin: [10, 0, 0, 10]
        }
    },
    defaultStyle: {
        font: 'Roboto'
    }
};

// Generate PDF
const pdfDoc = printer.createPdfKitDocument(docDefinition as any);
const outputName = 'CES_Manager_Manual.pdf';
const outputPath = path.join(outputDir, outputName);

pdfDoc.pipe(fs.createWriteStream(outputPath));
pdfDoc.end();

console.log(`PDF created successfully at: ${outputPath}`);
