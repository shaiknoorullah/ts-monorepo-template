# SETUP

Founder-facing onboarding doc. Five steps from a clean clone to a running stack.

## 1. Install Nix + direnv

**macOS / Linux (paste-friendly):**

```sh
# Nix via Determinate installer
curl -fsSL https://install.determinate.systems/nix | sh -s -- install --no-confirm
# direnv
nix profile install nixpkgs#direnv
# hook for bash
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
# or zsh
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
```

## 2. direnv allow + first task install

```sh
git clone <this-repo>
cd <this-repo>
direnv allow
task install
```

If `task` is not yet on PATH, `make install` delegates to it once Nix is available.

## 3. task profile:select

Pick one of the 5 profiles. The CLI writes `.profile` and re-sources devenv.

```sh
task profile:list
task profile:select   # interactive
```

## 4. task secrets:bootstrap

Only needed for the `team` profile (shared AKV-backed secrets). Solo / hobby skips this entirely.

```sh
task secrets:check        # always safe
task secrets:bootstrap    # interactive — pull/push to AKV
```

## 5. task dev

```sh
task dev          # Nx run-many target=dev across the active profile
task test         # affected tests
task lint         # affected lint
```

## Remediations

Numbered fixes for the failure modes `task install` can hit. The launcher CLI surfaces these by ID when a step fails.

R1. `direnv: command not found` — install via `nix profile install nixpkgs#direnv` and re-hook your shell as in Section 1.

R2. `task: command not found` — enter the devenv shell first (`devenv shell`) or install via `nix profile install nixpkgs#go-task`.

R3. `secretspec: missing required secret <NAME>` — for `p-solo`/`p-hobby` add to your OS keyring; for `team` profile run `task secrets:bootstrap`.

R4. `pnpm install failed` — confirm Node 22 LTS via `node -v`; re-enter the devenv shell so corepack pnpm resolves.

R5. `commitlint: subject must be sentence-case` — let `task commit` retry up to 3 times, or edit manually.

R6. `env:check failed` — run `task env:reconcile` and update `secretspec.toml` per the generated report.
