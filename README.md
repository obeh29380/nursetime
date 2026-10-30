# Nursetime

乳児の授乳記録を管理する軽量 Web アプリケーションです。

## 機能

- 授乳記録の作成（開始時刻・終了時刻・メモ）
- 授乳記録の一覧表示・編集・削除
- 完了／未完了の切り替え

## 技術スタック

| 層 | 技術 |
|---|---|
| Runtime | [Bun](https://bun.sh/) |
| Backend | [Hono](https://hono.dev/) |
| DB | SQLite（`bun:sqlite` 組み込み） |
| Frontend | [HTMX](https://htmx.org/)（ローカル配信）|
| CSS | カスタム最小スタイル（外部 CSS なし） |

## 起動方法

### Docker（推奨）

```bash
docker compose up --build -d
```

http://localhost:3000 でアクセスできます。

```bash
# ログ確認
docker compose logs -f

# 停止
docker compose down
```

データは Docker named volume `nursetime-data` に永続化されます。

### ローカル（Bun 直接実行）

```bash
# Bun のインストール（未インストールの場合）
curl -fsSL https://bun.sh/install | bash

# HTMX をローカルに配置
mkdir -p public
curl -fsSL "https://unpkg.com/htmx.org@2.0.4/dist/htmx.min.js" -o public/htmx.min.js

# 依存関係インストール
bun install

# 開発サーバ起動（ホットリロードあり）
bun run dev

# 本番起動
bun run start
```

## 環境変数

| 変数 | デフォルト | 説明 |
|---|---|---|
| `PORT` | `3000` | リッスンポート |
| `DB_PATH` | `nursetime.db` | SQLite DB ファイルパス |
