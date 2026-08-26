import React from 'react';
interface ComboBoxProps {
    value: string;
    options: string[];
    onChange: (value: string) => void;
    placeholder?: string;
    /** 呼び出し元のテーブル用スタイルをそのまま使えるようにする */
    inputClassName?: string;
    inputStyle?: React.CSSProperties;
    disabled?: boolean;
    title?: string;
}
/**
 * 候補から選べて自由入力もできる入力欄。
 *
 * ネイティブの <input list> + <datalist> は入力済みの値で候補を絞り込むため、
 * 一度選ぶと消さない限り他の候補を選べない。ここでは
 *   - フォーカス／クリック時に入力済みの文字を全選択して候補を全件表示する
 *     （消さずにそのまま上書き入力できる）
 *   - 入力し始めてから絞り込む
 * という挙動にしている。
 *
 * 明細テーブルは overflow が効いているため、候補一覧はポータルで body に出す。
 */
declare const ComboBox: React.FC<ComboBoxProps>;
export default ComboBox;
