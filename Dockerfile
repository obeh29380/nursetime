FROM oven/bun:1-alpine
WORKDIR /app

RUN apk add --no-cache curl

# 依存インストール（package.json が変わらない限りキャッシュされる）
COPY package.json ./
RUN bun install --production

# HTMX をビルド時にダウンロードしてローカル配信
RUN mkdir -p public && \
    curl -fsSL "https://unpkg.com/htmx.org@2.0.4/dist/htmx.min.js" -o public/htmx.min.js

# データ永続化ディレクトリを作成し bun ユーザに権限付与
RUN mkdir -p /data && chown bun:bun /data

COPY src/ ./src/
COPY tsconfig.json ./

USER bun
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
