// ---- 損益概況の売上区分 ----
// 商品種別マスターの「部門」を、損益概況のどの売上行に集計するかを決める。
// 部門ごとに plCategory を設定でき、未設定の場合は部門名から推定する。
export const PL_SALES_CATEGORIES = [
    '新車販売', '中古車販売', 'アタッチメント販売', '部品販売',
    'レンタル', '修理', '美容品販売', 'その他'
];

/** 部門名から売上区分を推定する（マスターで明示設定されていない場合の既定値） */
export const guessPlCategory = (section: string): string => {
    const s = section || '';
    // 「ATT中古品」を中古車販売に取られないよう、ATT の判定を先に行う
    if (s.includes('ATT') || s.includes('アタッチメント')) return 'アタッチメント販売';
    if (s.includes('中古車')) return '中古車販売';
    if (s.includes('新車')) return '新車販売';
    if (s.includes('レンタル')) return 'レンタル';
    if (s.includes('修理') || s.includes('メンテナンス') || s.includes('整備')
        || s.includes('検査') || s.includes('工賃')) return '修理';
    if (s.includes('美容')) return '美容品販売';
    // オイル・油脂などの消耗品も部品販売にまとめる（顧客要望）
    if (s.includes('部品') || s.includes('消耗') || s.includes('オイル') || s.includes('油')) return '部品販売';
    return 'その他';
};

/** 売上区分に対応する売上原価の区分を返す */
export const resolveCostCategory = (lineType: string, plCategory: string): string => {
    if (lineType === 'forwarding') return '荷造運賃';
    if (lineType === 'outsourcing') return '外注費';
    if (lineType !== 'part' && lineType !== 'inventory') return 'その他';

    if (plCategory === 'レンタル') return 'レンタル仕入';
    if (plCategory === '美容品販売') return '美容品仕入';
    // 部品と修理に使った物は材料費。車輌・アタッチメントの仕入は商品仕入。
    if (plCategory === '部品販売' || plCategory === '修理') return '材料費';
    if (plCategory.includes('販売')) return '商品仕入';
    return '材料費';
};
