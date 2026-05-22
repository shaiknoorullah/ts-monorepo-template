# Changesets

Changesets describe semver-meaningful changes to packages in this monorepo. Every PR that affects a published package should contain one.

## TL;DR

```bash
pnpm changeset
```

The CLI walks you through:

1. **Which packages changed?** (Space to select; arrows to navigate.)
2. **What kind of bump?** `major` / `minor` / `patch` per package.
3. **Summary** — what changed, from a user's perspective.

This writes a markdown file under `.changeset/`. Commit it with your code. CI's `release.yml` consumes these files when merging to `main`.

## Independent versioning

This repo uses **independent versioning** — `fixed: []` and `linked: []` in `config.json`. Every package moves on its own SemVer track. Internal dependencies bump via `updateInternalDependencies: "patch"`.

Apps in `apps/*` (`@app/api-gateway`, `@app/worker`) are listed under `ignore` because they ship as containers, not as npm packages.

## Empty/skip changesets

For changes that legitimately do not need a release (docs typos, internal refactors with no observable behavior change), open an empty changeset:

```bash
pnpm changeset --empty
```

The CI gate accepts an empty changeset or a `no-changeset` PR label.

## See also

- [`@changesets/cli` docs](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
- Repo guide: [`CONTRIBUTING.md`](../CONTRIBUTING.md#releasing)
