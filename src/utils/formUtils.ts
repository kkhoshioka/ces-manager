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
