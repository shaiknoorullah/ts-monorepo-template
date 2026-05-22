# ADR-0007: `repo` CLI as the developer interface

- **Status:** Accepted
- **Date:** 2026-05-22
- **Deciders:** @shaiknoorullah

## Context

Developer workflows in this monorepo were exposed exclusively through npm scripts in the root `package.json` (`pnpm dev`, `pnpm doctor`, `pnpm changeset`, ...). Three issues:

1. **Discoverability.** `pnpm run` dumps 20+ scripts with no grouping. New contributors don't know where to start.
2. **Composition.** Scripts that combine other scripts (e.g. `doctor`, `ci`) are bash chains with brittle quoting and no `--json` mode for agents.
3. **Scaffolding gap.** Creating a new package or ADR required either copy-pasting an existing one (drift risk) or hunting for a generator. Both are error-prone.
4. **Agent ergonomics.** LLM agents need structured output. Parsing pnpm/nx mixed stdout reliably is annoying.

## Decision

Introduce **`repo`** — a single CLI under `internal/cli/` built on [citty](https://github.com/unjs/citty) — as the developer interface for everything in this monorepo **except writing business logic**.

```
repo <command> [subcommand] [args] [--json]
```

Commands group into:

- `repo new ...` — scaffolding (app, package, adr, changeset, workflow, runbook).
- `repo env ...` — YAML config render / validate / show (the integration point with ADR-0006).
- `repo dev ...` — docker-compose lifecycle (up/down/tools/logs/reset).
- `repo db ...` — atlas migrations + psql.
- `repo deps ...` — syncpack + knip + manypkg + attw + publint + type-coverage.
- `repo release ...` — changesets flow.
- `repo lint | format | test | build | type-check | ci | doctor | clean | version` — top-level wrappers.

### Why citty

- UnJS family (matches `c12` from ADR-0006, plus `defu`, `ohash`, `consola`).
- Tree-shake-friendly: only the invoked subcommand's code is paid for at runtime.
- Declarative `defineCommand({...})` — easy for agents to extend (see `internal/cli/AGENTS.md`).
- No prompts unless we ask for them — `prompts` is opt-in per command.

### Boundary

The CLI **manages workflows**. It does not implement domain logic. Anything an app does at runtime stays in `apps/*`; anything reused across apps stays in `packages/*`. The CLI itself is `private: true` and is never published.

### Templating

`repo new ...` reads from `internal/templates/<kind>/` — directories of files where both filenames and contents may contain `{{placeholder}}` tokens. The renderer is a 60-line regex replacement (no Handlebars, no Mustache) — deliberately minimal so agents can read and modify it without context-pollution.

### Agent-friendliness

Every command accepts `--json` and routes its result through a single `emit({ status, message, data? })` helper. Output shape:

```json
{
  "status": "ok|warning|error",
  "message": "human-readable summary",
  "data": { "key": "value" }
}
```

This makes the CLI safe to call from any agent that can spawn processes — no per-command parser needed.

## Consequences

### Positive

- One verb (`repo`) for the whole repo. `repo --help` is the entry point new contributors see.
- New commands slot in without touching root `package.json`.
- `--json` mode enables agent automation without screen-scraping pnpm output.
- Templates centralise the "shape of a new package/app/adr" — drift becomes a diff against `internal/templates/`.

### Negative

- One more layer between dev and the actual tool (nx, pnpm, docker). Mitigated: every command is a thin shell-out, and `--help` shows what runs.
- The CLI must be built (`pnpm --filter @internal/cli build`) before it's globally callable. Mitigated: `pnpm install` runs the workspace build via Nx caching, and `tsx` runs it in dev mode.

### Neutral / Follow-up

- Root `package.json` scripts are retained as-is for backward compatibility. The CLI calls them under the hood.
- Bash + zsh completion shipped via `repo completion bash|zsh` — manually maintained command list (small enough that drift is obvious in code review).

## Alternatives considered

- **npm scripts only.** Rejected — no composition, no `--json`, no scaffolding.
- **commander / yargs.** Rejected — both work, but heavier and outside the UnJS ecosystem we picked for ADR-0006.
- **oclif.** Rejected — strong CLI conventions but the framework owns the project layout in a way that conflicts with our monorepo structure.
- **Custom shell scripts (`bin/`).** Rejected — losing TypeScript, losing `--json`, losing prompt UX, losing tests.

## References

- [citty](https://github.com/unjs/citty)
- `internal/cli/AGENTS.md` for the contributor / agent guide.
- `internal/cli/README.md` for the user-facing command reference.
- ADR-0006 — config hierarchy that this CLI integrates with via `repo env`.
