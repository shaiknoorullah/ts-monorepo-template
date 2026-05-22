---
title: Quickstart
description: Stand up your first tenant in under five commands.
---

```bash
# 1. Bootstrap
corepack enable
pnpm install --frozen-lockfile

# 2. Bring up local dev stack (postgres, redis, kafka, temporal)
repo dev up

# 3. Run migrations
repo db migrate

# 4. Seed a tenant
repo db seed --tenant=acme

# 5. Start the apps
pnpm dev
```

Open <http://localhost:4321> for the marketing site and <http://localhost:8081> for the multi-tenant web app.
