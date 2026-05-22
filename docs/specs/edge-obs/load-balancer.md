---
title: Load Balancer — L4 vs L7, MetalLB, Cilium, Cloud, HAProxy
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - https://metallb.universe.tf/concepts/
  - https://docs.cilium.io/en/stable/network/lb-ipam/
  - https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/
  - https://www.haproxy.com/documentation/haproxy-configuration-tutorials/
  - https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-overview
  - https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html
  - https://kubernetes.io/docs/concepts/services-networking/service/#type-loadbalancer
  - https://gateway-api.sigs.k8s.io/
---

# Load Balancer

## L4 vs L7 — when each

A load balancer terminates a transport. **L4** balances **TCP/UDP connections**; it sees packets and 5-tuples, not HTTP. **L7** terminates the application protocol (HTTP/1.1, HTTP/2, HTTP/3, gRPC), parses headers, and can route on path, method, host, JWT claims, cookies.

| Concern                                     | L4                                    | L7                                          |
| ------------------------------------------- | ------------------------------------- | ------------------------------------------- |
| Latency overhead                            | ~50–200 µs                            | ~0.5–3 ms                                   |
| TLS termination                             | Pass-through or terminate-then-tunnel | Terminate, inspect, re-encrypt optional     |
| Routing on path / header                    | No                                    | Yes                                         |
| Connection reuse / multiplexing             | No (single TCP stream per client)     | HTTP/2 stream-level routing                 |
| Stateful protocols (Postgres, Redis, Kafka) | Yes (the only correct answer)         | Catastrophic                                |
| WebSockets                                  | Yes (transparent)                     | Yes (after upgrade)                         |
| Health-check granularity                    | TCP open + optional script            | HTTP probe per backend with body assertions |
| Cost (CPU)                                  | Very low                              | Moderate (TLS + parsing)                    |

### Decision rules

1. **Anything that isn't HTTP → L4.** Postgres replication, Kafka client traffic, Redis cluster gossip, custom gRPC-over-TLS streams that the gateway shouldn't inspect.
2. **Public North-South API traffic → L7** so we get path-based routing, per-tenant rate limit, JWT validation at the edge.
3. **TLS pass-through for backends that need mTLS to clients** → L4. The backend handles its own certs.
4. **HTTP/3 → L7 with UDP/443 exposed.** Traefik v3 supports this natively.

The cluster runs **both layers**:

```
                  ┌──────────────────────────────┐
                  │  Public IP (VIP)             │
                  │  via MetalLB / Cilium LB-IPAM│
                  └──────────────┬───────────────┘
                                 │
                     ┌───────────┴───────────┐
                     │     L4 LoadBalancer   │  (kube-proxy / Cilium DSR)
                     └───────────┬───────────┘
                                 │
                  ┌──────────────┼──────────────┐
                  ▼              ▼              ▼
        ┌─────────────────┐ ┌────────┐ ┌─────────────────┐
        │  L7 gateway     │ │ Kafka  │ │  Postgres LB    │
        │  (Envoy / Traefik)│ │ Service│ │  (HAProxy peer)│
        └────────┬────────┘ └────────┘ └─────────────────┘
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
   Service A           Service B
```

The public VIP terminates at an **L4 LB** (MetalLB Layer-2 or BGP), which forwards by 5-tuple to the L7 gateway pods. The L7 gateway then does HTTP-aware routing. Non-HTTP services (Kafka brokers, Postgres replicas served externally for DR replication) get their own VIPs from the same IP pool but skip the L7 hop.

## MetalLB — bare-metal LB for K8s

[MetalLB](https://metallb.universe.tf/concepts/) is the de-facto standard for bare-metal `type: LoadBalancer` services. Two modes:

### Layer-2 mode

- One node holds the VIP at a time; ARP/NDP announces it.
- Failover is fast (~10 s) but throughput is bound to a single node's NIC.
- No external networking config needed — works anywhere ARP works.
- **Default for the prod-smallest profile**.

```yaml
# infra/k8s/metallb/ipaddresspool.yaml
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: edge-pool
  namespace: metallb-system
spec:
  addresses:
    - 10.50.255.200-10.50.255.220 # WireGuard mesh-internal VIPs
    - 148.113.49.10-148.113.49.15 # OVH public range (negotiated)
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: edge-l2
  namespace: metallb-system
spec:
  ipAddressPools: [edge-pool]
  interfaces: [eth0]
```

### BGP mode

- VIPs are announced via BGP to upstream routers (or a software router).
- True ECMP across all nodes — multi-Gbps capable.
- Requires a BGP-speaking peer. Many on-prem setups (and OVH's vRack) support it.
- **Pivot here when we outgrow Layer-2** or when we need cross-rack VIPs.

```yaml
# infra/k8s/metallb/bgp.yaml
apiVersion: metallb.io/v1beta1
kind: BGPPeer
metadata: { name: top-of-rack, namespace: metallb-system }
spec:
  myASN: 64512
  peerASN: 64511
  peerAddress: 10.50.0.1
---
apiVersion: metallb.io/v1beta1
kind: BGPAdvertisement
metadata: { name: edge-bgp, namespace: metallb-system }
spec:
  ipAddressPools: [edge-pool]
```

## Cilium LoadBalancer mode

[Cilium LB-IPAM](https://docs.cilium.io/en/stable/network/lb-ipam/) gives MetalLB-equivalent functionality without a second controller — if you're already running Cilium as the CNI. Plus:

- **eBPF DSR (Direct Server Return)** — return packets bypass the LB, halving latency and load.
- **XDP acceleration** — line-rate L4 with kernel-bypass.
- **kube-proxy-free** mode replaces iptables entirely with eBPF ([docs](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/)).
- BGP control plane built-in (`CiliumBGPPeeringPolicy`).

```yaml
# infra/k8s/cilium/lb-ipam.yaml
apiVersion: cilium.io/v2alpha1
kind: CiliumLoadBalancerIPPool
metadata:
  name: edge-pool
spec:
  blocks:
    - cidr: 10.50.255.0/26
  serviceSelector:
    matchLabels:
      lb-pool: edge
```

**When to pick Cilium over MetalLB**

- CNI is already Cilium → use Cilium LB-IPAM, drop MetalLB. Two controllers competing for VIPs is bad.
- You need eBPF observability (Hubble) tied to LB decisions.
- You need encrypted node-to-node (WireGuard via Cilium) and want LB in the same data plane.

**When to stick with MetalLB**

- CNI is Calico, Flannel, or Antrea.
- You don't want a new CNI for the LB story alone.
- A team member already operates MetalLB.

This project's clusters today run **Calico (`vxlan-mode`)**, so **MetalLB is the default**. Migrating to Cilium is a separate ADR.

## Cloud-native LBs (Azure / AWS / GCP)

For completeness — out of scope for the small footprint, in scope when we run on a managed K8s:

- **Azure LB / AKS LoadBalancer Service** — Standard SKU is L4; Azure Application Gateway is L7. Backed by NIC IP configs; provisioning is slow (~3-5 min). [Azure LB overview](https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-overview).
- **AWS NLB** — L4 only, very fast, EIP per AZ. Pair with ALB or our own L7. [AWS NLB intro](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html).
- **GCP NLB** — Network Load Balancer with backend service; Global vs Regional matters. The L7 equivalent is Application Load Balancer.

**Rule**: in managed K8s the CCM provisions cloud LBs for `type: LoadBalancer` services. No MetalLB. The L7 gateway sits behind the cloud L4 LB; HTTPS terminates at the L7. We pin Service annotations per cloud (e.g., `service.beta.kubernetes.io/aws-load-balancer-type: "nlb"`).

## HAProxy as a fallback / DMZ option

HAProxy is the most flexible software LB in existence. We don't use it inside K8s (kube-proxy + L7 gateway covers it) but it is **the right tool** outside K8s in two cases:

1. **DMZ at the edge of a colo** — a pair of HAProxy boxes on dedicated hardware terminating TLS, doing rate-limiting and IP filtering, then forwarding to the K8s `type: LoadBalancer` VIP. Useful when you want the L4 router on hardware you control rather than a public cloud's LB.
2. **Postgres connection routing** — HAProxy reading Patroni's REST `/master` endpoint to route writes to the leader. This is the standard Patroni HA pattern.

```cfg
# /etc/haproxy/haproxy.cfg — Patroni fronting
global
    log /dev/log local0
    maxconn 4096

defaults
    mode tcp
    timeout connect 5s
    timeout client  1h
    timeout server  1h

listen postgres-write
    bind *:5432
    option httpchk OPTIONS /master
    http-check expect status 200
    default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
    server pg-1 pg-1:5432 maxconn 200 check port 8008
    server pg-2 pg-2:5432 maxconn 200 check port 8008 backup
    server pg-3 pg-3:5432 maxconn 200 check port 8008 backup

listen postgres-read
    bind *:5433
    option httpchk OPTIONS /replica
    http-check expect status 200
    balance leastconn
    default-server inter 3s fall 3 rise 2
    server pg-1 pg-1:5432 maxconn 200 check port 8008
    server pg-2 pg-2:5432 maxconn 200 check port 8008
    server pg-3 pg-3:5432 maxconn 200 check port 8008
```

That config exposes a write VIP (always the Patroni leader) and a read VIP (round-robin across followers). The L7 API gateway never sees Postgres traffic.

See [HAProxy configuration tutorials](https://www.haproxy.com/documentation/haproxy-configuration-tutorials/) for the full reference.

## Failover / HA topology

For the prod-smallest profile:

```
              ┌──────────────────────────────────────┐
              │  Cloudflare DNS                      │
              │   A api.example.com → 148.113.49.10  │  (proxied)
              └────────────────────────┬─────────────┘
                                       │
                          ┌────────────▼───────────┐
                          │   MetalLB VIP          │   (L2 announce)
                          │   148.113.49.10        │
                          └──┬──────────────────┬──┘
                             │                  │
                ┌────────────▼──┐   ┌───────────▼────┐
                │  Node-1: edge │   │  Node-2: edge   │
                │  Envoy GW pod │   │  Envoy GW pod   │
                └───────────────┘   └─────────────────┘
                             │                  │
                          ┌──▼──────────────────▼──┐
                          │  K8s Services (ClusterIP)│
                          │  api / worker / ...      │
                          └──────────────────────────┘
```

- **VIP** announced by MetalLB on whichever node holds the lease. If that node dies, MetalLB moves the VIP to a peer in < 10 seconds.
- **Envoy Gateway** runs ≥ 2 replicas with PodAntiAffinity so they land on different nodes. Pod failure is transparent (the VIP holder forwards to the other replica via kube-proxy/IPVS).
- **Cloudflare** in front gives us DDoS sponge + a global anycast IP, so the MetalLB VIP can be a private-ish IP exposed only to Cloudflare's IP ranges if we want to harden further.

### Health-check chain

| Layer             | What checks                                                    | Action on failure                              |
| ----------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| Cloudflare        | TCP + HTTP health check to VIP                                 | Stop routing to origin; serve maintenance page |
| MetalLB (L2)      | Speaker liveness                                               | Re-elect leader, move VIP                      |
| Envoy GW Service  | kubelet readiness probe on Envoy admin :19000                  | Remove pod from endpoints                      |
| HTTPRoute backend | Per-backend HTTP probe configured on `BackendTLSPolicy`        | Remove backend from load-balancing pool        |
| Application       | `/healthz` (liveness) + `/readyz` (readiness, checks DB/Kafka) | kubelet restarts pod                           |

The probes layer cleanly: each layer's failure surface is bounded.

## Recommendation

For **prod-smallest** and any bare-metal K8s in this template:

1. **MetalLB in Layer-2 mode** for the public VIP — simple, no upstream BGP needed.
2. **Envoy Gateway** behind the VIP as the L7 — see `api-gateway-alternatives.md`.
3. **HAProxy** outside K8s for Patroni-backed Postgres routing (one per data-plane node).
4. **Cilium LB + kube-proxy-free** is the migration target once we adopt Cilium as the CNI; defer until then.

For **cloud K8s**:

1. **Cloud L4 LB** (NLB / Azure LB Standard / GCP NLB) provisioned by the CCM.
2. **Envoy Gateway** behind it.
3. No MetalLB, no HAProxy.

## Network policies

L4 and L7 are necessary but not sufficient — every Service is also gated by a **Kubernetes NetworkPolicy** (Calico/Cilium-enforced). The pattern is "default-deny in the namespace, allow specific ingress from the gateway namespace." This is captured in the platform repo, but worth restating: an L7 gateway with WAF doesn't help if a pod can bypass it via in-cluster DNS.

## Capacity planning thumb-rules

- MetalLB L2: bound by the single-node NIC. For 1 Gbps NIC, ~80k pps small packets, ~120 MB/s payload.
- Envoy Gateway pod: ~20k rps per vCPU at 8 KB responses; tune `connection_buffer_limit_bytes` for streaming.
- HAProxy on a 4-core node: ~150k rps L4, ~80k rps L7-TLS.
- We size each pod's CPU limit to leave 30% headroom for traffic spikes.

## Open questions

- BGP from MetalLB into OVH vRack — feasible? Awaiting OVH support confirmation.
- Cilium + Calico coexistence during migration is officially unsupported; need a plan.
- Should we run **Keepalived** for the HAProxy pair on bare metal, or rely on DNS failover (TTL 30 s)? Keepalived gives sub-second failover but adds a moving part.
