# `repo` — monorepo developer CLI

Single entry point for everything a developer does in this monorepo **except**
writing business logic.

```
repo <command> [subcommand] [args] [--json]
```

The `--json` flag works on every command and emits machine-readable JSON
(useful for agents and scripts).

## Commands

| Command                               | What it does                                                                            |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| `repo new app <name>`                 | Scaffold `apps/<name>/` from the app template.                                          |
| `repo new package <name>`             | Scaffold `packages/<name>/` from the package template.                                  |
| `repo new adr <title>`                | Scaffold `docs/adrs/<NNNN>-<slug>.md`.                                                  |
| `repo new changeset`                  | Run `pnpm changeset add`.                                                               |
| `repo new workflow <name>`            | Scaffold `.github/workflows/<name>.yml`.                                                |
| `repo new runbook <name>`             | Scaffold `docs/runbooks/<name>.md`.                                                     |
| `repo env render <env>`               | Render `config/<env>.yaml` -> `docker/.env.rendered`. Refuses if SecretRefs unresolved. |
| `repo env validate <env>`             | Validate `config/<env>.yaml` against the Zod schema.                                    |
| `repo env show <env>`                 | Pretty-print merged config (secrets redacted).                                          |
| `repo dev up`                         | `docker compose -f docker/compose.dev.yml up -d`.                                       |
| `repo dev down`                       | Stop dev stack (keep volumes).                                                          |
| `repo dev tools`                      | Start dev stack + admin UIs (`--profile tools`).                                        |
| `repo dev logs <svc>`                 | Tail logs for a compose service.                                                        |
| `repo dev reset`                      | Destructive — drop volumes + restart (prompts; `--yes` to skip).                        |
| `repo db migrate [--env dev]`         | `atlas migrate apply`.                                                                  |
| `repo db status`                      | `atlas migrate status`.                                                                 |
| `repo db diff <name>`                 | `atlas migrate diff <name>`.                                                            |
| `repo db seed`                        | `pnpm -w run seed`.                                                                     |
| `repo db psql [<db>]`                 | Exec into psql on the dev container.                                                    |
| `repo deps check`                     | syncpack + knip + manypkg + attw + publint + type-coverage.                             |
| `repo deps sync`                      | `syncpack fix-mismatches && syncpack format`.                                           |
| `repo deps audit`                     | `pnpm audit` + `osv-scanner` (if available).                                            |
| `repo lint [--fix]`                   | ESLint + Prettier --check + markdownlint + cspell.                                      |
| `repo format`                         | eslint --fix + prettier --write.                                                        |
| `repo test [--affected] [--coverage]` | Vitest via Nx.                                                                          |
| `repo build [--affected]`             | tsdown across packages.                                                                 |
| `repo type-check`                     | `tsc -b` across project references.                                                     |
| `repo release version`                | `pnpm changeset version`.                                                               |
| `repo release publish`                | `pnpm changeset publish`.                                                               |
| `repo ci`                             | Run the same gate CI runs (lint + type-check + test + build + dead + deps + manypkg).   |
| `repo doctor`                         | Health check — node/pnpm versions, lockfile, deps installed, configs present.           |
| `repo clean`                          | nx reset + reinstall (prompts; `--yes` to skip).                                        |
| `repo version`                        | Print repo + manifest versions.                                                         |
| `repo completion bash\|zsh`           | Emit shell completion script.                                                           |

## Agent-friendly `--json` mode

```bash
$ repo doctor --json
{
  "status": "ok",
  "message": "8 checks · 0 error · 0 warning",
  "data": { "checks": [...] }
}
```

## Bash / zsh completion

```bash
# bash
echo 'source <(repo completion bash)' >> ~/.bashrc

# zsh
echo 'source <(repo completion zsh)' >> ~/.zshrc
```

## Quick-start

```bash
pnpm install
repo doctor                # verify your local env
repo dev up                # bring up postgres / redis / kafka
repo env render dev        # produce docker/.env.rendered
repo test                  # vitest
repo new package timing    # scaffold packages/timing/
```

## Extending

See [`AGENTS.md`](./AGENTS.md) for how to add new commands and templates.
