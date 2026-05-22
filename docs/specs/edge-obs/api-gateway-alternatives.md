---
title: API Gateway Alternatives (2026) — Kong-free Edge for Node/Fastify
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - https://doc.traefik.io/traefik/v3.5/
  - https://gateway.envoyproxy.io/docs/
  - https://apisix.apache.org/docs/apisix/architecture-design/apisix/
  - https://www.krakend.io/docs/overview/
  - https://tyk.io/docs/tyk-oss/
  - https://caddyserver.com/docs/
  - https://www.pomerium.com/docs/
  - https://hasura.io/docs/3.0/getting-started/overview/
  - https://gateway-api.sigs.k8s.io/
  - https://kubernetes.io/docs/concepts/services-networking/gateway/
---

# API Gateway Alternatives (2026)

## Why not Kong?

Kong remains capable, but for this template's profile — a Node/Fastify microservices stack on Kubernetes (MicroK8s/K3s in the small footprint, EKS/GKE later), with strict TypeScript-first tooling, schema-based multi-tenancy and OpenTelemetry traces — Kong's footprint, Cassandra/Postgres dependency for the OSS edition, and the gradual de-emphasis of the OSS plugin gallery in favour of Konnect SaaS make it a poor default in 2026. We need an edge that:

- Speaks **Kubernetes Gateway API** natively (or has a credible plan).
- Has **first-class OpenTelemetry** propagation (no plugin assembly required).
- Ships with **declarative config** that lives in git (no DB-as-source-of-truth).
- Has a **small RAM footprint** so the prod-smallest compose can hold it on a 8–16 GiB node alongside Postgres/Kafka/Redis.
- Supports **mTLS to upstreams**, **JWT/OIDC**, **rate-limit per-tenant**, and **gRPC + HTTP/2 + WebSockets**.

The eight contenders below are scored against those criteria.

---

## Contenders

### 1. Traefik (v3.x)

Traefik v3 went GA with Wasm middleware, OTel native, HTTP/3, and Gateway API v1.1 conformance ([Traefik v3 docs](https://doc.traefik.io/traefik/v3.5/)).

**Pros**

- Zero-config service discovery from Kubernetes Ingress, Gateway API, Docker labels, Consul.
- Built-in ACME (Let's Encrypt) with DNS-01 challenge for wildcard certs.
- OTel tracing + metrics native (no plugin).
- Lightweight (~30 MiB RSS); Go binary, single process.
- Excellent docker-compose ergonomics with the Docker provider.

**Cons**

- Plugin ecosystem (Yaegi + Wasm) is smaller and slower than APISIX/Envoy.
- Rate limiting is per-instance; cluster-wide quotas require Traefik Hub / Enterprise.
- mTLS-to-upstream config is verbose compared to Envoy.
- Dashboard is read-only in OSS; mutation requires Traefik Hub.

**Use when**: small/medium clusters, dev-prod parity matters, you want the same gateway in compose and k8s with minimal cognitive overhead.

**Don't use when**: you need cluster-wide quotas, complex traffic shadowing, or a mature WASM filter chain.

### 2. Envoy + Envoy Gateway

Envoy is the proven L7 proxy behind Istio, Consul, AWS App Mesh. **Envoy Gateway** is the upstream-blessed Gateway API implementation that ships a single binary plus a control plane that watches Gateway/HTTPRoute CRDs ([envoyproxy/gateway docs](https://gateway.envoyproxy.io/docs/)).

**Pros**

- The reference Gateway API implementation; future-proof.
- Native HTTP/3, gRPC, gRPC-Web, WebSockets, mTLS.
- OTel tracing first-class; OPA, ext-authz, ext-proc for arbitrary policy.
- WASM filter chain is the most mature in the industry (Proxy-Wasm ABI).
- Used at hyperscale; the only OSS gateway with proven 10⁶ rps single-pod performance.

**Cons**

- Steepest learning curve. Config is JSON/YAML for the data plane and CRDs for the control plane; both are verbose.
- Memory baseline ~80–120 MiB; not the smallest.
- Hot-restart story is more complex than Traefik/Caddy.
- Local dev outside k8s wants a separate Envoy config (no Docker labels provider).

**Use when**: you're committed to Gateway API, expect to scale past 10k rps, or already running Istio/Linkerd and want a single proxy stack.

**Don't use when**: team is < 3 engineers and nobody has run Envoy in anger. Operational complexity will eat you.

### 3. Apache APISIX

APISIX is an etcd-backed, plugin-rich gateway born at Tencent, now Apache top-level ([APISIX architecture](https://apisix.apache.org/docs/apisix/architecture-design/apisix/)).

**Pros**

- ~100 plugins shipped OSS: JWT, OIDC, rate-limit (cluster + per-consumer), traffic-split, mTLS, OTel, Prometheus, Loki, Kafka logger.
- Hot-reload via etcd watch; sub-millisecond config propagation.
- gRPC + Dubbo + MQTT + WebSocket native.
- Excellent dashboard (`apisix-dashboard`) and a TypeScript Admin SDK.

**Cons**

- Runs on OpenResty (Nginx + LuaJIT); custom plugins are Lua or Wasm.
- Requires etcd cluster as state store; another dependency to babysit.
- Gateway API conformance is partial (improving in 2026).
- Dashboard project velocity has slowed.

**Use when**: you need many policies out-of-box, value declarative config + a control DB, and want a battle-tested plugin gallery.

**Don't use when**: you have an etcd allergy or a hard rule against Lua/OpenResty in prod.

### 4. KrakenD

KrakenD is a Go-based, declarative, **stateless** API gateway optimized for **aggregation** ([KrakenD overview](https://www.krakend.io/docs/overview/)).

**Pros**

- Zero state. Config is a single JSON file (`krakend.json`); restart is the deploy.
- Excellent response aggregation / fan-out / GraphQL-from-REST.
- Predictable performance; benchmarks consistently top OSS gateways for RPS/CPU.
- Tight Prometheus + OTel integration.

**Cons**

- No mutating admin API by design. Every change is a redeploy.
- Plugin model is Go shared objects (`.so`) — JIT-unfriendly.
- Auth is JWT-validate-only OSS; OIDC discovery, key rotation, introspection are Enterprise.
- Less suited as a generic ingress; it's a **BFF aggregator**.

**Use when**: you want a BFF layer in front of microservices and the gateway's job is response shaping/aggregation.

**Don't use when**: you need TLS-termination + WAF + rate-limit + auth at the edge — that's not its lane.

### 5. Tyk OSS

Tyk Gateway OSS is a Go gateway with a Redis backplane ([Tyk OSS](https://tyk.io/docs/tyk-oss/)).

**Pros**

- Plugin runtime supports JavaScript (otto), Python, Lua, gRPC sidecar, Wasm.
- Mature OIDC, OAuth2, JWT, mTLS in OSS.
- Multi-tenant API model (organizations/policies) baked in.

**Cons**

- "OSS" footprint without the Dashboard/MDCB/Pump is hard to operate; the Dashboard is Enterprise.
- Requires Redis as runtime cache.
- Documentation often steers you toward Tyk Cloud / Self-Managed (paid).
- Plugin polyglot is a foot-gun (JS interpreter is otto, not V8).

**Use when**: you want multi-tenant API products with quotas and developer portals and you're willing to buy the Dashboard later.

**Don't use when**: you want a pure OSS path with no SaaS upsell pressure.

### 6. Caddy 2

Caddy is the Go web-server-with-batteries that pioneered automatic HTTPS ([Caddy docs](https://caddyserver.com/docs/)).

**Pros**

- Best-in-class automatic TLS (ACME, OCSP, on-demand certs).
- Smallest mental model: a Caddyfile is ten lines for most setups.
- Modules: reverse-proxy, OIDC (caddy-security), rate-limit, OTel, WAF (Coraza).
- Embeddable as a Go library — great for sidecars.

**Cons**

- Not a "gateway" by design; it's a reverse proxy with growing gateway features.
- Gateway API support exists via community projects, not first-class.
- Cluster-wide policy / multi-instance config sync is BYO (admin API + etcd/redis).
- Smaller plugin marketplace than APISIX.

**Use when**: you want a single-binary edge for a small fleet; or a TLS-terminator in front of a "real" gateway.

**Don't use when**: you need fine-grained per-route policy + plugin matrix at hyperscale.

### 7. Pomerium

Pomerium is **identity-aware proxy** — zero-trust access for internal services ([Pomerium docs](https://www.pomerium.com/docs/)).

**Pros**

- Per-request OIDC + device + context (PEP/PDP model).
- No VPN needed for internal tools.
- Excellent integration with Entra ID, Okta, Google, GitHub.
- Native OTel; mTLS to upstreams.

**Cons**

- Different role: it's an **authz proxy**, not a public-API gateway. You'd still put another gateway in front for North-South API traffic.
- Adds latency (~5–15 ms per request) from policy eval.
- OSS edition lacks the policy editor UI.

**Use when**: protecting internal dashboards (Grafana, ArgoCD, Backstage). Pair with another gateway for the public API.

**Don't use when**: as your primary API gateway — wrong tool.

### 8. Hasura DDN (Data Delivery Network)

Hasura v3 / DDN is **not** a generic API gateway ([Hasura DDN docs](https://hasura.io/docs/3.0/getting-started/overview/)). It's a federated query layer that exposes GraphQL/REST over your data sources (Postgres, Mongo, REST, gRPC) with row-level auth.

**Pros**

- Auto-generated GraphQL with permissions; massive backend savings.
- Multi-tenant via session variables → SQL preset; aligns with our schema-per-tenant model.
- OTel + Prometheus first-class.

**Cons**

- Solves a different problem. Not a TLS-terminator/edge gateway.
- DDN is a SaaS-first product; self-hosted ("ddn local") is improving but second-tier.
- Couples you to Hasura's data model abstractions.

**Use when**: you want a "BFF + auth + query" layer over Postgres for a tenant SaaS. Place behind another edge gateway.

**Don't use when**: as the L7 ingress. Wrong role.

---

## Decision Matrix

| Criterion / Gateway    | Traefik    | Envoy GW       | APISIX        | KrakenD    | Tyk OSS         | Caddy           | Pomerium       | Hasura     |
| ---------------------- | ---------- | -------------- | ------------- | ---------- | --------------- | --------------- | -------------- | ---------- |
| Gateway API native     | Yes (v1.1) | Yes (ref impl) | Partial       | No         | Partial         | Community       | No             | No         |
| OTel built-in          | Yes        | Yes            | Yes (plugin)  | Yes        | Yes (plugin)    | Yes             | Yes            | Yes        |
| Declarative (git-able) | Yes        | Yes (CRD)      | Etcd+CRD      | Yes (JSON) | Files+Redis     | Yes (Caddyfile) | Yes            | Yes        |
| Memory baseline (MiB)  | ~30        | ~100           | ~80           | ~40        | ~70             | ~25             | ~60            | ~200+      |
| Plugin maturity        | Med        | High (WASM)    | Very High     | Low        | High (polyglot) | Med             | N/A            | N/A        |
| Auth (OIDC OSS)        | Plugin     | ext-authz      | Yes           | JWT only   | Yes             | caddy-security  | Yes (core)     | Yes        |
| Per-tenant rate-limit  | Cluster=ee | Yes            | Yes           | Yes        | Yes             | Plugin          | N/A            | N/A        |
| gRPC / HTTP/3          | Yes / Yes  | Yes / Yes      | Yes / Partial | Yes / No   | Yes / No        | Yes / Yes       | Yes / No       | N/A        |
| Operational complexity | Low        | High           | Med-High      | Low        | Med             | Low             | Low            | Med        |
| Right role for us      | Yes        | Yes            | Yes           | BFF only   | Yes             | Reverse-proxy   | Internal authz | Data layer |

---

## Recommendation

**Winner: Envoy Gateway** for the Kubernetes target (staging + prod).
**Runner-up: Traefik v3** for dev/compose + small clusters.

### Justification

Envoy Gateway is the only contender that satisfies the **"future-proof at Kubernetes scale"** criterion without compromise. The Kubernetes Gateway API ([gateway-api.sigs.k8s.io](https://gateway-api.sigs.k8s.io/)) is the post-Ingress standard; Envoy Gateway is its reference implementation. WASM filters give us an escape hatch for custom policy without re-deploying. Native OTel and ext-authz let us bolt the `@pkg/tenancy` JWT → tenant_id extraction at the gateway, so backends never see unscoped requests.

Traefik is the runner-up because:

1. Its Docker provider gives us a single-binary edge in `compose.prod-smallest.yml` and `compose.dev.yml` with **dev-prod parity** (same config style).
2. ACME built-in saves a cert-manager dependency in small deployments.
3. For < 5k rps services, Traefik's RSS/CPU is hard to beat.

The hybrid plan: **Traefik in compose / single-node staging, Envoy Gateway in multi-node K8s**. They share Gateway API CRDs where it matters, so route definitions port cleanly.

APISIX is the runner-up to the runner-up — pick it only if the team already runs OpenResty/etcd or needs the plugin gallery on day one.

---

## docker-compose recipe — Traefik v3 (the runner-up that we ship in compose)

Envoy Gateway's natural habitat is Kubernetes, not compose. For the `compose.prod-smallest.yml` we ship Traefik; the K8s spec ships Envoy Gateway CRDs.

```yaml
# docker/edge/traefik.yml
services:
  traefik:
    image: traefik:v3.5
    container_name: edge-traefik
    restart: unless-stopped
    command:
      - --api.dashboard=true
      - --api.insecure=false
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --providers.file.directory=/etc/traefik/dynamic
      - --providers.file.watch=true
      - --entrypoints.web.address=:80
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
      - --entrypoints.websecure.address=:443
      - --entrypoints.websecure.http3=true
      - --certificatesresolvers.le.acme.email=ops@example.com
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.le.acme.dnschallenge=true
      - --certificatesresolvers.le.acme.dnschallenge.provider=cloudflare
      - --tracing.otlp=true
      - --tracing.otlp.grpc.endpoint=otel-collector:4317
      - --tracing.otlp.grpc.insecure=true
      - --metrics.prometheus=true
      - --metrics.prometheus.addrouterslabels=true
      - --accesslog=true
      - --accesslog.format=json
    ports:
      - '80:80'
      - '443:443'
      - '443:443/udp' # HTTP/3
    environment:
      CF_DNS_API_TOKEN_FILE: /run/secrets/cf_token
    secrets:
      - cf_token
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./dynamic:/etc/traefik/dynamic:ro
      - traefik-letsencrypt:/letsencrypt
    labels:
      - traefik.enable=true
      - traefik.http.routers.dash.rule=Host(`edge.internal.example.com`)
      - traefik.http.routers.dash.entrypoints=websecure
      - traefik.http.routers.dash.tls.certresolver=le
      - traefik.http.routers.dash.service=api@internal
      - traefik.http.routers.dash.middlewares=auth-oidc@file
    networks: [edge, observability]
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 256M

secrets:
  cf_token:
    file: ./secrets/cf_token.txt

volumes:
  traefik-letsencrypt:

networks:
  edge: {}
  observability:
    external: true
```

```yaml
# docker/edge/dynamic/middlewares.yml
http:
  middlewares:
    rate-limit-tenant:
      rateLimit:
        average: 200
        burst: 400
        sourceCriterion:
          requestHeaderName: x-tenant-id
    auth-oidc:
      forwardAuth:
        address: http://oauth2-proxy:4180/oauth2/auth
        trustForwardHeader: true
        authResponseHeaders:
          - X-Auth-Request-Email
          - X-Auth-Request-User
          - X-Auth-Request-Groups
    strip-tenant:
      stripPrefixRegex:
        regex: ^/t/[^/]+
```

The Envoy Gateway counterpart lives in `infra/k8s/gateway/` as `GatewayClass`, `Gateway`, and `HTTPRoute` CRDs; that spec is owned by the platform repo, not this template.

---

## Open questions / follow-ups

- **WAF**: which one? Coraza (OWASP CRS) plugs into Caddy and Envoy via Wasm. Add a follow-up ADR.
- **Per-tenant quotas**: Traefik OSS only supports per-instance limits. We'll need Redis-backed rate-limit middleware (e.g., `traefik-redis-ratelimit`) for the prod-smallest profile until we migrate to Envoy Gateway + RLS.
- **Cert-manager vs ACME-in-gateway**: in K8s with Envoy Gateway we let cert-manager own certs; in compose Traefik owns ACME.
