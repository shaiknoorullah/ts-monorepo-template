# apps/cms/Dockerfile
# Multi-stage build for self-hosted Payload 3.

FROM node:20-bookworm-slim AS base
# Tracking distro-shipped versions intentionally — every Debian point release
# bumps these packages and explicit pins would break security updates on a
# rolling `node:20-bookworm-slim` base. The base image is already pinned by
# digest in deploy manifests; runtime upgrades are handled by image rebuilds.
# hadolint ignore=DL3008
RUN apt-get update -y && apt-get install -y --no-install-recommends \
      ca-certificates curl tini libvips && \
    rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /repo

# ---- deps ----
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/cms/package.json apps/cms/
COPY packages packages
RUN pnpm install --filter ./apps/cms... --frozen-lockfile

# ---- build ----
FROM base AS build
COPY --from=deps /repo /repo
COPY apps/cms apps/cms
RUN pnpm --filter @app/cms run build

# ---- runtime ----
FROM node:20-bookworm-slim AS runtime
# Same rationale as the base stage above — tracking distro-shipped versions.
# hadolint ignore=DL3008
RUN apt-get update -y && apt-get install -y --no-install-recommends \
      ca-certificates tini libvips && \
    rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/cms/.next ./.next
COPY --from=build /repo/apps/cms/payload.config.ts ./payload.config.ts
COPY --from=build /repo/apps/cms/next.config.mjs ./next.config.mjs
COPY --from=build /repo/apps/cms/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/cms/node_modules ./node_modules-cms
EXPOSE 3000
USER node
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
