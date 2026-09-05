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
/**
 * 「12/30」のように手入力された仕入日を日付に変換する。
 * 年は書かれていないので、受付日にいちばん近い年を選ぶ。
 * これで「12月受付・1月仕入」「1月受付・12月仕入」のような年またぎでも正しい年になる。
 * 「2026/12/30」のように年まで書かれている場合はその年をそのまま使う。
 */
export declare const parsePurchaseDateInput: (raw: string, baseDateStr?: string) => string | null;
/** 保存済みの仕入日を入力欄用の短い表記にする。受付日と同じ年なら「12/30」、違う年なら「2025/12/30」。 */
export declare const formatPurchaseDateInput: (value?: string | null, baseDateStr?: string | null) => string;
/**
 * 案件No. を数字のまとまりごとに比べる（自然順）。
 * 単純な文字列比較だと「7-1, 7-11, 7-2」の順になってしまうため、
 * 数字部分は数値として比較して「7-1, 7-2, ... 7-11, 7-21」の順に並べる。
 */
export declare const compareProjectNo: (a?: string | null, b?: string | null) => number;
