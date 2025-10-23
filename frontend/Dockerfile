# マルチステージビルドを使用
# Stage 1: ビルド環境
FROM node:18-alpine AS build

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# ソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm run build

# Stage 2: 本番環境
FROM nginx:alpine

# カスタムnginx設定をコピー
COPY nginx.conf /etc/nginx/nginx.conf

# ビルドされたアプリケーションをコピー
COPY --from=build /app/build /usr/share/nginx/html

# ポート80を公開
EXPOSE 80

# nginxを起動
CMD ["nginx", "-g", "daemon off;"]
