# apps/web-app/Dockerfile
# Containerized web build — used by self-hosted preview deploys. The primary
# deploy path is `wrangler pages deploy dist`, so this image is optional.

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web-app apps/web-app
COPY packages packages
COPY internal internal

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @app/web-app build:web

FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/apps/web-app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
