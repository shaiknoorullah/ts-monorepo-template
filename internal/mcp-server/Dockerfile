# syntax=docker/dockerfile:1.10
# Multi-stage MCP server image — spec Section 11.2 / Section 5.3.

FROM node:20.18.0-bookworm AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm fetch
COPY tsconfig.json ./
COPY src ./src
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false --offline && \
    pnpm build && \
    pnpm prune --prod

FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runtime
LABEL org.opencontainers.image.source="https://github.com/ts-monorepo-template/platform"
LABEL org.opencontainers.image.licenses="Apache-2.0"
LABEL org.opencontainers.image.title="ts-monorepo-template-mcp-server"
LABEL org.opencontainers.image.description="MCP server for ts-monorepo-template (Layer 0b)"
WORKDIR /app
COPY --from=builder --chown=nonroot:nonroot /app/dist /app/dist
COPY --from=builder --chown=nonroot:nonroot /app/node_modules /app/node_modules
COPY --from=builder --chown=nonroot:nonroot /app/package.json /app/package.json
USER nonroot
ENV NODE_ENV=production
ENTRYPOINT ["node", "/app/dist/server.js"]
