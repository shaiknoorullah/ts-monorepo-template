---
title: Redis Cluster — 3 master + 3 replica
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - 'https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/'
  - 'https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/'
  - 'https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/'
  - 'https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/'
  - 'https://redis.io/docs/latest/develop/reference/eviction/'
  - 'https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/'
  - 'https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/'
---

# Redis Cluster — 3 master + 3 replica

## Cluster vs Sentinel — pick Cluster

Redis offers two HA topologies:

- **Sentinel**: 1 primary + N replicas + a Sentinel quorum that promotes a replica on primary failure. The dataset is _fully replicated_ on every node. Capacity is bounded by a single node's memory.
- **Cluster** (sharded): The keyspace is partitioned into 16,384 **hash slots**, each owned by one master. Replicas back individual masters. Capacity scales horizontally.

For any production workload that might exceed a single host's memory (rare in caches, common in feature flags / session stores / queue-backed workers), **Cluster** is the right choice. It is also the recommended topology for new deployments per the [Redis cluster spec](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/). Sentinel is fine if you are certain the keyspace fits in one machine _forever_; in that case it is operationally simpler. The template defaults to Cluster.

## Minimum production topology — 3 + 3

Three masters is the floor: with two masters, a single failure leaves the cluster with no quorum-majority and writes halt. Three masters give a 2-of-3 quorum that survives one failure. Each master needs at least one replica, so the production floor is **3 masters + 3 replicas = 6 nodes**. Place them on at least 3 hosts (one master + one replica per host) so a host failure loses at most one master (which is then promoted from its on-other-host replica).

For multi-AZ, deploy across 3 AZs, one master + one replica per AZ, with `cluster-replica-no-failover no` so any replica is allowed to promote. Cross-AZ replication adds latency; for cache workloads this is fine, for write-heavy workloads this is a design constraint.

## Hash slot distribution

The 16,384 slots are divided as evenly as possible across masters. With 3 masters that's 5,461 / 5,461 / 5,462 by default. Slots can be reshared with `redis-cli --cluster reshard` for rebalancing. Keys are placed by `CRC16(key) mod 16384` — to keep related keys in one slot (e.g., for a multi-key `MGET` or transaction), use **hash tags**: `{user:123}:profile`, `{user:123}:sessions` all hash on `user:123` and land in the same slot.

Multi-key operations across slots are not supported. Workloads that need them must rethink keying or use scripts run on a specific node.

## Eviction policy

Redis evicts when `maxmemory` is reached. Policies:

| Policy         | When to use                                                                                |
| -------------- | ------------------------------------------------------------------------------------------ |
| `noeviction`   | Persistent store, errors on OOM. Never for caches.                                         |
| `allkeys-lru`  | Pure cache, all keys can be evicted. Recommended for caches.                               |
| `volatile-lru` | Mixed dataset, only TTL'd keys evictable. Recommended for cache-with-some-persistent-keys. |
| `allkeys-lfu`  | Cache with stable hot set, frequency matters more than recency.                            |
| `volatile-ttl` | Evict by shortest TTL. Niche.                                                              |

Set explicitly per service. A misconfigured `noeviction` cache is a queue of OOM errors waiting to happen. See the [eviction docs](https://redis.io/docs/latest/develop/reference/eviction/).

## Persistence — AOF every-second + RDB hourly

Cluster persistence has two mechanisms that compose:

- **RDB** (snapshot): periodic full dump of the dataset to disk. Fast restart, smaller files, but loses everything since the last snapshot on crash.
- **AOF** (append-only file): logs every write. Survives a crash with at most 1 second of loss (with `appendfsync everysec`).

Production default: **both enabled**. RDB for fast restart and offsite backup, AOF for crash-recovery durability. Trade-off: AOF doubles disk I/O. For pure caches where loss-on-crash is acceptable, disable both and use a faster cold start.

```conf
# redis.conf (per node)
maxmemory 4gb
maxmemory-policy allkeys-lru

# RDB
save 3600 1            # snapshot if at least 1 key changed in 1h
save 300 100           # ...or 100 keys in 5m
dbfilename dump.rdb
dir /data

# AOF
appendonly yes
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Cluster
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
cluster-require-full-coverage no    # serve queries for available slots on partial failure
cluster-replica-no-failover no
cluster-allow-reads-when-down no
```

`cluster-require-full-coverage no` is important. With the default `yes`, _any_ slot down halts _all_ writes; setting it to `no` keeps available slots writable while the cluster recovers — usually what you want for a cache, sometimes not what you want for a session store.

## TLS + ACL

TLS termination at the Redis side (not at a proxy):

```conf
port 0                              # disable plaintext
tls-port 6379
tls-cert-file /tls/redis.crt
tls-key-file /tls/redis.key
tls-ca-cert-file /tls/ca.crt
tls-auth-clients yes                # mutual TLS
tls-cluster yes                     # encrypt cluster bus too
```

ACLs (RBAC) per the [ACL docs](https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/):

```
# users.acl
user default off
user app on >app-strong-password ~app:* +@read +@write +@connection -@dangerous
user readonly on >readonly-password ~* +@read +@connection
user admin on >admin-password ~* +@all
```

Then `aclfile /etc/redis/users.acl` in `redis.conf`. The `default` user is disabled; clients must authenticate with explicit users. `+@read +@write -@dangerous` keeps the app from running `FLUSHDB`, `SHUTDOWN`, `DEBUG`, etc.

## docker-compose recipe

`docker/redis-cluster.compose.yml` runs a 6-node Redis Cluster on a single host (for dev). Each node is a separate container with its own data volume. A one-shot `cluster-init` container runs `redis-cli --cluster create` after all 6 are up. In production this same topology is deployed across hosts via either the [Redis Operator](https://github.com/spotahome/redis-operator) on Kubernetes or the cluster-init pattern via Ansible.

Connect from clients with `redis://redis-1:6379,redis-2:6379,redis-3:6379` — any cluster-aware client (ioredis, lettuce, go-redis) discovers the topology on first connect.

## Scaling beyond 3 masters

Add a master:

```bash
# Add new node (initially empty, no slots)
redis-cli --cluster add-node redis-7:6379 redis-1:6379

# Reshare ~1/Nth of slots from existing masters to the new one
redis-cli --cluster reshard redis-1:6379 --cluster-from all \
  --cluster-to <new-node-id> --cluster-slots 4096 --cluster-yes

# Add a replica for it
redis-cli --cluster add-node redis-7-replica:6379 redis-1:6379 \
  --cluster-slave --cluster-master-id <new-node-id>
```

Triggers to scale 3 → 5 → 7 masters:

- Memory usage > 75 % on any master for a sustained period.
- p99 latency > 5 ms (CPU saturation per node).
- Network throughput approaching NIC limit per node.

## References

- Redis Cluster spec — https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/
- Scaling guide — https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/
- Persistence — https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
- ACLs — https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/
- Eviction reference — https://redis.io/docs/latest/develop/reference/eviction/
- Sentinel (for context) — https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/
- Install — https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/
