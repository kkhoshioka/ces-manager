import type React from 'react';
/**
 * テキスト入力中の Enter でフォームが送信される（＝保存されて一覧に戻る）のを防ぐ。
 * 改行が必要な textarea と、押されたら動くべき button は対象外。
 */
export declare const preventImplicitSubmit: (event: React.KeyboardEvent<HTMLFormElement>) => void;
/**
 * 編集画面を開いたときのスナップショットと今の入力内容を比べて、変更が無いかを判定する。
 * 各マスターのフォームは値・配列のみのプレーンなオブジェクトなので JSON 比較で足りる。
 */
export declare const isUnchanged: <T>(current: T, original: T | null | undefined) => boolean;
