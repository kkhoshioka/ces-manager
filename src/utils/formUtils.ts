import type React from 'react';

/**
 * テキスト入力中の Enter でフォームが送信される（＝保存されて一覧に戻る）のを防ぐ。
 * 改行が必要な textarea と、押されたら動くべき button は対象外。
 */
export const preventImplicitSubmit = (event: React.KeyboardEvent<HTMLFormElement>) => {
    const target = event.target as HTMLElement;
    if (event.key === 'Enter' && target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
        event.preventDefault();
    }
};

/**
 * 編集画面を開いたときのスナップショットと今の入力内容を比べて、変更が無いかを判定する。
 * 各マスターのフォームは値・配列のみのプレーンなオブジェクトなので JSON 比較で足りる。
 */
export const isUnchanged = <T,>(current: T, original: T | null | undefined): boolean => {
    if (original === null || original === undefined) return false;
    return JSON.stringify(current) === JSON.stringify(original);
};

const toIsoDateString = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * 「12/30」のように手入力された仕入日を日付に変換する。
 * 年は書かれていないので、受付日にいちばん近い年を選ぶ。
 * これで「12月受付・1月仕入」「1月受付・12月仕入」のような年またぎでも正しい年になる。
 * 「2026/12/30」のように年まで書かれている場合はその年をそのまま使う。
 */
export const parsePurchaseDateInput = (raw: string, baseDateStr?: string): string | null => {
    const text = (raw || '').trim();
    if (!text) return null;

    const full = text.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
    if (full) {
        const d = new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3]));
        return isNaN(d.getTime()) ? null : toIsoDateString(d);
    }

    const md = text.match(/^(\d{1,2})[/\-.](\d{1,2})$/);
    if (!md) return null;
    const month = Number(md[1]);
    const day = Number(md[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const parsedBase = baseDateStr ? new Date(baseDateStr) : new Date();
    const base = isNaN(parsedBase.getTime()) ? new Date() : parsedBase;
    const baseTime = base.getTime();

    let best: Date | undefined;
    for (const y of [base.getFullYear() - 1, base.getFullYear(), base.getFullYear() + 1]) {
        const cand = new Date(y, month - 1, day);
        if (cand.getMonth() !== month - 1) continue; // 2/30 のような存在しない日付を弾く
        if (best === undefined || Math.abs(cand.getTime() - baseTime) < Math.abs(best.getTime() - baseTime)) {
            best = cand;
        }
    }
    return best ? toIsoDateString(best) : null;
};

/** 保存済みの仕入日を入力欄用の短い表記にする。受付日と同じ年なら「12/30」、違う年なら「2025/12/30」。 */
export const formatPurchaseDateInput = (value?: string | null, baseDateStr?: string | null): string => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const parsedBase = baseDateStr ? new Date(baseDateStr) : new Date();
    const baseYear = (isNaN(parsedBase.getTime()) ? new Date() : parsedBase).getFullYear();
    return d.getFullYear() === baseYear
        ? `${d.getMonth() + 1}/${d.getDate()}`
        : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

/**
 * 案件No. を数字のまとまりごとに比べる（自然順）。
 * 単純な文字列比較だと「7-1, 7-11, 7-2」の順になってしまうため、
 * 数字部分は数値として比較して「7-1, 7-2, ... 7-11, 7-21」の順に並べる。
 */
export const compareProjectNo = (a?: string | null, b?: string | null): number => {
    const aStr = (a || '').trim();
    const bStr = (b || '').trim();
    // 未入力は常に末尾へ
    if (!aStr && !bStr) return 0;
    if (!aStr) return 1;
    if (!bStr) return -1;

    const split = (v: string) => v.match(/\d+|\D+/g) || [];
    const aParts = split(aStr);
    const bParts = split(bStr);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const ap = aParts[i];
        const bp = bParts[i];
        if (ap === undefined) return -1;
        if (bp === undefined) return 1;

        const aNum = /^\d+$/.test(ap);
        const bNum = /^\d+$/.test(bp);
        if (aNum && bNum) {
            const diff = Number(ap) - Number(bp);
            if (diff !== 0) return diff;
        } else {
            const diff = ap.localeCompare(bp, 'ja');
            if (diff !== 0) return diff;
        }
    }
    return 0;
};
