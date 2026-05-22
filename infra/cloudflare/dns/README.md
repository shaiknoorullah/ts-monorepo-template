# Cloudflare DNS records

Add via the dashboard or via `cf-terraforming` (out of scope).

| Host                | Type             | Target                                   | Proxied |
| ------------------- | ---------------- | ---------------------------------------- | ------- |
| `www.example.com`   | CNAME            | `<marketing-project>.pages.dev`          | Yes     |
| `docs.example.com`  | CNAME            | `<docs-public-project>.pages.dev`        | Yes     |
| `app.example.com`   | CNAME            | `<web-app-project>.pages.dev`            | Yes     |
| `*.app.example.com` | CNAME (wildcard) | `<web-app-project>.pages.dev`            | Yes     |
| `api.example.com`   | CNAME            | (Tunnel UUID).cfargotunnel.com OR origin | Yes     |
| `*.dev.example.com` | CNAME            | (Tunnel UUID).cfargotunnel.com           | Yes     |
| `auth.example.com`  | CNAME            | Ory/Keycloak origin                      | Yes     |
| `cms.example.com`   | CNAME            | Payload origin                           | Yes     |

Page Rules / Workers Routes — bind the tenant-router Worker to `*.app.example.com/*`.
