# `@internal/cli` — The `repo` CLI

> Per-package agent guide. Overrides parent AGENTS.md for files inside this package.

## What this is

`repo` is the single CLI entry point for every developer workflow in this monorepo — scaffolding, config rendering, dev-stack lifecycle, DB migrations, lint/test/build, releases, deps hygiene, doctor checks. It is **not** the place for business logic.

It's built on [citty](https://github.com/unjs/citty) (UnJS) for tree-shake-friendly command composition, and shells out to `pnpm`, `nx`, `docker compose`, and `atlas` for the actual work.

## How to add a new command

1. Create `src/commands/<command>.ts` (or, for nested groups, `src/commands/<group>/<sub>.ts`).
2. Export a `defineCommand({...})` object from citty.
3. Wire it into the parent group:
   - Top-level: add to the `subCommands` map in `src/cli.ts`.
   - Subcommand: add to the parent group's `subCommands` map (e.g. `src/commands/dev.ts`).
4. Update the `TOP` / `SUBS` constants in `src/commands/completion.ts` so bash/zsh completion picks up the new verb.
5. Add a test under `src/__tests__/` for any logic that isn't a thin shell-out.

## Output protocol

Every command MUST funnel its result through `emit({ status, message, data? })` from `src/utils/output.ts`. This gives every command a free `--json` mode (for agents) without per-command boilerplate. Direct `console.log` is only allowed inside `logRaw()`, which is itself a no-op in JSON mode.

## Shelling out

Use `run(bin, args, opts?)` from `src/utils/run.ts` — it inherits stdio and resolves cwd to the repo root. If you need to short-circuit on failure, use `fail()` from `src/utils/output.ts` (which respects JSON mode and emits a structured error before `process.exit(1)`).

## Templates

Scaffolding commands (`repo new ...`) read from `internal/templates/<kind>/`. Add a new template by:

1. Create `internal/templates/<kind>/` with files containing `{{placeholder}}` tokens.
2. Drive it from a `repo new <kind>` command using `renderTemplate(src, dest, vars)`.

Supported placeholders are anything you pass into the `vars` object — there is no implicit set. Filenames may also contain placeholders.

## Hard rules

- **No business logic.** If you find yourself writing domain code in here, it belongs in `packages/*` or `apps/*` instead.
- **Tree-shake-friendly.** Lazy-import command implementations only when the user invokes them; never load all of `apps/*` just to print help.
- **Idempotent where possible.** `dev up` should be safe to call when the stack is already up; `db migrate` should no-op if nothing pending.
- **Destructive commands MUST prompt** (or accept `--yes`). See `dev reset` and `clean` for the pattern.

## Building

```bash
pnpm --filter @internal/cli build      # tsdown -> dist/cli.mjs
pnpm --filter @internal/cli dev <cmd>  # tsx-mode for fast iteration
```

The root `package.json` exposes `"bin": { "repo": "./internal/cli/dist/cli.mjs" }`, so after `pnpm install` you can call `repo` from anywhere in the repo via `pnpm exec repo`.
