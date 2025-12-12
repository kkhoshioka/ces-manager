# CES Repair Management System

建設機械の修理・販売・在庫管理を行うWebアプリケーションです。

## 1. 前提条件 (Prerequisites)

このプロジェクトをローカル環境で実行するには、以下のソフトウェアが必要です。

*   **Node.js**: v18以上 (推奨: v20 LTS)
*   **npm**: Node.jsに同梱されています
*   **Git**: バージョン管理用

## 2. 環境構築 (Setup)

### 2-1. リポジトリの取得

```bash
git clone git@github.com:your-account/ces-app.git
cd ces-app
```

### 2-2. 依存関係のインストール

```bash
npm install
```

### 2-3. 環境変数の設定

ルートディレクトリに `.env` ファイルを作成し、データベース接続情報を設定してください。

**`.env` の例:**

```env
# データベース接続URL (PostgreSQL / Google Cloud SQL)
# 形式: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://postgres:password@localhost:5432/ces_db?schema=public"

# サーバーポート (任意)
PORT=3000
```

> [!IMPORTANT]
> **データベースについて**:
> 現在はクラウドデータベース（Google Cloud SQLなど）への接続を前提としています。
> データのインポート（移行）手順については、別途 [README_MIGRATION.md](./README_MIGRATION.md) を参照してください。

## 3. アプリケーションの起動 (Running the App)

以下のコマンドで開発サーバーを起動します。

```bash
npm run dev
```

*   **Frontend**: http://localhost:5173
*   **Backend**: http://localhost:3000

## 4. プロジェクト構成

*   `src/`: フロントエンド (React + Vite)
*   `server/`: バックエンド (Express + Prisma)
*   `prisma/`: データベーススキーマとマイグレーション
*   `scripts/`: ユーティリティスクリプト (データダンプ等)

## 5. その他

*   **PDF生成**: 請求書・納品書のPDF生成機能があります。日本語フォントの設定については `server/pdfService.ts` を確認してください。
*   **ダッシュボード**: `/dashboard` で売上集計を確認できます。
