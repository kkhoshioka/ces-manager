export declare const PL_SALES_CATEGORIES: string[];
/** 部門名から売上区分を推定する（マスターで明示設定されていない場合の既定値） */
export declare const guessPlCategory: (section: string) => string;
/** 売上区分に対応する売上原価の区分を返す */
export declare const resolveCostCategory: (lineType: string, plCategory: string) => string;
