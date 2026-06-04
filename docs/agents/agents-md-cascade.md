# AGENTS.md cascade — resolution rules

Authoritative source: spec [Section 15.8](../superpowers/specs/2026-06-03-platform-foundation-design.md). Reference convention: <https://agents.md/>.

## The 6 levels

| Level    | File                   | Scope                                          |
| -------- | ---------------------- | ---------------------------------------------- |
| Root     | `AGENTS.md`            | Founder-safe verbs, project rules, never-do    |
| Apps     | `apps/AGENTS.md`       | App-build conventions                          |
| Per-app  | `apps/<svc>/AGENTS.md` | Architecture invariants, common tasks          |
| Packages | `packages/AGENTS.md`   | Library conventions                            |
| Internal | `internal/AGENTS.md`   | Schemas, error catalog, glossary editing rules |
| Infra    | `infra/AGENTS.md`      | Helm / Crossplane / Terraform conventions      |
| Profiles | `profiles/AGENTS.md`   | Profile authoring rules                        |

## Resolution rule

Agents reading directory `D` MUST resolve `AGENTS.md` by walking
`D -> parent -> ... -> repo root` and merging shallow, child-wins. Same
rule as `META.yaml`.

## Pseudocode

```text
function resolveAgentsMd(dir):
  chain = []
  while dir != repoRoot.parent:
    if exists(dir + "/AGENTS.md"):
      chain.unshift(read(dir + "/AGENTS.md"))
    dir = parent(dir)
  return shallowMerge(chain)  // last (= deepest) wins per top-level key
```

## What "child-wins" means in markdown

Sections with identical `## ` headings: the deeper file's section replaces
the shallower one wholesale. Sections present only in the shallower file
are inherited unchanged.

## How agents pick up new cascade entries

The cascade is filesystem-driven; no registry. To add a per-app override:

1. Create `apps/<svc>/AGENTS.md`.
2. Follow the per-app template in [`apps/AGENTS.md`](../../apps/AGENTS.md).
3. The next agent that resolves the cascade from inside that app picks it up.

## CI gate

`tests/docs/agents-cascade.test.ts` enforces:

- All 6 cascade levels exist.
- Root `AGENTS.md` names every layer 0a, 0b, 1-7.
- Each sibling level contains its scope-specific content.

If you add a 7th cascade level (uncommon), update the test fixture +
documentation in the same PR.
