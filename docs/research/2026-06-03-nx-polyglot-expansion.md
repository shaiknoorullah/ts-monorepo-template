---
title: Nx polyglot expansion research
date: 2026-06-03
status: research output (advisory; not yet folded into spec/plan)
authors: claude-opus-4-7 via 5 teams of Feynman research agents (20 angle + 5 synthesis = 25 agents)
audience:
  - Audience 1 — founders evaluating which languages/frameworks the template should bundle
  - Audience 2 — AI agents reasoning about Nx language coverage
spec_reference: docs/superpowers/specs/2026-06-03-platform-foundation-design.md
plan_reference: docs/superpowers/plans/2026-06-03-platform-foundation.md
---

# Nx polyglot expansion research — .NET / C / C++ / Tauri / React Native / Expo

> Five teams of Feynman-style research agents surveyed the 2026 state of Nx
> support for .NET, C/C++, Tauri (desktop), React Native (bare), and Expo
> (managed + EAS). Each team ran four angle agents (plugin landscape, dev
> experience, production readiness, recommendation) plus one synthesizer.

## TL;DR — verdict table

| #   | Target                    | Verdict                  | Fit / 100 | Default profile bundles                              |
| --- | ------------------------- | ------------------------ | --------- | ---------------------------------------------------- |
| 1   | Nx + .NET / C#            | `include-only-on-demand` | 42        | (none by default)                                    |
| 2   | Nx + C / C++              | `include-only-on-demand` | 22        | (none by default)                                    |
| 3   | Nx + Tauri (desktop)      | `include-only-on-demand` | 55        | (none by default)                                    |
| 4   | Nx + React Native (bare)  | `exclude`                | 22        | (n/a — recommended out)                              |
| 5   | Nx + Expo (managed + EAS) | `include-day-2`          | 72        | `p-startup-small`, `p-startup-scale`, `p-enterprise` |

**Single strong yes:** Expo — gets a Day-2 inclusion verdict and bundles into three profiles by default.

**Three "on demand" yeses:** .NET, C/C++, Tauri — each has a clear use case but doesn't justify Day-1 bundle weight. Ship as opt-in scaffolds via `task new:backend:dotnet`, `task new:lib:c`, `task new:desktop:tauri` so the launcher can offer them without forcing the template footprint.

**One no:** React Native bare. Strongly recommended out. Expo (#5) covers the same mobile surface with a cleaner DX, EAS handles iOS code signing without a Mac, and the bare-workflow's only advantage (deep native module access) is rare in greenfield startups.

---

## Cross-team recommendations (what to fold back)

These are my consolidations across the 5 team verdicts. The detailed per-team reasoning is below.

1. **Add `Expo` as a first-class frontend tier** in spec Section 12 alongside the existing TS/Go/Py/Rust backends. The template's `apps/mobile-{admin,customer}/` already exist; the Expo team validated the path. Bundle into `p-startup-small` and up. Day-2 milestone — separate PR after the foundation lands.

2. **Add scaffolds (not Day-1 bundles) for .NET, C/C++, Tauri.** Update spec Section 2.5 (`task` wrappers) to mention `task new:backend:dotnet` (uses `dotnet new webapi` underneath, with `@nx/dotnet` officially adopted), `task new:lib:c` (cmake-based stub), `task new:desktop:tauri` (Tauri 2.x project skeleton). Each scaffold opt-in via the launcher CLI's "advanced" branch.

3. **Replace React Native bare guidance with Expo guidance** in the spec. The existing mobile apps under `apps/mobile-*` should be reframed as Expo apps, not RN bare. This is a clean swap with no semantic change.

4. **Update Section 17 (non-goals)** to record:
   - We are NOT shipping a primary backend scaffold for C/C++. The template treats it as a "we ship native SDK + link to other services" use case only.
   - We are NOT shipping RN bare. Expo is the only mobile path. Anyone needing bare workflow can `expo prebuild --clean` from Expo into bare territory.

5. **Add `@nx/dotnet` as a documented escape hatch**, not a default plugin. The community `@nx-dotnet/core` (which our spec referenced indirectly) was archived on 2026-04-27; the official `@nx/dotnet` 22.7.5 is the only viable choice as of the workflow's research window (mid-2026).

6. **Tauri desktop:** worth tracking but no Day-1 changes to the spec. Add a single ADR (`docs/adrs/0014-desktop-track-via-tauri.md`) saying "if/when a desktop track is requested, it will be Tauri 2.x via `@nxext/tauri` or `nx:run-commands` wrapping `cargo tauri`, not Electron." The ADR locks the decision without committing implementation.

---

## Team 1 — Nx + .NET / C#

### Synthesized verdict

**Verdict:** `include-only-on-demand` | **Fit score:** 42 / 100 | **Default profile bundles:** _(none by default)_

**Reasoning:**

.NET on Nx in mid-2026 is a "yes, technically — no, by default" story. All four angle agents converged on the same load-bearing facts: the community `@nx-dotnet/core` plugin was archived on 2026-04-27, and Nrwl's official `@nx/dotnet` (currently 22.7.x, requires Nx 22, requires .NET SDK 8.0+ on PATH at graph-compute time) is the only viable choice for a new repo. That plugin is also explicitly labeled "experimental — APIs may change," ships only `init` and `ci-workflow` generators, deliberately drops the community plugin's `serve` / `format` / module-boundary features, and routes all project creation through the native `dotnet new <template>` CLI. Mechanically it is well-built (real MSBuild evaluation via a shipped `MsbuildAnalyzer.dll`, `--no-dependencies` injection so Nx owns the task graph, proper cache invalidation on `Directory.Build.props` etc.) — but the surface area is small, the documentation warns of API churn, and several known bugs (CS0006 cache portability nrwl/nx#33684, libhostfxr discovery on macOS/Linux, Aspire-aware `dotnet watch` only on .NET 11 SDK) are still in flight.

The audience mismatch is the bigger problem. ts-monorepo-template's stated primary audience is "startup founders / vibe-coders / junior engineers" plus AI agents. C# / .NET is overwhelmingly an enterprise / recruiter-driven language; the 2025 Stack Overflow survey reinforces what every YC batch already shows — founders pick TS + Python + Go, not C#. Forcing every contributor (including pure-JS frontend devs) to install .NET SDK 8.0+ just so `nx graph` works is a real tax on the smaller profiles. Until Nx ships lazy graph hydration (on the 2026 roadmap but not delivered), `NX_DOTNET_DISABLE=true` is the only escape hatch, and that defeats the point of including it.

There's also a strategic-overlap question that the recommendation angle flagged honestly: Microsoft Aspire 13 (Nov 2025) rebranded from ".NET Aspire" to just "Aspire," became polyglot (Python / JS / TS / Java / Go first-class), and added `aspire publish` for Docker Compose / K8s / Bicep. For a C#-first team, Aspire is the natural orchestrator Microsoft is pushing — Nx is not. The two coexist (the CommunityToolkit `AddNxApp()` helper exists), but the honest framing is "pick one." If a customer is bringing C# into ts-monorepo-template, they probably already have a non-C# polyglot need (otherwise they'd be on Aspire), which is exactly the Scaling-Startup / Production-at-Scale shape — not Solo / Hobby / Startup-Small.

Production-readiness is the angle where .NET shines hardest: `dotnet publish /t:PublishContainer` with multi-arch OCI index, chiseled Ubuntu base images, cosign keyless via GitHub OIDC, SLSA Build L2 via `actions/attest-build-provenance`. This is genuinely best-in-class. But none of it is wired into `@nx/dotnet` — there's no executor for publish/sign/push, you glue it in via `nx run-commands` + `gh actions`. So even the strong production story is "we'll write a recipe for you" not "the plugin handles it." A template add value precisely by being that opinionated recipe — which is doable, but only justifies inclusion as an opt-in lane, not a default.

Net: this is a defensible **first-class opt-in** for the two enterprise-leaning profiles where C# revenue actually lives. Default-on for Solo/Hobby/Startup-Small would tax every contributor with a .NET SDK requirement they don't want, and would ship a template feature whose underlying plugin is labeled experimental and missing the polish (no `serve`, no module boundaries, no app generator) that the deprecated community plugin had. Defer Aspire entirely to a documented opt-in recipe; targeting .NET 10 LTS (not .NET 9, which EOLs Nov 2026); and be loud in the docs about the Aspire-vs-Nx narrative so enterprise adopters choose with eyes open.

**Integration outline:**

1. Add a launcher CLI flag `--with-dotnet` (mutually compatible with all other `--with-*` flags). When set: pin `@nx/dotnet@~22.7.5` in `package.json` devDependencies and run `nx add @nx/dotnet` to register the plugin in `nx.json`.

2. Preflight check in launcher: detect `dotnet --list-sdks`. If missing or < 8.0, instruct user to install .NET 10 LTS via winget/brew/apt and abort. Document `NX_DOTNET_DISABLE=true` env var as escape hatch for JS-only contributors.

3. Commit `global.json` at repo root pinning `sdk.version: 10.0.100` with `rollForward: latestFeature` — this prevents preview-SDK silent-toolchain selection that bites every fresh contributor.

4. Scaffold one example app via `dotnet new webapi -o apps/dotnet-example` (NOT a custom generator — match the plugin's "native CLI first" philosophy). Add a README in `apps/dotnet-example/` explaining `nx watch dotnet-example -- run` (the new dev loop) replaces `nx serve` from the old community plugin.

5. Helm chart shape: add a `charts/dotnet-service/` template that consumes a multi-arch OCI image. Default `image.repository` points to a chiseled aspnet base (`mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled`). Include `livenessProbe` / `readinessProbe` wired to ASP.NET Core health checks endpoints by default.

6. Dockerfile template: NONE. Use `dotnet publish /t:PublishContainer /p:ContainerArchiveOutputPath=dist/oci/{projectName}.tar.gz /p:ContainerRuntimeIdentifiers="linux-x64;linux-arm64"` as the canonical container build — no Dockerfile, multi-arch via SDK-native OCI index. Wire this as an `nx run-commands` target named `containerize` on the example project.

7. CI scaffold: add `.github/workflows/dotnet-ci.yml` using `actions/setup-dotnet@v4` with matrix `{ubuntu-latest} × {10.0.x}` (skip windows/macos in the default — opt-in for desktop/MAUI lanes only). Wire `actions/attest-build-provenance` with `id-token: write` for SLSA L2 attestations and cosign keyless container signing via GitHub OIDC.

8. Crossplane XRD changes: NONE required. The .NET service ships as a normal OCI container; existing `XContainerService` XRD already covers it. Document that `apps/dotnet-example` consumes the same `XPostgresInstance` / `XRedisCache` claims as Node/Go services.

9. Profile values changes: add `dotnet: enabled: false` default in all 5 profile `values.yaml` files; flip to `true` only in `p-startup-scale` and `p-enterprise` example overlays. Solo / Hobby / Startup-Small profiles do NOT ship `@nx/dotnet` even as a transitive devDep — keep the install footprint zero for the founder audience.

10. Documentation: a single `docs/dotnet.md` that (a) explains the `dotnet new` workflow up front, (b) calls out the experimental status and pinned version, (c) lists known gotchas (CS0006 cache portability, libhostfxr on mac/linux, rude-edit hot reload), (d) documents Aspire as an explicit opt-in second-tier with the honest "Aspire vs Nx — pick one" framing, and (e) defers MAUI / desktop signing entirely to a separate recipe.

11. Aspire: do NOT bundle. Provide a documented opt-in recipe (`docs/recipes/aspire-apphost.md`) showing how to add an Aspire 13 AppHost project and the `CommunityToolkit.Aspire.Hosting.NodeJS.Extensions` `AddNxApp().WithPnpm()` integration for teams that want runtime orchestration. Note geo-restrictions of Azure Trusted Signing and that `aspire publish` to K8s/Helm is still preview in 13.3.

**Risks:**

- @nx/dotnet is officially labeled experimental in mid-2026 — API churn between 22.x patch versions has already happened once (serve→watch rename); template will need version-pinning discipline and a documented migration path for each plugin bump.
- Mandatory MSBuild-based graph inference requires .NET SDK 8.0+ on every contributor's PATH at `nx graph` time, including pure-JS frontend devs. Until Nx ships lazy graph hydration (roadmap, not delivered), this is a real onboarding tax that may push contributors to set `NX_DOTNET_DISABLE=true` and lose the cross-language graph entirely.
- Strategic overlap with Microsoft Aspire 13 (now polyglot, with `aspire publish` for K8s/Helm/Compose). Enterprise C#-first teams will reasonably ask 'do I need both?' — template must answer honestly or risk being seen as redundant for the exact audience that justifies inclusion.
- Remote cache portability bug (nrwl/nx#33684, CS0006 absolute-path metadata files) is fixed in newer Nx 22.x but older 22.x patches still hit it — template's pinned Nx version needs to be >= the fix or document the `obj` redirect workaround.
- Audience mismatch: C# is enterprise-driven and the template's stated primary audience is founders/vibe-coders/juniors. Default inclusion would bloat the install footprint (.NET SDK ~800MB) for users who will never write a `.csproj`.
- Azure Trusted Signing / Artifact Signing GA is geo-restricted to US/CA/EU/UK businesses — global solo developers can't use the recommended NuGet/MSIX signing path, breaking the 'works on day 1' promise unless template documents a paid SSL.com/DigiCert fallback.
- @nx/dotnet ships only `init` + `ci-workflow` generators; the community plugin's `app`/`lib`/`swagger` generators are gone. Users following pre-2026 tutorials will type commands that don't exist — heavy onboarding-doc burden falls on the template.
- .NET 9 is widely deployed in 2026 but EOL November 2026. Template must pin samples to .NET 10 LTS and be loud about not following 2025-era tutorials that target .NET 9, or it ships a soon-stale default.

### Angle: Plugin landscape + integration mechanics

Here's the .NET-on-Nx situation in mid-2026, in plain English.

For about four years, the only way to put C# / F# / VB.NET projects into an Nx monorepo was a community plugin called `@nx-dotnet/core`, written and maintained almost single-handedly by Craigory Coppola (AgentEnder). It worked — it parsed your `.csproj` files, built a project graph, and gave you generators like `nx g @nx-dotnet/core:app`. It hit ~25k weekly npm downloads, which is what real adoption looks like for a niche plugin.

Then on **October 23, 2025**, Nrwl shipped **Nx 22**, and the headline feature was an **official `@nx/dotnet` plugin**. They hired AgentEnder (his name is on the commits) and rebuilt the plugin from scratch under the `@nx/*` namespace. The community plugin's repo was **archived on April 27, 2026**. So by mid-2026 there is exactly one viable choice for a new template: `@nx/dotnet`.

What's clever about the new plugin is the mechanic. The Node-side TypeScript code is mostly glue. The real work happens in a shipped C# binary called `MsbuildAnalyzer.dll` that lives inside the npm package. When Nx asks "what projects are in this workspace?", the TS plugin spawns that .NET binary (via `child_process`), hands it the list of project files over stdin (to dodge ARG_MAX limits on big workspaces), and the binary runs MSBuild's actual evaluation engine — the same code Visual Studio uses — to figure out project references, target frameworks, and dependencies. It returns JSON. The TS layer caches the result, keyed by a hash of every project file plus `Directory.Build.props`, `Directory.Solution.targets`, etc. This is why Nrwl claims it's "more reliable than parsing csproj XML by hand" — they're not parsing; they're asking MSBuild.

The glob it watches is the long one: `**/{*.{csproj,fsproj,vbproj},Directory.Build.{props,targets,rsp},Directory.Solution.{props,targets},Directory.Packages.props}`. Notice `.vbproj` is included even though no one cares about VB. F# (`.fsproj`) is first-class.

For each detected project the analyzer infers a set of targets — `build`, `test`, `clean`, `restore`, `publish`, `pack`, `watch`, `run` — and figures out which apply (a class library gets `pack`, not `run`; a web app gets `run` and `watch`, not `pack`). All targets get `dependsOn: ["^build"]` and a hidden `--no-dependencies` flag is added to the underlying `dotnet build` call so Nx's task graph (not MSBuild's `<ProjectReference>` walker) does the topological ordering. That's the secret to getting real Nx caching: without it, `dotnet build` would helpfully recompile dependencies and blow your cache.

Generators are intentionally sparse: just `init` (drops the plugin into `nx.json`) and `ci-workflow` (emits a CI yaml). There is no `nx g @nx/dotnet:app`. The official answer is: **use `dotnet new webapi -o apps/my-api`**, then Nx picks it up on next graph refresh. This is a deliberate "native CLI first" stance — they don't want to wrap every `dotnet new` template.

The orthogonal piece is **Microsoft .NET Aspire** (now at v13 in 2026, see Microsoft Learn). Aspire is Microsoft's own service-orchestration story — you write an `AppHost.cs` that says "start this Postgres, this Redis, this API, this React app" and Aspire runs them locally with a dashboard. It's complementary to Nx, not competing: Nx orchestrates the _build_, Aspire orchestrates the _runtime_. There's a CommunityToolkit `AddNxApp()` helper that lets the AppHost spawn Nx-managed JS apps as Aspire resources. Worth mentioning in the template, but not worth wiring in by default — Aspire is heavy and most template users won't need it.

**Key findings:**

- Nx 22.0 (released 2025-10-23) introduced the official @nx/dotnet plugin, replacing the community @nx-dotnet/core which had ~25k weekly downloads.
- @nx/dotnet latest stable is 22.7.5 (published 2026-05-27); maintainers are nrwlowner, nrwl-jason, jack-nrwl, maxkless, jameshenry — the official Nrwl npm org.
- The community @nx-dotnet/core peaked at 3.0.2 (2025-08-22), peer-deps nx >=20 <23, and its GitHub repo was archived 2026-04-27 with a migration notice committed 2025-10-24.
- @nx/dotnet ships a real C# binary (MsbuildAnalyzer.dll) inside the npm package; Node spawns it via child_process and passes project files over stdin to avoid ARG_MAX limits.
- The project graph glob is: \*_/{_.{csproj,fsproj,vbproj},Directory.Build.{props,targets,rsp},Directory.Solution.{props,targets},Directory.Packages.props} — covering MSBuild ancestor files so cache invalidates when any of them change.
- Inferred targets are build / test / clean / restore / publish / pack / watch / run; the analyzer decides per-project which apply (libraries get pack, executables get run+watch).
- The plugin auto-injects --no-dependencies into dotnet build so Nx's task graph (not MSBuild's project-reference walker) drives topological ordering — that's what makes caching actually work.
- Generators in @nx/dotnet are deliberately minimal: only `init` and `ci-workflow`. Project creation uses native `dotnet new <template>` — no `nx g @nx/dotnet:app`.
- Each inferred build target gets dependsOn: ["^build"], inputs: ["default", "^production"], outputs: ["{projectRoot}/bin", "{projectRoot}/obj"], cache: true by default.
- Minimum .NET SDK is 8.0; the plugin documentation is still marked 'experimental' in mid-2026 even though it's GA in the 22.x line.
- Microsoft .NET Aspire (now v13, hostfx 'aspire' CLI as of Aspire 13.0) is the official runtime-orchestration story; CommunityToolkit.Aspire.Hosting.NodeJS.Extensions exposes builder.AddNxApp() for Nx-side JS apps — orthogonal to @nx/dotnet, not redundant.
- The plugin can be runtime-disabled via NX_DOTNET_DISABLE=true env var — useful when running Nx commands in environments without a .NET SDK installed.

**Gotchas:**

- @nx/dotnet REQUIRES .NET SDK >= 8.0 on PATH at Nx-CLI time, not just at build time — because `nx graph` itself shells into MsbuildAnalyzer.dll. Contributors on machines without dotnet installed will see graph-refresh failures unless they set NX_DOTNET_DISABLE=true.
- @nx/dotnet version 22.7.5 means Nx 22.x major — it is NOT yet on Nx 23 (still in beta as of 2026-06-02). If your template pins Nx 23 betas, @nx/dotnet won't install cleanly.
- There is no `nx g @nx/dotnet:app` generator. Users coming from the community plugin will try this and get nothing. The template MUST document `dotnet new <template> -o apps/<name>` as the canonical creation flow.
- The plugin docs were still labelled 'experimental' in mid-2026 — be honest about this in the template README; APIs around target-rename options have already shifted once between 22.0 and 22.7.
- The MsbuildAnalyzer.dll binary is platform-portable .NET but needs `libhostfxr` discoverable — there's a known macOS/Linux issue (commented-out code in the TS layer) that may resurface; if it does, the workaround is setting DOTNET_ROOT explicitly.
- Don't try to mix @nx-dotnet/core and @nx/dotnet in the same workspace — both register createNodes against overlapping globs and you get duplicate projects in the graph. Migration is uninstall-then-install, not side-by-side.
- The auto-applied --no-dependencies flag means if a developer runs `dotnet build` outside of Nx (e.g., from VS Code C# DevKit), they get DIFFERENT behavior than `nx build` — surprising for newcomers debugging cache misses.
- Aspire AppHost projects (.NET 13.x SDK) are themselves csproj files and will be picked up by @nx/dotnet — but Aspire wants to be the orchestrator, not orchestrated. If you adopt Aspire, you typically disable the `run`/`watch` Nx targets on the AppHost via `"run": false` in plugin options.

**Recommendation (this angle):** For ts-monorepo-template, pin **@nx/dotnet@22.7.5** as the sole .NET plugin (the community @nx-dotnet/core is dead and its repo is archived). Ship a single launcher recipe that does `nx add @nx/dotnet`, then scaffold one example via `dotnet new webapi -o apps/dotnet-example` so users see the "native CLI first" pattern up front. Do NOT bundle .NET Aspire into the default template — mention it in docs as an opt-in for users who want runtime orchestration, since Aspire is heavy and assumes Docker, which conflicts with the "vibe-coder on a laptop" audience.

**Citations:**

- [Nx 22 Release: Expanding the build platform](https://nx.dev/blog/nx-22-release)
- [@nx/dotnet on npm (22.7.5, 2026-05-27)](https://www.npmjs.com/package/@nx/dotnet)
- [@nx-dotnet/core on npm (3.0.2, 2025-08-22)](https://www.npmjs.com/package/@nx-dotnet/core)
- [.NET Plugin for Nx — Introduction](https://nx.dev/docs/technologies/dotnet/introduction)
- [@nx/dotnet Generators reference](https://nx.dev/docs/technologies/dotnet/generators)
- [Migrate from @nx-dotnet/core to @nx/dotnet](https://nx.dev/docs/technologies/dotnet/guides/migrate-from-nx-dotnet-core)
- [Incremental Builds for .NET Projects with Nx](https://nx.dev/docs/technologies/dotnet/guides/incremental-builds)
- [nx-dotnet/nx-dotnet (archived community plugin) on GitHub](https://github.com/nx-dotnet/nx-dotnet)
- [nrwl/nx packages/dotnet source — plugin.ts and create-nodes.ts](https://github.com/nrwl/nx/tree/master/packages/dotnet)
- [Microsoft Learn — .NET Aspire AppHost overview](https://learn.microsoft.com/en-us/dotnet/aspire/fundamentals/app-host-overview)
- [Microsoft Learn — Upgrade to Aspire 13.0](https://learn.microsoft.com/dotnet/aspire/get-started/upgrade-to-aspire-13)
- [Aspire JavaScript integrations (NodeJS + Nx monorepo support)](https://aspire.dev/integrations/frameworks/javascript/)
- [CommunityToolkit.Aspire.Hosting.NodeJS.Extensions on NuGet](https://www.nuget.org/packages/CommunityToolkit.Aspire.Hosting.NodeJS.Extensions)
- [Nx Plugin Registry](https://nx.dev/docs/plugin-registry)
- [nx.json Reference (plugins array)](https://nx.dev/docs/reference/nx-json)

### Angle: Developer experience

Imagine a junior backend engineer joining your repo. They cloned the template, ran `task setup`, and now want to add a C# WebAPI service called `billing-api` that lives alongside the Node frontend and the Go services. Here is what their first 30 minutes actually look like in 2026.

**The plugin landscape just shifted.** Until Oct 2025 the only option was a community plugin called `@nx-dotnet/core`. With Nx 22 (released 23 Oct 2025), the Nx team adopted it as the official `@nx/dotnet` plugin. The author (Craigory Coppola, now at Nx) marked the community version deprecated. The official plugin is still flagged "experimental — features and APIs may change." Both work in 2026, but new repos should use `@nx/dotnet`. The big philosophical change: the official plugin does not wrap `dotnet` with custom generators. You run `dotnet new webapi -o apps/billing-api` and the plugin's MSBuild-based inference reads the `.csproj`, picks up `<ProjectReference>` edges, and synthesizes Nx targets (`build`, `test`, `watch`, `clean`) automatically. So `nx build billing-api`, `nx test billing-api`, `nx watch billing-api -- run` Just Work without touching `project.json`.

**The slick parts.** Project graph is real — if the C# lib `billing-core` is referenced by `billing-api`, Nx knows it and `nx affected` picks up both when either changes. Cross-language edges work too: if a TS package consumes a generated client from the Swagger output of the C# API, Nx tracks that as a dep. Nx Cloud remote cache works for `dotnet build`. Hot reload works via `dotnet watch` — invoked through `nx watch billing-api -- run` — and supports non-UI edits to services and methods.

**Where it hurts (the top-3 gotchas).**

1. _Multi-SDK chaos._ The very first `nx g @nx/dotnet:init` or `dotnet build` silently picks whatever .NET SDK is highest on the host (often a preview). A junior with .NET 9 preview installed will get bizarre restore errors. The fix is to commit a `global.json` pinning `sdk.version` + `rollForward: latestFeature` before any scaffold. This bites every fresh contributor.

2. _Remote cache eats absolute paths._ `.NET`'s `obj/project.assets.json` and `*.nuget.g.props` write absolute paths from the build agent. When Nx restores that cache on a different agent or a dev's laptop, the C# compiler errors `CS0006: Metadata file 'C:\BuildAgent\...' could not be found`. This was filed as nx#33684 (Dec 2025), fixed in PR #33879, but contributors on older Nx 22.x versions still hit it. Workaround: redirect intermediates into `dist/intermediates/{projectRoot}/obj` (the convention the community plugin baked in years ago).

3. _Hot reload + Aspire confusion._ If they also stand up an Aspire AppHost to orchestrate Postgres + the C# API + the TS frontend, they hit "first Razor edit fails — no hot reload changes to apply" and Aspire-specific watch quirks. `dotnet watch` got proper Aspire-aware integration only in the .NET 11 SDK. On .NET 9 SDK + Aspire 13, watch restarts the whole AppHost on rude edits instead of doing in-process hot reload.

**Key findings:**

- The official `@nx/dotnet` plugin shipped in Nx 22 on 23 Oct 2025; the community `@nx-dotnet/core` is now deprecated but its last release (3.0.2, Aug 2025) still supports Nx 21 for legacy repos.
- The official plugin is explicitly flagged 'experimental — features and APIs may change' and requires .NET SDK 8.0+ (older versions unsupported).
- Project inference replaces generators: you create projects with `dotnet new webapi` instead of `nx g @nx-dotnet/core:app`, and the plugin parses `.csproj` / `.fsproj` / `.vbproj` via MSBuild to synthesize `build`, `test`, `watch` targets automatically.
- The `serve` target was renamed to `watch` in the official plugin — `nx watch my-api -- run` replaces the old `nx serve my-api`, which trips users migrating from the community plugin.
- Remote cache portability is broken by default because `.NET`'s `obj/` artifacts (`project.assets.json`, `*.nuget.g.props`, `ref/`) contain absolute paths from the build agent — filed as nrwl/nx#33684 (Dec 2025), fixed in PR #33879, but older Nx 22.x patch versions still hit it.
- The community plugin worked around the cache issue by moving intermediates to `dist/intermediates/{projectRoot}/obj`; the official plugin's MSBuild-API approach is supposed to make this transparent but contributors on early 22.x patches still need the workaround.
- Aspire 13 (released 11 Nov 2025) rebranded from '.NET Aspire' to just 'Aspire' and added Python + JavaScript as first-class AppHost-orchestrated languages; Go and Rust are not first-class.
- The CommunityToolkit.Aspire.Hosting.NodeJS.Extensions package provides `AddNxApp(...).WithPnpm().RunWithPackageManager()` to register an Nx workspace inside an Aspire AppHost without triggering package-manager race conditions.
- Proper `dotnet watch` + Aspire AppHost integration only landed in the .NET 11 SDK — on .NET 9 SDK + Aspire 13, watch restarts the whole AppHost on rude edits instead of in-process hot reload.
- Hot reload in 2026 supports non-UI edits (services, business logic, methods) across Windows/Linux/macOS, but the first Razor edit after launch fails with 'No hot reload changes to apply' as a known issue.
- `global.json` pinning the SDK version is effectively required for monorepo onboarding — without it, contributors with preview SDKs installed silently use the wrong toolchain and hit confusing restore errors.
- .NET 9 introduced a breaking change: `dotnet watch` errors out without `--no-hot-reload` for projects targeting .NET 5 or earlier, so legacy framework projects need explicit opt-out.

**Gotchas:**

- Junior contributors with .NET 9 or 10 preview SDKs installed silently get wrong-toolchain restore errors unless `global.json` with `rollForward: latestFeature` is committed at repo root — this should be in your launcher CLI's prerequisite check.
- The official `@nx/dotnet` plugin is experimental — pin the exact `@nx/dotnet` version in package.json and don't trust `latest`; APIs are explicitly documented as subject to change.
- Generators from the community plugin (`nx g @nx-dotnet/core:app`) are GONE in the official plugin — users following old DEV.to tutorials will type commands that do not exist; the new flow is `dotnet new webapi -o apps/billing-api && nx sync`.
- `nx serve` no longer exists for .NET projects in the official plugin — it is `nx watch <project> -- run`, which is a syntax shift that documentation must call out loudly.
- Remote cache from Nx Cloud will fail with `CS0006: Metadata file '...' could not be found` for any .NET project on Nx 22 versions before the #33879 fix — pin to a known-good Nx 22.7.x or apply the `obj` redirect workaround.
- Aspire AppHost is C#-only for authoring (TypeScript AppHost is preview); contributors expecting a polyglot orchestrator written in TS will be surprised they need a C# AppHost project.
- `.NET`-side hot reload uses Edit-and-Continue rules — adding fields, changing method signatures, or editing generics counts as a 'rude edit' and forces a restart, which surprises engineers used to React Fast Refresh.
- On .NET 9 SDK (still the default in most 2026 corp environments), `dotnet watch` + Aspire produces messy restart loops; either move to .NET 11 SDK or use Aspire's `aspire watch` command which restarts the AppHost-managed process by design.

**Recommendation (this angle):** For the ts-monorepo-template, default to the official `@nx/dotnet` plugin (Nx 22+), commit a `global.json` pinning .NET SDK 9.0 with `rollForward: latestFeature`, and document the workflow as `dotnet new` to scaffold + `nx watch <proj> -- run` to dev — not `nx serve` or community-plugin generators. Treat Aspire as an optional second tier (a generator for `apphost` projects) because adopting it forces a C#-authored AppHost on every contributor and is overkill for the founder/vibe-coder audience; keep the default stack `task dev:billing-api` = `nx watch billing-api -- run`, and reserve Aspire for the enterprise C# customer path.

**Citations:**

- [Migrate from @nx-dotnet/core to @nx/dotnet | Nx Docs](https://nx.dev/docs/technologies/dotnet/guides/migrate-from-nx-dotnet-core)
- [Nx 22 Release: Expanding the build platform | Nx Blog](https://nx.dev/blog/nx-22-release)
- [.NET Plugin for Nx — introduction (experimental)](https://nx.dev/docs/technologies/dotnet/introduction)
- [@nx/dotnet remote cache portability bug — nrwl/nx#33684](https://github.com/nrwl/nx/issues/33684)
- [nx-dotnet initial setup road bumps (global.json) — discussion #691](https://github.com/nx-dotnet/nx-dotnet/discussions/691)
- [nx-dotnet changelog (community plugin, 3.0.2)](https://www.nx-dotnet.com/changelog)
- [What's new in Aspire 13 (Nov 11 2025) — multi-language platform](https://aspire.dev/whats-new/aspire-13/)
- [Aspire Hot Reload and watch — AppHost behavior](https://aspire.dev/app-host/hot-reload-and-watch/)
- [Node.js hosting extensions (AddNxApp) — Aspire Community Toolkit](https://aspire.dev/integrations/frameworks/nodejs-extensions/)
- [dotnet watch command — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-watch)
- [dotnet watch breaking change (no hot reload for old TFMs) — .NET 9](https://learn.microsoft.com/en-us/dotnet/core/compatibility/sdk/9.0/dotnet-watch)
- [What's new in the SDK and tooling for .NET 11 (Aspire-aware watch)](https://learn.microsoft.com/dotnet/core/whats-new/dotnet-11/sdk)
- [Setting up an Nx workspace with nx-dotnet — DEV.to walkthrough](https://dev.to/this-is-learning/setting-up-an-nx-workspace-with-nx-dotnet-893)
- [Fixing .NET Watch & Hot Reload in Aspire without leaving .NET 8 — MrCSharp](https://blog.mrcsharp.dev/post/2026-02-07-dotnet-watch-and-aspire/)

### Angle: Production readiness

Imagine you've added a `.csproj` to the monorepo via `@nx/dotnet`. Nx now knows how to `build` and `test` it. Shipping it to production is a separate problem: a build artifact has to become a thing customers can actually run, with proof it came from your code and not somebody else's. There are three slices to get right.

**Slice 1: producing the artifact.** For server work (ASP.NET, gRPC, Worker Services) the right primitive in 2026 is `dotnet publish /t:PublishContainer`. This is the SDK's built-in container builder; it pushes straight to a registry without needing a Dockerfile or even a running Docker daemon (`ContainerArchiveOutputPath` writes a tarball you can sign and scan in CI). The SDK can now emit an OCI image index for multi-arch (linux-x64 + linux-arm64) in one command since SDK 9.0.2xx. Pair this with the Ubuntu **Chiseled** base image (`mcr.microsoft.com/dotnet/aspnet:9.0-noble-chiseled`) — a distroless variant that drops ~100 MB and most of the attack surface but keeps Debian-family glibc compatibility. For CLIs and desktop bits you'd ship as binaries instead: `PublishAot=true` to get a single self-contained native executable. AOT eliminates the runtime install requirement but requires AOT-clean code (no unbounded reflection); test the published binary, don't trust warnings to be cosmetic.

**Slice 2: signing.** This is where 2026 reality diverges per channel. Container images get signed with **cosign keyless** using GitHub's OIDC token — no key material to manage; Sigstore writes the attestation to Rekor. NuGet packages use `dotnet sign` (the dotnet/sign tool) integrated with **Azure Trusted Signing** (recently renamed "Azure Artifact Signing", GA April 2026, restricted to US/CA/EU/UK businesses). For supply-chain provenance independent of signing, add `actions/attest-build-provenance` — that gives you SLSA Build Level 2 attestations verifiable with `gh attestation verify`. Gotcha: NuGet.org rewrites the package on upload (adds `.signature.p7s`), changing the SHA-256, which silently invalidates the original attestation unless you strip the signature first. Windows desktop binaries also use Trusted Signing via `signtool`/`dotnet sign`; MAUI/iOS uses Apple notarization with a Developer ID cert + the (now mandatory) `PrivacyInfo.xcprivacy` manifest; MAUI/Android uses Play App Signing.

**Slice 3: shipping.** Use Nx Cloud for remote cache + Nx Agents for distributed task execution — both work for `@nx/dotnet` because MSBuild outputs are now cacheable through the official plugin. CI shape is a GH Actions matrix over `{ubuntu-latest, windows-latest, macos-latest}` × `{8.0.x, 10.0.x}` driven by `actions/setup-dotnet@v4`. Distribution channels: server → container registry (GHCR/ACR), Aspire apps → `azd up` to Azure Container Apps (mature) or `aspire publish` → Helm to Kubernetes (preview in Aspire 13.3); desktop → MSIX via Microsoft Store + winget manifest; CLI tools → `dotnet tool install` from NuGet.

The honest tradeoff: `@nx/dotnet` (Nx 22, April 2026) is officially supported but explicitly labeled **experimental**, and the predecessor `@nx-dotnet/core` was archived April 27, 2026. There's no Nx-native executor that publishes containers, signs them, or pushes to registries — you call those from regular `npx nx run`/`gh action` glue. That's the gap a template would fill.

**Key findings:**

- The official @nx/dotnet plugin shipped with Nx 22 (latest 22.7.1, April 28 2026) and is marked experimental; community predecessor @nx-dotnet/core was archived April 27, 2026.
- dotnet publish /t:PublishContainer builds and pushes OCI images without a Dockerfile or Docker daemon, and since SDK 9.0.2xx supports multi-arch (linux-x64 + linux-arm64) via an OCI Image Index in one command.
- Ubuntu Chiseled .NET base images (e.g. mcr.microsoft.com/dotnet/aspnet:9.0-noble-chiseled) cut ~100 MB and the attack surface vs the full image while keeping glibc/Debian compatibility, unlike Alpine/musl.
- .NET 10 went GA as LTS on November 12 2025 with support through November 10 2028; .NET 8 LTS ends in November 2026, so any 2026 template that targets .NET 9 is targeting a release that will be EoL before .NET 8.
- actions/attest-build-provenance with id-token: write permission produces SLSA v1.0 Build Level 2 attestations for NuGet packages, verifiable via gh attestation verify - but nuget.org rewrites the .nupkg on upload (adds .signature.p7s), invalidating the SHA-256 unless the signature file is stripped before verification.
- Azure Trusted Signing was renamed Azure Artifact Signing in early 2026 (functionally identical), reached GA in April 2026, and is restricted to US/CA/EU/UK-registered businesses; dotnet sign (dotnet/sign) is the integration point for NuGet, MSIX, VSIX and ClickOnce.
- Microsoft Aspire 13.3 (May 2026) adds preview Kubernetes/Helm publishers and Gateway API ingress; azd to Azure Container Apps remains the mature production path, K8s/Helm is functional but rougher.
- Sigstore cosign keyless signing with GitHub OIDC is the de facto 2026 container-signing path; it leaves NuGet without first-party sigstore support (still a feature request; OpenTelemetry .NET ships .sig/.pem sidecars manually).
- Nx Cloud Remote Cache (Nx Replay) and Nx Agents both work with @nx/dotnet because the official plugin integrates MSBuild outputs into the Nx task graph for caching and distribution.
- actions/setup-dotnet@v4 supports matrix builds across ubuntu/windows/macos and SDK channels (8.0.x, 10.0.x, etc.) - the standard CI shape for cross-platform .NET workloads in 2026.
- Apple now requires every iOS/MAUI app to include PrivacyInfo.xcprivacy (since May 2024) - apps without it are rejected even if the developer's own code doesn't touch required-reason APIs, because the .NET runtime does.
- The current canonical .NET reference architecture is dotnet/eShop (Aspire-based, .NET 9, services architecture) which superseded eShopOnContainers in November 2023 - it is NOT an Nx monorepo (no .NET reference project ships in an Nx workspace at production scale yet).

**Gotchas:**

- @nx/dotnet has no executor for dotnet publish, container builds, signing, or registry push - you wire those in via plain MSBuild targets, Nx run-commands, or gh actions glue. Don't expect parity with @nx/node ergonomics.
- NuGet.org modifies your uploaded .nupkg by inserting .signature.p7s, which changes its SHA-256 and breaks any provenance attestation downloaded after publish - consumers must zip -d <pkg> .signature.p7s before gh attestation verify.
- Azure Trusted Signing requires .NET 8 exactly for some flows; using .NET 10 with older signtool variants can fail silently. Verify each pipeline step writes a signed artifact, don't trust exit codes.
- Targeting .NET 9 in a 2026 template is a footgun: it's a STS release with support ending mid-2026. Default to .NET 10 LTS; allow .NET 8 LTS for legacy.
- Aspire's Kubernetes/Helm publisher is preview in 13.3 - for production K8s today, azd to Azure Container Apps is mature; non-Azure K8s expect to write Bicep/Helm yourself.
- Ubuntu Chiseled images don't contain a shell - any Dockerfile that does RUN apt-get or relies on bash entrypoint scripts breaks. Switch to a dotnet-as-entrypoint container or stay on the full image.
- Native AOT changes runtime behavior: reflection-heavy libs (older Newtonsoft.Json, EF Core providers, DI containers) may break at runtime, not at publish time. AOT warnings during publish must be treated as errors.
- Trusted Signing GA is geo-restricted to US/CA/EU/UK businesses (April 2026) - for solo developers or non-eligible regions, fall back to a paid OV/EV cert from SSL.com or DigiCert, or skip Windows code-signing and accept SmartScreen warnings.

**Recommendation (this angle):** For the ts-monorepo-template, ship @nx/dotnet (Nx 22+) targeting .NET 10 LTS with a single opinionated server path: dotnet publish /t:PublishContainer against a chiseled aspnet base, multi-arch via SDK-native OCI index, image signed with cosign keyless using GitHub OIDC, and SLSA build provenance via actions/attest-build-provenance. Provide a matrix-CI scaffold (actions/setup-dotnet@v4) and an optional Aspire-AppHost lane that wires azd up to Azure Container Apps; defer MAUI desktop/mobile signing (Trusted Signing + Apple notarization) to a documented opt-in recipe rather than baking it into the template, because the geo-restrictions and per-store ceremony fight the "works on day 1" promise.

**Citations:**

- [Nx 22 Release: Expanding the build platform](https://nx.dev/blog/nx-22-release)
- [Migrate from @nx-dotnet/core to @nx/dotnet](https://nx.dev/docs/technologies/dotnet/guides/migrate-from-nx-dotnet-core)
- [.NET Plugin for Nx](https://nx.dev/docs/technologies/dotnet/introduction)
- [nx-dotnet/nx-dotnet (archived)](https://github.com/nx-dotnet/nx-dotnet)
- [Containerize a .NET app with dotnet publish](https://learn.microsoft.com/en-us/dotnet/core/containers/sdk-publish)
- [Containerize a .NET app reference (multi-arch OCI index)](https://learn.microsoft.com/en-us/dotnet/core/containers/publish-configuration)
- [.NET Chiseled Containers - Ubuntu](https://ubuntu.com/containers/chiseled/dotnet)
- [Announcing .NET Chiseled Containers - .NET Blog](https://devblogs.microsoft.com/dotnet/announcing-dotnet-chiseled-containers/)
- [Native AOT deployment overview](https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/)
- [Announcing .NET 10 - .NET Blog](https://devblogs.microsoft.com/dotnet/announcing-dotnet-10/)
- [Creating provenance attestations for NuGet packages in GitHub Actions - Andrew Lock](https://andrewlock.net/creating-provenance-attestations-for-nuget-packages-in-github-actions/)
- [dotnet/sign - Code Signing CLI](https://github.com/dotnet/sign)
- [Azure Trusted Signing Revisited with Dotnet Sign - Rick Strahl](https://weblog.west-wind.com/posts/2026/Mar/02/Azure-Trusted-Signing-Revisited-with-Dotnet-Sign)
- [Microsoft Releases Aspire 13.3 - InfoQ](https://www.infoq.com/news/2026/05/aspire-13-3-release/)
- [dotnet/eShop reference architecture](https://github.com/dotnet/eshop)

### Angle: Tradeoffs + recommendation

Picture a startup founder opening `ts-monorepo-template` for the first time. They want to ship a SaaS in a weekend. The template offers TS, Python, Go, Rust — four languages that already cover 95% of what an early product needs (web UI, AI service, performance-critical worker, systems plumbing). Should the template also bundle C# / .NET? My answer is **no, not by default — make it a first-class opt-in for the two profiles that actually need it.**

Here's why, in plain language.

.NET is genuinely good. .NET 10 shipped in November 2025 as an LTS release supported until November 2028, ASP.NET Core minimal APIs are about 15% faster than .NET 8, OpenAPI is built in, and native AOT is solid. As a backend language for a real enterprise team, it competes head-to-head with Go on throughput and beats Node.js on memory. The problem isn't the language. The problem is **audience-fit and tooling-fit for _this specific template_**.

**The tooling situation in 2026 is awkward.** For three years the community kept `@nx-dotnet/core` alive — generators for ASP.NET, gRPC, swagger, F# projects, the works. That plugin was archived on April 27, 2026. Nx 22 (October 2025) shipped an _official_ `@nx/dotnet` replacement, but it is **explicitly marked experimental**, ships with **only two documented generators** (`init` and `ci-workflow`), and **deliberately drops** several features the community plugin had: no default `serve` target, no `format` target, no module-boundary enforcement. So a startup adopting this today gets fewer batteries-included than they'd have had on the deprecated plugin a year ago.

**Microsoft is also routing around Nx**. Aspire 13 (November 2025) rebranded from ".NET Aspire" to just "Aspire" and became polyglot — it now orchestrates Python, JavaScript, TypeScript, Java, and Go alongside .NET, with its own dashboard, OpenTelemetry baked in, and `aspire publish` generating Docker Compose, K8s manifests, and Bicep. If a team is C#-led, Aspire is the path Microsoft pushes them down, not Nx. The two can coexist but it's not the natural narrative.

**Audience reality**: the 2025 Stack Overflow survey reinforces what every YC batch shows — startup founders pick TypeScript + Go + Python. C# is enterprise bread-and-butter. The template's stated audience is "startup founders / vibe-coders / junior engineers." That's the opposite of C#'s natural buyer.

**Verdict**: ship a `--with-dotnet` flag wired to `@nx/dotnet` and a clean ASP.NET Core 10 sample, but do not bundle it in the Just-Me / Side-Project / Early-Startup profiles. Document the Aspire question honestly: "if your team is C#-first, Aspire is probably a better home than Nx; this template fits you only if you have non-C# services in the same repo."

**Key findings:**

- @nx-dotnet/core (community) was archived on 2026-04-27 and points all users to the official @nx/dotnet plugin in Nx 22+.
- @nx/dotnet is explicitly marked experimental as of v22.7.1 (April 28, 2026), with APIs subject to change.
- The official @nx/dotnet plugin ships only two documented generators (init, ci-workflow); the deprecated community plugin offered project/library/swagger generators with more polish.
- @nx/dotnet deliberately drops features the community plugin had: no default serve target, no format target, and no built-in module-boundary enforcement (migrate to Nx Conformance rules instead).
- @nx/dotnet requires .NET SDK 8.0+ and uses an MSBuild analyzer to infer the project graph automatically — inference is now mandatory (cannot be disabled).
- .NET 10 shipped November 11, 2025 as the current LTS release, supported through November 2028; .NET 9 reaches EOL November 10, 2026.
- Aspire 13 (November 2025) rebranded from '.NET Aspire' to 'Aspire' and added first-class Python, JavaScript, TypeScript, and Java support with its own polyglot SDK module generator (.aspire/modules/).
- Aspire 13's aspire publish/deploy generate Docker Compose, Kubernetes manifests, and Bicep — directly overlapping with Nx CI/deploy flows.
- Nx 2026 roadmap commits to 'further C#/.NET improvements building on @nx/dotnet' and to lazy graph hydration so JS devs don't need .NET SDK installed to compute the project graph.
- Stack Overflow 2025 Developer Survey shows startups gravitate to TypeScript + Python + Go; C#/.NET remains an enterprise/recruiter-driven language, not a founder default.
- Rider and Visual Studio expect .sln-centric workflows; Nx's no-.sln inference works but reduces IDE debugger ergonomics for teams used to traditional .NET tooling.
- Nx is genuinely polyglot at the build/graph layer but does not provide language-server or debugger integration — debugging C# still requires Rider, VS, or VS Code with the C# Dev Kit.

**Gotchas:**

- The plugin a founder might Google ('nx-dotnet') points to an archived repository as of April 2026 — copy-pasting old tutorials installs the deprecated package.
- @nx/dotnet has fewer features than the community predecessor it replaced; users migrating expect parity and don't get it (no serve, no format, no module boundaries).
- Mandatory auto-inference means a stray .csproj anywhere under the workspace becomes an Nx project whether you want it or not — important when the template has example/test directories.
- Aspire 13 is Microsoft's officially blessed multi-service orchestrator and overlaps with Nx; teams will ask 'do I need both?' and the honest answer is usually 'pick one'.
- MSBuild-based project graph computation requires the .NET SDK installed locally for every developer who runs `nx graph` — until Nx ships lazy graph hydration (roadmap, not shipped), this taxes pure-JS contributors.
- F#/VB.csproj/.fsproj/.vbproj are auto-detected by @nx/dotnet, but generator support and idiomatic examples are .csproj-centric; F# users get graph but not scaffolding parity.
- Nx Cloud caching of .NET builds works but cache hit rates depend on deterministic MSBuild output; package restores and version-sensitive analyzers can break determinism silently.
- .NET 9 is being widely used in production right now but reaches EOL on November 10, 2026 — any template shipping a .NET 9 sample today is shipping a soon-stale default; pin to .NET 10 LTS.

**Recommendation (this angle):** **Exclude from default profiles; ship as a first-class opt-in (`--with-dotnet`) targeting Scaling-Startup and Production-at-Scale only.** The audience-fit is wrong for Just-Me/Side-Project/Early-Startup founders, the official @nx/dotnet plugin is still experimental with feature regressions versus the now-archived community plugin, and Microsoft's Aspire 13 is the natural home for C#-first teams. Pin samples to .NET 10 LTS (not .NET 9), and document the Aspire-vs-Nx tradeoff honestly so enterprise adopters can choose with eyes open rather than discovering the overlap after committing.

**Citations:**

- [.NET Plugin for Nx (official @nx/dotnet docs)](https://nx.dev/docs/technologies/dotnet/introduction)
- [Migrate from @nx-dotnet/core to @nx/dotnet](https://nx.dev/docs/technologies/dotnet/guides/migrate-from-nx-dotnet-core)
- [Nx 22 Release: Expanding the build platform](https://nx.dev/blog/nx-22-release)
- [@nx/dotnet Generators reference](https://nx.dev/docs/technologies/dotnet/generators)
- [Nx 2026 Roadmap: polyglot and lazy graph hydration](https://nx.dev/blog/nx-2026-roadmap)
- [nx-dotnet/nx-dotnet GitHub repo (archived 2026-04-27)](https://github.com/nx-dotnet/nx-dotnet)
- [What's new in .NET 10 (LTS, Nov 2025)](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/overview)
- [.NET official support policy (EOL dates)](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core)
- [What's new in Aspire 13 (polyglot release)](https://aspire.dev/whats-new/aspire-13/)
- [Aspire 13 Delivers Multi-Language Support (InfoQ)](https://www.infoq.com/news/2025/11/dotnet-aspire-13-release/)
- [Aspire 13 bolsters Python, JavaScript support (InfoWorld)](https://www.infoworld.com/article/4091418/aspire-13-bolsters-python-javascript-support.html)
- [2025 Stack Overflow Developer Survey — Technology](https://survey.stackoverflow.co/2025/technology/)
- [JavaScript Monorepos for Frontend Teams 2026 (Aspire+Nx coexistence note)](https://www.growin.com/blog/javascript-monorepos-frontend/)
- [Aspire dashboard overview (Microsoft Learn)](https://learn.microsoft.com/en-us/dotnet/aspire/fundamentals/dashboard/overview)

## Team 2 — Nx + C / C++

### Synthesized verdict

**Verdict:** `include-only-on-demand` | **Fit score:** 22 / 100 | **Default profile bundles:** _(none by default)_

**Reasoning:**

All four angle reports converge on the same honest answer: C/C++ does not belong in any default profile of the ts-monorepo-template. The plugin-landscape angle establishes the structural problem — there is no first-party Nx plugin for C/C++, the only community option (nx-cmake v0.7.2, last published 2024-03-19) is archived, pinned to @nx/devkit 18.1.2 against a current Nx 22.7.5, and uses the deprecated v1 createNodes contract. The Nx 2026 roadmap explicitly enumerates Python, .NET, Maven, Gradle, and mise integration and explicitly does not mention C or C++. That is a clear signal: the upstream ecosystem is not investing here, and a commercial template cannot rest a "supported language" promise on an abandoned single-maintainer package.

The dev-experience angle reinforces this with a concrete onboarding picture. The first 30 minutes of a junior engineer with a C++ scaffold are death-by-paper-cuts: vcpkg compiles OpenSSL/Protobuf/gRPC from source on first run (30-60 minutes, often Ctrl-C'd as "hung"), clangd silently latches onto the wrong compile_commands.json in a multi-project workspace and makes the IDE look broken, ccache only works if CMAKE_C_COMPILER_LAUNCHER is set before first configure, ASAN/UBSAN/TSAN need separate build dirs that link-error if mixed, and "hot reload" simply does not exist portably. Compare this to the TypeScript/Python/Go/Rust loops the template already delivers and the gap is not a minor polish item — it is a different kind of developer experience entirely, and shipping it as a default would dilute the template's "it just works" promise.

The production-readiness angle clarifies the release side. GoReleaser does NOT have first-class C/C++ support — so the template cannot reuse the Tauri/Rust release pipeline and must wire bespoke CPack + cosign keyless + notarytool + Azure Artifact Signing. SBOMs for C/C++ require a four-signal hack rather than a one-tool flow. Reproducibility requires SOURCE_DATE_EPOCH plus RPATH and ZERO_AR_DATE discipline. Azure Artifact Signing is geo-restricted (US/Canada/EU/UK only), which silently breaks the template for users in India and elsewhere. None of this is fatal — it's all solvable — but it is a meaningful surface area to own for a use case that almost no template user actually has.

The recommendation angle adds the strategic frame: in 2026 the modern default for "one native core, many language bindings" is Rust + cbindgen or a WebAssembly Component Model module with WIT, not C++. The template already supports Rust first-class. Mobile native paths (RN TurboModules, dart:ffi, Android NDK) expect raw CMake, not Nx-wrapped CMake, so adding an Nx layer there is friction not value. Embedded firmware lives in PlatformIO or Zephyr's west and is not a fit for Nx at all. The only genuine use case left — shipping a native SDK with multi-language bindings as the product — is rare among the audiences the template targets (vibe-coding founders, junior engineers, and AI agents), and those who do have it tend to have strong opinions the template can't pre-empt.

The verdict is therefore include-only-on-demand: no profile bundles C/C++ by default, and the launcher exposes a documented `add_app --lang=cpp` escape hatch that scaffolds a CMake + vcpkg leaf via a thin workspace-local createNodesV2 plugin (around 60-100 lines, owned by the template, not depending on nx-cmake). The fit score is 22 — low because the default story is "no," but not zero because the escape hatch is a legitimate and useful feature for the small fraction of users who genuinely need a native SDK. The marketing copy should steer those users toward Rust + cbindgen first, with C/C++ presented as the fallback when they have existing C/C++ code to integrate, not the recommended starting point.

**Integration outline:**

1. Default profiles: no changes — none of p-solo, p-hobby, p-startup-small, p-startup-scale, p-enterprise bundle C/C++. Document this explicitly in the profile matrix so users understand the choice is deliberate.

2. Escape hatch (opt-in, all profiles): ship `apps/launcher` command `add_app --lang=cpp --name <name>` that materializes:
   - `packages/<name>/CMakeLists.txt` with modern CMake (>= 3.25) + CMakePresets.json (debug/release/asan profiles)
   - `packages/<name>/vcpkg.json` (manifest mode, baseline pinned)
   - `packages/<name>/.clangd` pointing at the project's build dir to avoid the multi-project compile_commands.json LSP trap
   - Root-level merged `compile_commands.json` symlink generation script
   - Default tests via Catch2 (lighter than GoogleTest, header-only)

3. Custom Nx plugin under `tools/nx-native/` (~60-100 lines, workspace-local, NOT a dependency on nx-cmake):
   - Use createNodesV2 (current API), match glob `**/CMakeLists.txt` excluding `**/build/**` and `**/vcpkg_installed/**`
   - Emit targets: `build` (cmake --build via preset), `test` (ctest), `lint` (clang-tidy), `format` (clang-format), `package` (cpack)
   - Inputs: source files + CMakeLists.txt + vcpkg.json + CMakePresets.json; outputs: `build/<preset>/`
   - Do NOT cache the cmake configure step (writes absolute paths to CMakeCache.txt); cache build artifacts only
   - Document the `CMAKE_C_COMPILER_LAUNCHER=ccache` must-be-set-before-first-configure gotcha in a generator-emitted README

4. Toolchain pinning via mise.toml (the template's existing version-pin story extends naturally): pin cmake, ninja, clang/llvm versions. Document that Windows users need MSYS2 + UCRT64 or accept MSVC limitations.

5. CI workflow (only generated when at least one C++ project exists in the workspace):
   - Use aminya/setup-cpp@v1.8.0 across matrix ubuntu-24.04, windows-2022, macos-14
   - Set up sccache with S3/GHCR backend for cross-CI caching
   - Run nx affected -t build,test,lint with the custom plugin
   - Package step calls CPack to produce DEB/RPM/NSIS/DMG

6. Release pipeline (separate from the existing GoReleaser path — do not try to reuse):
   - CPack produces native packages
   - cosign keyless signing via GitHub OIDC (id-token: write permission)
   - Apple: notarytool with Hardened Runtime + secure timestamp (deferred to v2; document the path)
   - Windows: Azure Artifact Signing with documented fallback for geo-restricted regions (Indian users etc.)
   - Linux: cosign bundle alongside DEB/RPM on GitHub Releases

7. Helm chart shape changes: none. Native SDK is a library product, not a service; if a user does ship a C++ service, they reuse the existing Docker/Helm patterns with a multi-stage build (vcpkg builder → distroless/cc-debian12).

8. Crossplane XRD changes: none.

9. Dockerfile template (only when --lang=cpp is used): multi-stage builder with vcpkg manifest mode + distroless/cc-debian12 runtime.

10. Marketing site copy: explicitly state "C/C++ is opt-in, not bundled. If you need a native core with multi-language bindings, we recommend starting with Rust + cbindgen (first-class in this template). Choose C++ only when integrating existing C++ code or when targeting platforms that mandate it."

11. MCP server (Aegis surface): expose the cpp escape hatch as a tool with a clear precondition check ("agent: do you actually need C/C++, or is Rust+cbindgen sufficient?") to avoid steering agents toward the heavier path by default.

12. Future revisit triggers (document these so the team knows when to reopen): (a) Nx ships first-party C/C++ plugin, (b) a popular community plugin reaches sustained maintenance, (c) WebAssembly Component Model matures enough to be a first-class polyglot boundary in the template, (d) multiple template users request it concretely.

**Risks:**

- nx-cmake's abandonment means we cannot lean on community plugin work — the template owner inherits all maintenance for the workspace-local createNodesV2 plugin and any breakage from future Nx major releases.
- Toolchain divergence (Linux gcc vs macOS Apple-clang vs Windows MSVC) produces different ABIs, and FFI bindings to Go/Python/Rust break differently per platform — even an opt-in path must document a single supported toolchain matrix or users hit silent runtime segfaults.
- clangd's compile_commands.json discovery is fragile in multi-project workspaces and will make the IDE appear broken to junior engineers — without a tested .clangd + merged compile DB story, the opt-in path will generate support tickets out of proportion to its usage.
- vcpkg first-install latency (30-60 minutes compiling OpenSSL/Protobuf from source) creates a terrible first-impression for any user who tries the escape hatch without binary caching configured — must document and pre-wire GHCR or Azure Blob binary cache.
- Azure Artifact Signing's geo restriction (US/Canada/EU/UK only) silently breaks Windows signing for Indian/APAC/LATAM template users — fallback to traditional OV certs through CA resellers is documented but is a real friction point we don't have for the existing Tauri/Rust path.
- Recommending C++ in 2026 when Rust + cbindgen and the WebAssembly Component Model are the modern polyglot interop defaults risks pushing users toward a legacy pattern; marketing copy must steer correctly or the template's modernity claim weakens.
- SBOM generation for C/C++ requires a four-signal hack that the existing TS/Go/Rust/Python pipelines don't need — extending the template's audit/SBOM tooling for the opt-in path is non-trivial and easy to ship incomplete.
- Adding any C/C++ surface area forces a fuzzing/sanitizer/CVE-tracking burden on the security story that the rest of the template doesn't carry — if we ship the escape hatch we must also ship the security guidance or quietly invite supply-chain risk.

### Angle: Plugin landscape + integration mechanics

Here's the honest picture, told plainly.

Nx is a JavaScript-rooted tool. It understands a project by reading some kind of config file in a directory (a package.json, a project.json, a Dockerfile, a pyproject.toml, etc.) and asking "what tasks can I run on this thing?" An Nx plugin is just a small npm package that says: "Hey Nx — when you see a file matching this glob, here are the targets you should attach to it." That's it. Everything else (caching, task graph, daemon) is shared infrastructure.

For C/C++, the only thing on the shelf is `nx-cmake` by one person (Clemens Horn). The shelf is dusty. Latest version is 0.7.2, published 2024-03-19. The hosting repo (clemenscodes/nx-plugins) is archived. 2 stars, 27 open issues, last push 2024-06. It pins `@nx/devkit: 18.1.2`. Nx stable is now 22.7.5 with 23 in beta. Project Crystal (the createNodesV2 API) shipped in Nx 19; the plugin uses the older createNodes v1 contract. So in 2026, installing nx-cmake means dragging an Nx 18-era devkit into an Nx 22 workspace and hoping nothing collides. Some of it works (executors are mostly shell-outs to cmake, make, clang-format, clang-tidy) but the project-graph integration is on shaky API.

What nx-cmake actually does, mechanically:

- File glob it parses: `**/*/CMakeLists.txt` — any nested CMakeLists.txt becomes a project.
- Generators: init, binary (app), library (lib), link (lib→lib), preset (workspace scaffold).
- Executors (wrappers around CLIs): cmake (configure), compile (make), test (CMocka/gtest), debug (gdb), lint (clang-tidy), fmt (clang-format), execute (run binary).
- Dependency graph trick: it runs `gcc -MM` on sources to discover #include edges, then does a transitive reduction to avoid redundant edges. That's clever but Linux/GCC-centric — Windows users go through MSYS2, and there is no MSVC support.

There is no official Nx plugin for C/C++. Look at the Nx 2026 roadmap and you'll see Python, .NET, Maven, Gradle, mise integration — but C/C++ is not mentioned anywhere. The 2026 polyglot expansion explicitly skips native compiled languages.

What this means for the template: if you treat C/C++ as "we ship a native SDK that gets linked into Go/Python/Rust via FFI," you don't need an Nx C/C++ plugin at all. You need: (a) a CMakeLists.txt or Conan/vcpkg recipe in packages/native-sdk/, (b) a tiny custom createNodesV2 plugin (~60 lines) that wires `nx build native-sdk` to `cmake --build`, and (c) mise (which Nx is integrating in 2026) to pin cmake, clang, gcc versions per workspace. If you treat C/C++ as a primary backend stack (multiple services, complex linker graph, conditional compilation matrix), Nx is the wrong shape — Bazel + rules_cc is what mature C/C++ monorepos actually use, because Bazel was designed for that exact case.

**Key findings:**

- nx-cmake (the only viable Nx C/C++ plugin) was last published 2024-03-19 at v0.7.2 and its hosting repo clemenscodes/nx-plugins is archived as of 2024-06-10 with 2 stars and 27 open issues, effectively abandoned.
- nx-cmake's package.json pins @nx/devkit 18.1.2; current Nx stable is 22.7.5 (Nx 23 in beta) — a four-major-version gap that predates Project Crystal (createNodesV2 in Nx 19).
- There is no official @nx/\* plugin for C, C++, CMake, Conan, or vcpkg, and the Nx 2026 roadmap explicitly enumerates Python / .NET / Maven / Gradle / mise integration but does not mention C/C++ anywhere.
- The Nx plugin registry contains no C/C++ entry; searches on nx.dev/plugin-registry return zero matches for CMake/Conan/vcpkg in 2026.
- nx-cmake's project-detection mechanic is a glob over \*_/_/CMakeLists.txt plus the v1 createNodes contract — it parses CMakeLists.txt only at the directory level, does not understand subprojects via add_subdirectory beyond filesystem layout.
- nx-cmake's dependency-graph trick is gcc -MM on every source file followed by transitive reduction — Linux/GCC-only; Windows requires MSYS2/UCRT64, MSVC is not supported.
- nx-cmake exposes 5 generators (init, binary, library, link, preset) and 7 executors (cmake, compile, test, debug, lint, fmt, execute) — all thin shell wrappers around the system cmake / make / clang-format / clang-tidy / gdb binaries.
- @nx-tools/nx-cmake as a scoped package does NOT exist on npm; the @nx-tools org publishes nx-container and others, but nx-cmake lives unscoped under clemenscodes.
- The minimal install is 5 commands but produces a workspace pinned to Nx 18 devkit semantics — running nx-cmake:init rewrites nx.json caching defaults assuming the v1 plugin API.
- Nx's 2026 mise integration (announced for Q1/Q2 2026) is the closest thing to native-toolchain support — it lets a workspace pin gcc/clang/cmake versions via mise.toml, but does not provide cache-aware targets.
- Bazel + rules_cc remains the credible alternative for primary C/C++ monorepos in 2026, with explicit positioning in current comparisons as the polyglot/correctness choice when Nx's JS-rooted model breaks down.

**Gotchas:**

- nx-cmake's repo is archived AND the packages/nx-cmake directory was deleted from the default branch — the npm tarball is the only surviving artifact; PRs and issues are read-only.
- The plugin's projectFilePattern is \*_/_/CMakeLists.txt (note the /\*/ prefix), so a root-level CMakeLists.txt does NOT match — easy to miss when laying out a workspace.
- nx-cmake uses the v1 createNodes contract (createNodes: [pattern, fn]), not v2 (createNodesV2: [pattern, fnReceivingArray]); on Nx 21+ this still loads via the back-compat layer but generates a deprecation warning and bypasses the V2 cache-key optimizations.
- The init generator rewrites nx.json with target defaults and named inputs assuming Nx 16-18 schema — it can corrupt a modern nx.json that already uses inputs/namedInputs in the v2 format.
- Dependency detection via gcc -MM means a Windows-only workspace silently produces empty dep graphs unless MSYS2 + GCC is on PATH; MSVC users get no graph at all.
- There is no Conan or vcpkg integration in nx-cmake — third-party C/C++ deps must be declared inline in CMakeLists.txt and the Nx graph won't see them.
- Generators hardcode CMocka (C) and googletest (C++) for tests with no opt-out; teams using Catch2, doctest, or Boost.Test get nothing.
- @nx/devkit 18.1.2 as a transitive dep can pull duplicate Nx core libraries into a workspace pinned to a newer major — pnpm hoisting will surface this as version conflict warnings on install.

**Recommendation (this angle):** Do NOT depend on nx-cmake for the template — it is archived, pinned to Nx 18 devkit, and uses the deprecated v1 createNodes contract. Instead, ship a 60-line workspace-local createNodesV2 plugin under tools/nx-native/ that matches \*\*/CMakeLists.txt and emits build/test/fmt/lint targets shelling out to cmake --build, ctest, clang-format, clang-tidy — and let mise.toml pin the toolchain versions. Document the escape hatch up front: if C/C++ ever becomes a primary backend stack (more than one service, complex linker matrix), the template recommends migrating those projects to Bazel + rules_cc rather than scaling the Nx integration.

**Citations:**

- [Nx Plugin Registry (no C/C++ entries)](https://nx.dev/docs/plugin-registry)
- [Nx 2026 Roadmap (mise, .NET, Python, no C/C++)](https://nx.dev/blog/nx-2026-roadmap)
- [nx-cmake npm registry metadata (v0.7.2, 2024-03-19)](https://registry.npmjs.org/nx-cmake)
- [clemenscodes/nx-plugins (archived host repo)](https://github.com/clemenscodes/nx-plugins)
- [nx-cmake Socket.dev security analysis](https://socket.dev/npm/package/nx-cmake)
- [Nx CreateNodesV2 devkit reference](https://nx.dev/docs/reference/devkit/CreateNodesV2)
- [Inferred Tasks (Project Crystal) concept docs](https://nx.dev/docs/concepts/inferred-tasks)
- [Integrate a New Tool with a Tooling Plugin tutorial](https://nx.dev/extending-nx/tutorials/tooling-plugin)
- [Inferred Config for Nx Monorepos (Brian Schiller)](https://brianschiller.com/blog/2025/06/04/inferred-nx-config/)
- [Monorepo Tooling in 2026 (Nx vs Bazel for C++)](https://codewithyoha.com/blogs/monorepo-tooling-in-2026-nx-turborepo-and-bazel-compared)
- [Polyglot Monorepo: Nx + mise (agsolutions)](https://www.agsolutions.at/en/stories/polyglot-monorepo-how-nx-mise-pulumi-and-exoscale-work-together)
- [Nx core npm package (current 22.7.5)](https://registry.npmjs.org/nx)

### Angle: Developer experience

Picture the first 30 minutes of a junior engineer cloning the ts-monorepo-template, opening it in VS Code, and running `task dev:my-native-sdk` to scaffold and edit a C++ library. In TypeScript-land that single command would give them: project files, a dev server, hot reload, jump-to-definition, autocomplete, and a passing test. In C++-land each of those is a separate fight.

What "Nx + C/C++" actually means in 2026: there is no first-party Nx plugin for C/C++. The only community plugin people Google to is `nx-cmake` (npm), which had ~2 weekly downloads and its last meaningful release over a year ago — effectively unmaintained. So the realistic options are: (a) wrap CMake+Ninja with a thin custom inferred-tasks plugin (Project Crystal style, Nx 18+), or (b) just call CMake via `nx:run-commands` and accept Nx is only a graph+cache wrapper, not a generator. Either way, the build is CMake+Ninja+ccache/sccache underneath; Nx contributes project-graph awareness and remote cache.

The day-to-day loop looks like this. `task scaffold:cpp-lib` writes a directory with `CMakeLists.txt`, `src/`, `include/`, `tests/` (Catch2 or GoogleTest), a `CMakePresets.json` (debug/release/asan), and a `vcpkg.json` or `conanfile.txt`. First build is slow: CMake configures, downloads/builds dependencies (vcpkg compiles from source; Conan pulls prebuilt binaries when available), then Ninja compiles. Incremental edits then go through Ninja, which is fast — millisecond dep analysis. ccache or sccache catches cross-branch and cross-worktree hits. Nx adds an outer layer of caching keyed on inputs, so `nx build my-lib` is a no-op when nothing changed.

"Hot reload" mostly does not exist for C++ the way it does for Node. The closest thing is `cmake --build --target my-lib && ./build/tests/test_my_lib` on file save (via `entr`, `watchexec`, or a `task` watch target). Visual Studio has true Hot Reload for native CMake, but that's a Windows IDE feature, not a portable workflow. Tests are the dev loop.

Debugging means VS Code + the CMake Tools extension (Microsoft) + either cpptools or CodeLLDB. CMake Tools generates `compile_commands.json` (a JSON list of "this file was compiled like this"), which clangd reads to power autocomplete and jump-to-definition. The catch: clangd looks for ONE `compile_commands.json` and walks up parent dirs to find it. In a monorepo with N projects each producing its own compile DB inside `build/<project>/`, clangd often picks the wrong one or none — symbols don't resolve, and the engineer thinks the editor is broken.

Where it hurts: dependency bootstrap (a fresh clone with no Conan/vcpkg cache can take 20–60 minutes building OpenSSL, Protobuf, etc. from source), toolchain divergence (Linux gcc vs macOS Apple-clang vs Windows MSVC ABIs differ, and bindings to Go/Python/Rust break differently per platform), and the LSP-vs-build-dir gotcha above. Where it's slick: once the cache primes, Ninja+ccache rebuilds are sub-second, Nx caches the test step, and the FFI surface (cgo, ctypes/cffi, bindgen) only needs to point at the resulting `.so`/`.dylib`/`.dll`.

**Key findings:**

- The community plugin `nx-cmake` (npm) has roughly 2 weekly downloads and has not had a release in over a year as of mid-2026, making it effectively unmaintained for a commercial template.
- Nx Project Crystal (inferred tasks) lets a custom plugin discover `CMakeLists.txt` or `CMakePresets.json` files and synthesize `build`/`test`/`lint` targets without per-project `project.json` boilerplate — this is the realistic path forward for the template.
- Ninja+CMake is the de facto C/C++ build pair; Ninja's millisecond dep analysis makes incremental rebuilds feel fast once the initial configure step is done.
- Compiler-level caching (ccache for local, sccache for remote/CI) layered under Nx's task cache is the only way to get acceptable first-build times after a `git clean` or fresh clone — without it, Nx cache misses cost minutes.
- Hot reload as TS developers know it does not exist for C/C++ portably; the dev loop is `watchexec`/`entr`-driven test reruns or VS Code 'CMake Tools: Run Without Debugging' on save (Visual Studio's native Hot Reload is Windows-only).
- clangd (the LSP that powers IDE autocomplete in VS Code, Zed, Neovim) requires a `compile_commands.json` and reliably struggles when multiple per-project build dirs each emit their own copy — engineers see broken jump-to-definition and assume the editor is misconfigured.
- vcpkg compiles dependencies from source by default (slow, reproducible, ABI-matched to your toolchain) while Conan defaults to prebuilt binaries (fast but binary-compat surprises) — the choice has direct first-onboarding-time impact.
- CMakePresets.json (CMake 3.19+) is the modern way to pin generator, toolchain, build dir, and cache vars per profile (debug/release/asan/tsan) and is what a sane template scaffold should generate, not raw command-line args in a Taskfile.
- FFI from Go (cgo), Python (ctypes/cffi/pybind11), and Rust (bindgen/cxx) all consume the same C ABI shared library, so the template's 'ship native SDK and link it' use case is genuinely supported once a `.so`/`.dylib`/`.dll` exists — but bindings must be regenerated or checked in per target platform.
- Nx 22.7 (2026) adds worktree-aware caching and task sandboxing, which materially helps C++ where build dirs are large and prone to hidden inputs.
- Bazel + rules_cc is genuinely better than Nx+CMake for very large polyglot C++ shops (remote execution, hermetic builds, polyglot graph), but its learning curve and CMake-interop gaps make it overkill for the template's 'one native SDK' use case.

**Gotchas:**

- clangd will silently latch onto the wrong `compile_commands.json` in a multi-project monorepo and the engineer will blame VS Code; the fix is a root-level merged compile DB symlink or a `.clangd` file per project pointing to its build dir.
- vcpkg's first install can take 30–60 minutes on a fresh laptop because it compiles OpenSSL, Protobuf, gRPC, etc. from source — junior engineers will think the scaffold is hung and Ctrl-C it.
- Nx caches by input hash, but CMake's configure step writes absolute paths into `CMakeCache.txt`, so naive Nx caching of `cmake -B build` breaks across machines or worktrees; cache the build artifacts, not the configure output.
- ccache works transparently only when `CMAKE_C_COMPILER_LAUNCHER=ccache` is set BEFORE first configure — adding it later does nothing because CMake doesn't re-detect launchers, and engineers blame ccache.
- ASAN/UBSAN/TSAN builds require their own preset and their own build dir; mixing them into the same dir produces link errors that look like compiler bugs.
- Cross-language FFI generation (bindgen, cgo, pybind11) needs the C header to be stable; if the C++ API changes and bindings aren't regenerated in CI, downstream Go/Python/Rust callers segfault at runtime with no compile error.
- Windows builds in this template are a trap: MSVC vs MinGW vs clang-cl all produce different ABIs, and the same `.dll` won't load from a Go binary built with a different toolchain — pick one and document it.
- `task dev:my-native-sdk` cannot just `cmake --build` on file change without also invalidating the Nx cache; either Nx owns the watch loop (slow startup per change) or the Taskfile does (Nx graph goes stale) — the template must pick a side.

**Recommendation (this angle):** Treat C/C++ as a second-class but supported citizen: build a thin custom Nx inferred-tasks plugin that discovers `CMakePresets.json` and exposes `build`/`test`/`lint`/`format` targets, delegate the actual work to CMake+Ninja+ccache (with sccache+S3 in CI), and ship a root-level `.clangd` plus a merged `compile_commands.json` symlink so the IDE Just Works on day one. Do not adopt or fork the abandoned `nx-cmake` package, and do not pull in Bazel — the template's use case is "one native SDK linked into Go/Python/Rust services", not "polyglot C++ monorepo", and Bazel's setup cost would dwarf the value.

**Citations:**

- [Inferred Tasks (Project Crystal) | Nx](https://nx.dev/docs/concepts/inferred-tasks)
- [Nx Plugin Registry](https://nx.dev/docs/plugin-registry)
- [Extending Nx with Plugins](https://nx.dev/extending-nx/intro/getting-started)
- [nx-cmake - npm Package Security Analysis - Socket.dev](https://socket.dev/npm/package/nx-cmake)
- [Nx 22.7 Release Notes — Task Sandboxing, Worktree-Aware Caching](https://nx.dev/blog/nx-22-7-release)
- [How Caching Works | Nx](https://nx.dev/docs/concepts/how-caching-works)
- [clangd — Compile commands design](https://clangd.llvm.org/design/compile-commands)
- [clangd issue #1092: Allow specifying more than one compile_commands.json](https://github.com/clangd/clangd/issues/1092)
- [Powering clangd-based C++ IDEs with compile_commands.json](https://jifengwu2k.github.io/2025/08/11/Powering-clangd-based-C-IDEs-with-compile-commands-json/)
- [vscode-cmake-tools debug-launch documentation](https://github.com/microsoft/vscode-cmake-tools/blob/main/docs/debug-launch.md)
- [Hot Reload for native C++ in Visual Studio](https://learn.microsoft.com/en-us/visualstudio/debugger/hot-reload?view=visualstudio)
- [Vcpkg, Conan or Spack for C++ Dependencies in a CMake Project](https://cryos.net/2024/03/vcpkg-conan-or-spack-for-c-dependencies-in-a-cmake-project/)
- [Improve Productivity with CMake and Compiler Cache Integration (ccache)](https://radugin.com/posts/2024-07-15/improve-productivity-with-cmake-ccache/)
- [sccache GitHub repository (Mozilla)](https://github.com/mozilla/sccache)
- [How to compile C++ in 2025 — Bazel or CMake?](https://sysdev.me/2025/01/20/how-to-compile-c-in-2025-bazel-or-cmake/)

### Angle: Production readiness

Imagine you're shipping a C++ library — say, a fast tokenizer — and you want it to be (a) callable from your Go service, (b) loadable by Python via pybind11, (c) downloadable as a standalone CLI for macOS, Linux, and Windows, and (d) trusted enough that nobody's antivirus or Gatekeeper blocks it. That's the "production readiness" job for C/C++ in this monorepo.

Here's the honest shape of it in 2026:

1. Build. The actual compile step is CMake. Nx does not build C++; it orchestrates. The plugin `nx-cmake` exists but its last release was over a year ago and it gets ~2 weekly downloads — it's effectively unmaintained. So the realistic Nx layer is a custom inferred plugin (or thin `nx:run-commands` wrappers) that calls CMake presets per project and tells Nx's task graph "this C++ project depends on these other targets." Nx then gives you affected-graph + remote cache. The build engine is still CMake.

2. Dependencies. You pick exactly one: vcpkg (manifest mode + binary caching to GHCR or Azure Blob) or Conan 2 (lockfile + Artifactory or a JFrog free tier). vcpkg wins if you live in CMake-land and want a one-file `vcpkg.json` with a baseline pin. Conan wins if you need per-config binary management or multi-profile cross-compilation. Don't run both.

3. CI/CD. The de-facto pattern is GitHub Actions with a matrix of `ubuntu-24.04`, `windows-2022`, `macos-14`, `macos-13`, optionally `ubuntu-24.04-arm`. The community action `aminya/setup-cpp` (v1.8.0, Jan 2026) installs MSVC/Clang/GCC + clang-tidy + cppcheck + the package manager. Each job runs `cmake --preset … && cmake --build … && ctest && cpack`. CPack produces DEB/RPM/MSI/NSIS/DMG.

4. Signing — three separate worlds:
   - Apple: `codesign --options=runtime --timestamp` then `xcrun notarytool submit … --wait`. `altool` was removed in 2023.
   - Windows: Azure Artifact Signing (formerly Trusted Signing) is now GA. ~$10/mo, no EV certs ever, 24-hour rotating certs, SmartScreen reputation builds the same as OV. The old "buy a $500 EV cert on a USB token" workflow is dead since 2024.
   - Linux + cross-platform integrity: cosign keyless signing using GitHub OIDC. `cosign sign-blob` over the artifact, store the bundle next to the release. No long-lived keys.

5. Distribution. Containers via OCI registry (multi-stage: builder image with vcpkg → distroless or `gcr.io/distroless/cc-debian12`). CLI binaries via Homebrew tap (Homebrew itself now emits Sigstore provenance), `winget`/Microsoft Store for Windows, `apt`/`dnf` via custom repos for Linux, plus direct GitHub Releases with SHA-256 sums + cosign bundles. Mobile SDKs (iOS XCFramework, Android AAR) only matter if you ship native SDK to RN/Expo or .NET MAUI — otherwise skip.

What's genuinely hard, and why: C/C++ has no native dependency graph the way Cargo or pnpm does, so SBOMs are a four-signal hack (build inspection + vendored-code fingerprinting + linker introspection + platform SDK awareness). Reproducible builds work but only if you set `SOURCE_DATE_EPOCH`, strip RPATH absolute paths, and pin the toolchain image. GoReleaser does NOT have first-class C/C++ support (Go/Rust/Zig/Python/TS only), so you cannot reuse the Tauri/Rust release pipeline — you need bespoke CPack + cosign + notarytool glue.

For this template, the honest framing for the C/C++ team is: "we ship a small native SDK that links into Go/Python/Rust via FFI; CPack + cosign keyless + setup-cpp matrix; everything else (App Store, Snap, Microsoft Store) is out of scope unless you're shipping a desktop app — in which case Tauri is a better seat."

**Key findings:**

- nx-cmake (community Nx plugin for CMake/C/C++) is effectively unmaintained — last release ~12 months ago and only ~2 weekly npm downloads, so the template will need a custom inferred plugin (or thin run-commands wrappers) rather than relying on it.
- The production toolchain installer of choice is aminya/setup-cpp v1.8.0 (Jan 2026), which supports Windows 11/10/2022/2019, Ubuntu 18.04-24.04, Fedora, ArchLinux, macOS 10.15-15 across x64/ARM/x86/ARM64 with LLVM/GCC/MSVC/Apple Clang.
- GoReleaser added Rust + Zig support in 2025 but still does NOT have first-class C/C++ builders — only `go`, `rust`, `zig`, and `prebuilt` (pro-only); a separate CPack + cosign + notarytool pipeline is required.
- Windows code signing is now mostly Azure Artifact Signing (formerly Trusted Signing), GA as of April 2026, ~$10/mo for 5,000 sigs/mo, restricted to US/Canada/EU/UK businesses, with 24-hour rotating certs and no EV certs (Microsoft has explicitly stated no plans to issue EVs).
- Apple notarization in 2026 uses `xcrun notarytool submit --wait` exclusively; altool was deprecated/removed in 2023, and notarization requires Hardened Runtime (`codesign --options=runtime --timestamp`) plus packaging in .zip/.dmg/.pkg.
- Cosign v2.5+ supports keyless signing via GitHub Actions OIDC (`id-token: write` permission, issuer `https://token.actions.githubusercontent.com`) and emits the standardized Sigstore bundle format; this is the same flow Homebrew now uses for build provenance on bottles.
- CMake CPack remains the canonical multi-platform packager — produces DEB, RPM, NSIS (Windows), WiX MSI, .dmg, .pkg, and .tar.gz from one CMakeLists.txt with `set(CPACK_GENERATOR "DEB;RPM;NSIS")`.
- vcpkg + manifest mode is the lower-friction choice for CMake-centric projects (single vcpkg.json + baseline commit); Conan 2 wins for explicit lockfiles, multi-profile cross-compilation, and Artifactory-backed binary caches.
- SBOM generation for C/C++ is fundamentally harder than for managed-package ecosystems and requires a four-signal approach (package-manager metadata + linker introspection + vendored-code fingerprinting + platform SDK awareness) — no single tool produces complete NTIA-compliant output.
- Reproducible C++ builds require setting SOURCE_DATE_EPOCH (replaces `__DATE__`/`__TIME__`), avoiding absolute RPATHs in ELF, and using ZERO_AR_DATE under Clang — Debian Bookworm's essential package set hit 100% reproducibility on amd64/arm64 with these techniques.
- For container distribution, rules_oci + distroless cc image (`gcr.io/distroless/cc-debian12`) is the modern Bazel path; for non-Bazel CMake projects, multi-stage Dockerfile with builder image → distroless cc base is the equivalent.
- Real reference projects: DuckDB (CMake + GitHub Releases + SHA-256 sums, 1.5.0 in March 2026), Sigstore Cosign itself (GoReleaser + Sigstore bundle next to release assets, but it's Go not C++), and ddev/signing_tools as a working macOS+Windows signing reference.

**Gotchas:**

- nx-cmake is effectively abandoned — don't make it a core dependency of the template; either fork it, write a tiny inferred plugin (`createNodesV2`) that turns `CMakeLists.txt` into Nx project nodes, or just use `nx:run-commands` targets.
- Azure Artifact Signing is geo-restricted to US/Canada/EU/UK business entities; an Indian or other non-listed entity cannot use the cheap managed signing path and must fall back to a traditional OV/EV cert through a CA reseller.
- EV code-signing certificates no longer bypass Windows SmartScreen on first download — that behavior was removed in 2024, so paying the EV premium ($300-700/yr + USB token) is largely wasted in 2026.
- GoReleaser's Rust support uses cargo-zigbuild under the hood — DO NOT assume that means C/C++ also works; C/C++ has no first-class builder and would have to use the `prebuilt` (Pro-only) path, which means a separate CMake/CPack pipeline.
- Apple notarytool only accepts .zip/.dmg/.pkg outer containers — you cannot submit a raw Mach-O binary, you must wrap it, and the binary inside must already be codesigned with Hardened Runtime + secure timestamp.
- vcpkg binary caching requires explicit configuration (`X_VCPKG_NUGET_ID_PREFIX`, `VCPKG_BINARY_SOURCES`) and a backing store (GHCR, Azure Blob, NuGet feed, or local mount); without it every CI run rebuilds from source and matrix builds explode to multi-hour wall times.
- `SOURCE_DATE_EPOCH` only addresses date macros — RPATH absolute paths, thread-ordering in parallel link, and embedded build paths still leak non-determinism into Linux ELF outputs; the Conan reproducible-builds doc covers the full checklist.
- Cosign keyless signatures expire because the short-lived cert has a 10-minute lifetime — verification works forever because the Rekor transparency log entry is permanent, but you MUST upload to Rekor (default behavior) or the signature becomes unverifiable.

**Recommendation (this angle):** For this template, treat C/C++ as the "native SDK" stack, NOT a primary backend target. Standardize on: CMake + vcpkg manifest mode + a custom 100-line Nx inferred plugin that discovers `CMakeLists.txt` files; `aminya/setup-cpp@v1.8.0` matrix in GitHub Actions across `ubuntu-24.04`, `windows-2022`, `macos-14`; CPack for native packaging; cosign keyless signing of every release asset via GitHub OIDC; Apple `notarytool` for macOS, Azure Artifact Signing for Windows (with a documented fallback path for non-eligible regions). Skip Bazel for this template — its monorepo strength only pays off above ~50 C++ targets and would fork the polyglot story away from Nx; revisit only if a downstream team's C++ surface area outgrows what Nx + CMake can model.

**Citations:**

- [aminya/setup-cpp — GitHub Action for C/C++ toolchains (v1.8.0, Jan 2026)](https://github.com/aminya/setup-cpp)
- [nx-cmake on Socket.dev — maintenance/health analysis](https://socket.dev/npm/package/nx-cmake)
- [Sigstore Cosign — keyless signing and v2.5+ release notes](https://github.com/sigstore/cosign)
- [Sigstore Cosign Quickstart — keyless GitHub OIDC flow](https://docs.sigstore.dev/quickstart/quickstart-cosign/)
- [Azure Artifact Signing (formerly Trusted Signing) — Microsoft](https://azure.microsoft.com/en-us/products/artifact-signing)
- [Azure Artifact Signing FAQ — no EV certs, pricing, geo restrictions](https://learn.microsoft.com/en-us/azure/artifact-signing/faq)
- [macOS code signing + notarization with notarytool (Melatonin)](https://melatonin.dev/blog/how-to-code-sign-and-notarize-macos-audio-plugins-in-ci/)
- [ddev/signing_tools — reference repo for macOS+Windows signing](https://github.com/ddev/signing_tools)
- [CMake CPack — multi-platform packaging reference](https://cmake.org/cmake/help/book/mastering-cmake/chapter/Packaging%20With%20CPack.html)
- [GoReleaser — Rust + Zig support announcement (no C/C++ first-class)](https://goreleaser.com/blog/rust-zig/)
- [Conan deterministic builds — reproducibility checklist for C/C++](https://blog.conan.io/2019/09/02/Deterministic-builds-with-C-C++.html)
- [SOURCE_DATE_EPOCH spec — reproducible-builds.org](https://reproducible-builds.org/docs/source-date-epoch/)
- [Interlynk — State of SBOM Generation for C/C++ 2026 Edition](https://www.interlynk.io/resources/the-state-of-sbom-generation-for-c-c-2026-edition)
- [bazel-contrib/rules_oci — C++ container image rules](https://github.com/bazel-contrib/rules_oci/blob/main/docs/cpp.md)
- [OpenSSF — Build Provenance and Code Signing for Homebrew](https://repos.openssf.org/proposals/build-provenance-and-code-signing-for-homebrew.html)

### Angle: Tradeoffs + recommendation

Imagine you're a founder picking up the ts-monorepo-template. The template already gives you TypeScript, Python, Go, and Rust — four languages that cover almost every shape of work a startup actually does: web apps, scripts, services, performance-critical stuff. Now someone asks: "should we also add C and C++ to this monorepo?"

The honest answer is: probably not, for almost everyone, almost always. Here's why, told plainly.

Nx is a TypeScript-rooted tool. It's spectacular at orchestrating JS/TS, and it's gotten quite good at Java (Gradle, Maven), .NET, Python, Go through plugins. But for C/C++, there is no first-party plugin from Nx. The Nx 2026 roadmap explicitly names Python and .NET as priorities and explicitly does not mention C or C++. The only real community option is `nx-cmake`, sitting at version 0.7.2, last published over a year ago, with a single maintainer. That's not a foundation a startup template can stand on.

Meanwhile, the actual C/C++ world has its own answers: CMake + (vcpkg or Conan) is the pragmatic standard, and Bazel + rules_cc is what you reach for at Google-scale. If you genuinely ship C++ at scale, you don't want Nx wrapping CMake — you want CMake directly, with all the toolchain files, target triplets, and presets that the C++ ecosystem expects.

So when does C/C++ in the template make sense? Almost exclusively one case: you ship a native SDK as your product, and you generate Rust/Go/Python bindings off it. Even then, the 2026 trend is moving the other way — the WebAssembly Component Model is starting to replace C-ABI FFI as the polyglot interop boundary, and Rust with cbindgen now beats C as the "write once, expose to everyone" lingua franca. For embedded firmware, you'd use PlatformIO or Zephyr's west, not Nx.

For the launcher CLI's five profiles, the answer is uniform: none of them should bundle C/C++ by default. A `Just Me` user doesn't need it. A `Production at Scale` shop that needs native code has its own opinions and won't accept what we ship anyway. The right move is to leave a documented escape hatch (an opt-in `add_app --lang=cpp` that scaffolds a CMake project as a leaf Nx node with cached `build`/`test` targets via a custom `createNodesV2` plugin), but not ship anything in the default profile materializations. Sharp templates win by saying no.

**Key findings:**

- Nx 2026 roadmap explicitly lists Python and .NET as polyglot priorities and does not mention C or C++, signaling no first-party investment is planned.
- The only meaningful Nx C/C++ plugin, nx-cmake, is stuck at v0.7.2 with the last release over a year ago and a single maintainer; Socket.dev flags the release cadence as 'not healthy'.
- In Nx 22, CreateNodes V1 was removed; any custom CMake plugin must use createNodesV2, which works fine for detecting CMakeLists.txt files but is a build-and-maintain cost the template owner inherits.
- CMake remains the de-facto C/C++ build system; vcpkg (Microsoft) and Conan (JFrog) are the two mature, CMake-integrated package managers in 2026.
- Bazel + rules_cc is the right answer for Google-scale polyglot monorepos but is a wholesale replacement for Nx, not a coexistence story — small teams pay disproportionate setup cost.
- Go 1.26 reduced cgo call overhead ~30%, making Go-to-C FFI cheaper than it has historically been — but the boundary is still 'expensive in hot paths'.
- Rust's cbindgen lets Rust expose a C ABI to any FFI-capable language, which means a startup that wants 'one core, many language bindings' typically reaches for Rust-as-the-core, not C++.
- The WebAssembly Component Model + WIT IDL is emerging in 2026 as a higher-level polyglot interop replacement for C-ABI FFI, with a Canonical ABI that handles strings/records/variants natively.
- Mobile native code paths (React Native pure C++ TurboModules, Flutter dart:ffi, Android NDK) all expect raw CMake projects, not Nx-wrapped C++ — adding Nx in between is friction.
- The platform-foundation spec's polyglot stack is explicitly TypeScript + Go + Python + Rust; C/C++ is not part of the reference apps or contracts pipeline.

**Gotchas:**

- nx-cmake's project graph is built by parsing `gcc -MM` output — this works on Linux/macOS with GCC/Clang but is brittle on Windows MSVC and silently breaks cross-compilation.
- Adding C/C++ to the template forces every contributor to install a C toolchain (GCC/Clang/MSVC) and CMake; this contradicts the Nx 2026 'lazy graph hydration' principle that JS-only devs shouldn't need other-language tooling.
- Buf/Protobuf (the existing contracts pipeline) has no first-class C++ binding generator that integrates cleanly with Nx caching — protoc-gen-cpp produces files but cache invalidation across cmake's two-phase configure/build is non-trivial.
- cmake's FetchContent and Conan/vcpkg lockfiles don't compose cleanly with Nx's input-hash model — you either lose Nx's cache hit rate or you maintain a custom hashing layer on top of the CMake cache.
- Picking nx-cmake locks you into the maintainer's particular CMake conventions (global root CMakeLists.txt, injected include directory, transitive reduction on the graph) that conflict with how most C++ shops structure projects.
- The C ABI boundary is unsafe by default — any C/C++ leaf shipped in a polyglot monorepo becomes a fuzzing/sanitizer/CVE-tracking burden the rest of the template doesn't have, and the template's audit-log/SBOM tooling would need C-specific extensions.
- If the user's actual need is 'a native SDK with multi-language bindings', the modern 2026 default is Rust + cbindgen (or a WIT/Component Model module), not C++ — recommending C++ in this template would push users toward a legacy interop pattern.

**Recommendation (this angle):** Exclude C/C++ from the ts-monorepo-template's default profiles, all five of them. Ship instead a documented `add_app --lang=cpp` escape hatch that scaffolds a CMake + vcpkg leaf using a thin custom `createNodesV2` plugin (don't depend on the stale nx-cmake), and steer users who want a polyglot native core toward Rust + cbindgen — which the template already supports first-class. This keeps the template sharp, avoids inheriting an unmaintained community plugin, and aligns with Nx's own 2026 roadmap, which does not invest in C/C++.

**Citations:**

- [Nx 2026 Roadmap](https://nx.dev/blog/nx-2026-roadmap)
- [nx-cmake — Socket.dev package analysis](https://socket.dev/npm/package/nx-cmake)
- [Nx 22 Release: Expanding the build platform](https://nx.dev/blog/nx-22-release)
- [CreateNodes API Compatibility — Nx docs](https://nx.dev/docs/extending-nx/createnodes-compatibility)
- [Extending the Project Graph — Nx docs](https://nx.dev/docs/extending-nx/project-graph-plugins)
- [C++ Package Managers: The Ultimate Roundup (Modern C++ DevOps)](https://moderncppdevops.com/pkg-mngr-roundup/)
- [How to compile C++ in 2025: Bazel or CMake?](https://sysdev.me/2025/01/20/how-to-compile-c-in-2025-bazel-or-cmake/)
- [How Go 1.26 Improves cgo Performance by ~30%](https://ademawan.medium.com/how-go-1-26-improves-cgo-performance-by-30-4852aab2c782)
- [rust-lang/rust-bindgen (cbindgen ecosystem reference)](https://github.com/rust-lang/rust-bindgen)
- [WebAssembly Component Model — Composing Components](https://component-model.bytecodealliance.org/composing-and-distributing/composing.html)
- [The State of SBOM Generation for C/C++: 2026 Edition (Interlynk)](https://www.interlynk.io/resources/the-state-of-sbom-generation-for-c-c-2026-edition)
- [Cross-Platform Native Modules (C++) — React Native docs](https://reactnative.dev/docs/the-new-architecture/pure-cxx-modules)
- [Cross-Compilation in 2026: Toolchain, Target Triplet, C Library](https://proteanos.com/doc/cross-compilation-toolchain-triplet-clib-2026/)
- [Building a Polyglot Monorepo with React, Rails, and Go using Nx](https://emilyxiong.medium.com/building-a-polyglot-monorepo-with-react-rails-and-go-using-nx-868af31d01e7)
- [Sentry Native SDK (C/C++ with C bindings)](https://docs.sentry.io/platforms/native/)

## Team 3 — Nx + Tauri (desktop)

### Synthesized verdict

**Verdict:** `include-only-on-demand` | **Fit score:** 55 / 100 | **Default profile bundles:** _(none by default)_

**Reasoning:**

All four angle agents converge on a single uncomfortable correction first: the team brief's premise — that `@nxext/tauri` is the primary integration plugin — is factually wrong in 2026. The package returns 404 on npm, is absent from the nxext/nx-extensions monorepo (which ships nine packages, none named tauri), and there is no other Nx-blessed Tauri plugin. The actual 2026 pattern is two-layer: `@monodon/rust@^3.0.0` (Nx-endorsed for `nx release` of Rust crates, requires Nx 22) makes `src-tauri/` a first-class graph project via its `*/**/Cargo.toml` `createNodesV2` glob, and `nx:run-commands` in the app's `project.json` wraps `cargo tauri dev|build|android|ios`. There is no scaffolding magic and no "Tauri executor" — anyone expecting `nx g @something/tauri:app` will be disappointed. This is the actual primary path, not an "alternative."

Tauri 2 itself (2.11.x as of May 2026, GA Oct 2024) is a credible and increasingly mature Electron replacement: Hoppscotch's 165MB→8MB and ~70% memory reduction is the canonical proof, and Spacedrive/AppFlowy/Padloc are real production users. For founders who genuinely need a desktop binary, Tauri 2 over Electron is the correct 2026 call. But the operational cost of including it by default in a template is high and falls disproportionately on users who didn't ask for it: a Rust toolchain on every clone, a 3–8 minute first `cargo tauri dev` build that looks like a hang to juniors, a silent rust-analyzer/tauri-cli cache-thrash that turns 10s rebuilds into 60s+ rebuilds without a tuned `.vscode/settings.json`, Linux WebKitGTK CSS regressions, and a code-signing pipeline that is genuinely hard post-June-2023 (Windows OV/EV certs must live in a FIPS 140-2 L2 HSM — the "buy a .pfx, paste it in GH secrets" workflow is dead).

The production-readiness picture is the most damning for "bundle by default." Shipping a real Tauri app means an 11-secret inventory (6 Apple, 3 Azure KV for Windows signing, 2 minisign updater), a non-deterministic notarytool retry path (P95 ~15min, occasional multi-hour stalls per discussion #8630), an irrecoverable updater private key (lose it and all installed users are stranded with no upgrade path), Mac App Store vs Developer ID being separate certs with separate notarizations, and a GitHub Actions matrix that needs `ubuntu-22.04-arm` (public-repo-only) or `pguyot/arm-runner-action` (~10x slower) for ARM Linux. None of this is appropriate to force on a "Just Me" or "Side Project" user who wanted a marketing site.

But the template can absolutely WIN here as an opt-in. The work nobody else has packaged — the rust-analyzer cache-isolation `.vscode/settings.json`, the tuned `[profile.dev.package."*"]` Cargo.toml, the two-preset Windows signing guidance (Azure Key Vault + AzureSignTool + OIDC for commercial users, SignPath Foundation for OSS), the minisign keypair backup discipline, the notarytool retry-on-stall job, the sidecar target-triple naming convention for the polyglot workers already in the monorepo — is exactly the integration tax that hand-rolled Tauri projects pay over and over. Bundling that as an opt-in `--with-desktop` flag for Scaling Startup and an enabled-by-default profile for Production at Scale (when the user explicitly selects a desktop product during launcher CLI) is a defensible, sharp recommendation. The fit_score of 55 reflects "high value when wanted, high tax when unwanted" — not a NO, but not a default.

The honest competitive frame: Electron is still the safer default if a user has no opinion (more mature CI, electron-builder/electron-forge are battle-tested, no Linux WebKitGTK quirks, no Rust toolchain). Tauri wins on bundle size, RAM, security model, and a shared codebase with mobile if/when the user adds it later. The template should not pretend this is a slam dunk in either direction — it should let the launcher CLI ask "do you need a desktop binary?" and only then surface the Tauri integration with eyes-open cost documentation.

**Integration outline:**

Concrete steps to integrate Tauri 2 as an opt-in path in ts-monorepo-template:

1. **Launcher CLI gate.** Add a `--with-desktop` flag (and an interactive prompt "Do you need a desktop binary?"). Default off for all profiles. Enable in the `p-startup-scale` and `p-enterprise` presets only when the user explicitly answers yes. Surface the cost up front: "this adds a Rust toolchain dependency, ~3–8 minute first build, and a code-signing pipeline at release time."

2. **Pin and install (DO NOT add `@nxext/tauri` — it does not exist on npm).**
   - `pnpm add -D @monodon/rust@^3.0.0 @tauri-apps/cli@2.11.2`
   - `pnpm add @tauri-apps/api@2.11.0` in the desktop app workspace
   - Pin `create-tauri-app` to `4.6.2` in the launcher's scaffold step
   - Verify Nx is at 22+ (template should already be on Nx 22.7.x per current ecosystem state)

3. **Scaffold layout.** `pnpm dlx create-tauri-app apps/desktop --template react-ts --manager pnpm`, then relocate `src-tauri/` under `apps/desktop/`. Patch `tauri.conf.json`:
   - `frontendDist` → relative path to Nx-built Vite `dist/`
   - `devUrl` → `http://localhost:1420` (pin and document the port to avoid Vite/Storybook collisions)
   - `bundle.createUpdaterArtifacts` → `true` (otherwise no `.sig` files generated and updater silently fails)

4. **Nx wiring.** Add `apps/desktop/project.json` with `nx:run-commands` targets — `dev`, `build`, `android-dev`, `ios-dev`, `bundle:macos`, `bundle:windows`, `bundle:linux` — each invoking the Tauri CLI. `@monodon/rust`'s `createNodesV2` automatically picks up `src-tauri/Cargo.toml` and adds the crate to the project graph for affected-detection. Verify with `pnpm dlx nx graph`.

5. **DX hardening files (these are the non-obvious differentiators).**
   - `apps/desktop/.vscode/settings.json` with `rust-analyzer.cargo.extraEnv` setting `MACOSX_DEPLOYMENT_TARGET` to match `tauri.conf.json` AND `rust-analyzer.cargo.targetDir: target/analyzer` — without this, every save invalidates the `cargo tauri dev` cache.
   - `src-tauri/Cargo.toml` with `[profile.dev.package."*"] opt-level = 1` to keep dep rebuilds fast.
   - Strict `src-tauri/.taurignore` to mitigate the Vite-watches-src-tauri infinite-reload bug (issue #12141).
   - Launcher CLI banner: "First `cargo tauri dev` will compile ~300 crates and take 3–8 minutes. This is normal. Do not Ctrl-C."

6. **Sidecar pattern for polyglot workers.** Document and template the `tauri.conf.json > bundle > externalBin` mechanism with target-triple-suffixed binary names (`worker-aarch64-apple-darwin`, `worker-x86_64-pc-windows-msvc.exe`, etc.). This is the natural shell for the Go/Python/Rust workers already in the monorepo. Include `shell:allow-execute` permission in `apps/desktop/src-tauri/capabilities/default.json`.

7. **Release pipeline as reusable workflow.** Ship `.github/workflows/desktop-release.yml` using `tauri-apps/tauri-action@v0.6.2` on a matrix: `macos-latest` (target `universal-apple-darwin` for fat binary), `windows-latest`, `ubuntu-22.04`. Document the optional `ubuntu-22.04-arm` runner (public-repo-only) vs `pguyot/arm-runner-action` (private repos, ~10x slower).

8. **Signing presets (two paths, user picks one).**
   - **Commercial preset:** Azure Key Vault + AzureSignTool with OIDC federated credentials (no static client secret in GH). Document the 3 AKV secrets (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, plus federated subject claim) and the 6 Apple secrets (Developer ID `.p12` base64, password, signing identity, team ID, plus App Store Connect API key triad — preferred over Apple ID + app-specific password for CI).
   - **OSS preset:** SignPath Foundation (free, HSM-backed, OV-level) for Windows; same Apple Developer ID path for macOS.
   - Both presets: 2 minisign updater secrets (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`) — pass as process env, NOT via `.env` file.

9. **Notarization retry job.** Split macOS pipeline into build + notarize stages; the notarize stage has retry-on-stall logic with a 30-minute timeout (Apple notarytool P95 ~15min, occasional multi-hour hangs).

10. **Updater key custody runbook.** Document that the minisign private key is irrecoverable — if lost, all installed users are stranded. Recommend HSM or air-gapped backup. Generate via `tauri signer generate -w` and store as a sealed secret.

11. **Helm/Crossplane/Dockerfile impact.** None for the desktop app itself (it's distributed via OS installers, not container images). The marketing-site Helm chart and the MCP server Crossplane XRDs are unaffected. The only platform touchpoint is the GitHub Actions reusable workflow plus a documented secret inventory checklist.

12. **Profile values changes.** No default-on changes to any of the 5 profiles' `values.yaml`. Add `desktop.enabled` flag (default `false`) to the launcher CLI's profile schema; surface it only in `p-startup-scale` and `p-enterprise` presets, and only when the user explicitly answers yes to the desktop prompt.

**Risks:**

- Bus-factor: @monodon/rust is single-maintainer (Cammisuli); Nx Cloud uses it internally but issue nrwl/nx#34963 was closed without absorption commitment. Pin version, monitor repo health, prepare a fork plan.
- Phantom-plugin risk: if any template docs, READMEs, or launcher prompts still reference @nxext/tauri (which does not exist on npm), users will hit a 404 on first install. Audit all references before shipping.
- Windows signing cliff: post-June-2023 OV/EV certs require FIPS 140-2 L2 HSM storage. Any guidance that still shows 'WINDOWS_CERTIFICATE base64 in GH secret' is broken. The HSM mandate adds real cost (~$200-500/yr for Azure KV or DigiCert KeyLocker) that founders may not anticipate.
- Updater key loss is unrecoverable: if the minisign private key is lost, all installed users are permanently stranded with no upgrade path. Template must enforce HSM/air-gapped backup discipline or risk catastrophic user-facing failure.
- Linux WebKitGTK incompatibilities: CSS/font/feature gaps vs Chromium cause silent visual regressions per-distro. Without a Playwright matrix that includes WebKit, breakage ships to Linux users undetected.
- DX cliffs not documented elsewhere: rust-analyzer cache-thrash (60s+ per save without the MACOSX_DEPLOYMENT_TARGET fix) and 3–8 minute cold first build will make juniors conclude 'Tauri is broken' and bounce unless the launcher CLI explicitly warns them.
- Mobile expansion temptation: Tauri 2 also targets iOS/Android, but this is a separate profile decision. Including 'mobile included' messaging in a desktop preset will confuse users who don't have Xcode/Android SDK installed.
- Nx 22 hard requirement: @monodon/rust 3.0.0 dropped createNodes v1 and requires Nx ^22. If the template ever pins Nx 21 (or users are on older monorepos), they must migrate before adding desktop support or stay on @monodon/rust 2.3.x — neither path is well-documented.

### Angle: Plugin landscape + integration mechanics

Here is the honest picture of "Nx + Tauri" in mid-2026, told straight.

First, a correction to the team brief. The brief names `@nxext/tauri` as the "primary Nx plugin." That package does not exist on the npm registry — `npm view @nxext/tauri` returns 404, and the nxext monorepo (https://github.com/nxext/nx-extensions/tree/main/packages) ships only `capacitor, common, ionic-angular, ionic-react, preact, solid, stencil, svelte, sveltekit`. No `tauri` directory, no historical release. So the starting assumption that there is a community Nx plugin dedicated to Tauri is wrong. Anyone who reads "Nx + Tauri" in a 2023-era blog and types `nx add @nxext/tauri` will hit a 404.

What actually exists in 2026 is a two-layer setup. Layer one is the Tauri CLI itself (`@tauri-apps/cli` 2.11.2, last published 2026-05-16; created via `npm create tauri-app@latest`, currently v4.6.2). Tauri is monorepo-agnostic on purpose: the maintainers said publicly in tauri-apps/tauri#7368 that "tauri itself mostly doesn't care" about your workspace tool — it only needs `frontendDist` and `devUrl` in `tauri.conf.json` to point at the right places. Layer two is the Rust side. The canonical Nx-for-Rust plugin is `@monodon/rust` 3.0.0, published 2026-06-01, requires Nx 22. Nx's own release docs (https://nx.dev/docs/guides/nx-release/publish-rust-crates) state it is "required for Nx Release to manage and release Rust crates." That is the closest thing to an official endorsement of a community Nx plugin — but it stops short of pulling it into the nrwl org (issue nrwl/nx#34963 was filed asking exactly that, closed as "outdated" with no commitment).

The way `@monodon/rust` makes Nx aware of Rust projects is the same way every modern Nx plugin does: it exports `createNodesV2` from `src/graph.ts` with the glob `*/**/Cargo.toml`. When Nx walks your workspace, it sees every `Cargo.toml`, shells out to `cargo metadata`, and turns each crate into a project node — automatically. It does _not_ parse `tauri.conf.json`. There is no "Tauri target" inference. The plugin gives you `build/check/lint/run/test/wasm-pack/napi` — all cargo wrappers. The Tauri-specific commands (`tauri dev`, `tauri build`, `tauri ios dev`) are not in the executor list.

So the pragmatic pattern is: let `@monodon/rust` own `src-tauri/` project-graph-wise, and wire `tauri dev / tauri build / tauri android build / tauri ios build` as `nx:run-commands` targets in the Tauri app's `project.json`. Two plugins, two responsibilities, no scaffolding magic but also no abandoned-plugin risk. The 5-team brief's "alternative: roll-your-own" is, in 2026, the actual primary path.

**Key findings:**

- @nxext/tauri does not exist on the npm registry (npm view returns 404 as of 2026-06-03); the nxext monorepo at github.com/nxext/nx-extensions ships nine packages — capacitor, common, ionic-angular, ionic-react, preact, solid, stencil, svelte, sveltekit — and no tauri.
- @monodon/rust 3.0.0 was published 2026-06-01, requires Nx ^22.0.0 via @nx/devkit, and is explicitly named in Nx's official Rust release guide as 'required for Nx Release to manage and release Rust crates'.
- @monodon/rust exposes generators binary, library, init, add-wasm, add-wasm-reference, preset, add-napi, create-napi-npm-dirs — and executors build, check, lint, run, test, wasm-pack, napi, release-publish. There is NO Tauri-specific generator or executor.
- Project-graph integration is via createNodesV2 with glob '\*/\*\*/Cargo.toml' (src/graph.ts); it does not parse tauri.conf.json. The plugin invokes `cargo metadata` and builds Nx project nodes from the resulting crate list.
- The legacy Nx+Rust plugin @nxrs/cargo last released 0.6.2 on 2024-05-10, two years stale — not a viable choice in 2026.
- Tauri 2 itself is at 2.11.2 (tauri, tauri-cli, @tauri-apps/cli), @tauri-apps/api 2.11.0, tauri-bundler 2.9.2, wry 0.55.1, tao 0.35.3 per https://v2.tauri.app/release/.
- create-tauri-app 4.6.2 (published 2025-08-05) is the official scaffolder; v3 was the breaking version that removed Next, next-ts, Preact, preact-ts, ClojureScript, SvelteKit templates.
- Tauri maintainer position (tauri-apps/tauri discussion #7368): Tauri is intentionally monorepo-agnostic — it only requires frontendDist + devUrl in tauri.conf.json to be correct.
- Tauri 2 mobile (iOS + Android) is initialized via `tauri ios init` and `tauri android init`, producing an Xcode project under src-tauri/gen/apple and a Gradle project under src-tauri/gen/android.
- Code signing is required on all three desktop platforms: macOS needs an Apple Developer certificate, Windows uses Authenticode (NSIS/MSI bundles), Linux ships unsigned via DEB/RPM/AppImage. Tauri also has a separate updater-signing keypair generated with `tauri signer generate`, unrelated to OS code-signing.
- Nx is at 22.7.5 as of 2026-06-03 (npm view nx version) — the team brief's reference to 'Nx 21+' is one major version behind.
- @nxrs/cargo and the original @nxext/tauri assumptions in the team brief reflect 2023-era reality; the working 2026 pattern is @monodon/rust + nx:run-commands wrappers.

**Gotchas:**

- The team brief lists '@nxext/tauri' as the primary plugin — it does NOT exist on npm. Do not put it in package.json; users will hit a 404 on first install.
- @monodon/rust 3.0.0 dropped createNodes v1 and now requires Nx 22 hard. If the template ever pins Nx 21, users must run `nx migrate latest` to 22 BEFORE adding @monodon/rust or stay on @monodon/rust 2.3.x.
- @monodon/rust's createNodesV2 glob is `*/**/Cargo.toml` — it skips a Cargo.toml at the workspace root. If you put a virtual cargo workspace manifest at repo root, it is intentionally not picked up as a project.
- There is no Nx plugin in 2026 that reads tauri.conf.json and creates 'tauri:dev' / 'tauri:build' targets. You wire those manually via nx:run-commands. Anyone expecting `nx g @something/tauri:app` to scaffold the bundle config will be disappointed.
- create-tauri-app v3+ removed templates for Next.js, SvelteKit, and Preact. If you want React+Vite (the safest 2026 default for a template), you have to either pick the 'react' template (Vite) or scaffold Vite separately then `npx tauri init`.
- Tauri's updater uses its OWN signing keypair (`tauri signer generate`) separate from OS code-signing certificates. Skipping this on first build silently disables auto-updates and there is no warning until production users fail to update.
- On iOS the Rust backend compiles to a static lib called from a Swift WKWebView shell; on Android it is a JNI lib loaded by a Kotlin WebView host. Cross-compile toolchains must be installed per platform — `tauri ios init` on Linux/Windows will refuse because Xcode is macOS-only.
- nrwl/nx#34963 (filed and closed-as-outdated with no nrwl commitment) shows @monodon/rust is a single-maintainer (Cammisuli) project that Nx Cloud uses internally but has not absorbed. Bus-factor risk is real — pin the version and watch the repo.

**Recommendation (this angle):** Do not adopt a "Tauri Nx plugin" — none exists. Use the two-layer pattern: `@monodon/rust@^3.0.0` (Nx 22, MIT, Nrwl-endorsed for `nx release`) to make `src-tauri/` a first-class graph project via its `Cargo.toml` createNodesV2 glob, and add a `project.json` to the Tauri app that maps `dev`, `build`, `android-dev`, `ios-dev` to `nx:run-commands` invoking the Tauri CLI 2.11.x. Pin `@tauri-apps/cli` 2.11.2 and `create-tauri-app` 4.6.2; bootstrap with `npx create-tauri-app@4 --template react-ts --manager pnpm` then move `src-tauri/` under `apps/desktop/` and adjust `tauri.conf.json` `frontendDist`/`devUrl` to the Vite dev server. The minimal 7-command sequence: `pnpm add -D nx@22 @nx/devkit@22 @monodon/rust@3 @tauri-apps/cli@2.11.2` → `pnpm dlx nx init` → `pnpm dlx create-tauri-app apps/desktop --template react-ts --manager pnpm` → write `apps/desktop/project.json` with run-commands targets → `pnpm dlx nx graph` to verify the crate node appears → `pnpm dlx nx run desktop:dev` → `pnpm dlx nx run desktop:build`.

**Citations:**

- [@monodon/rust on npm (3.0.0, 2026-06-01, peer @nx/devkit ^22)](https://www.npmjs.com/package/@monodon/rust)
- [Nx official guide: Using Nx Release with Rust — requires @monodon/rust](https://nx.dev/docs/guides/nx-release/publish-rust-crates)
- [@monodon/rust source — graph.ts (createNodesV2 with glob '\*/\*\*/Cargo.toml')](https://github.com/Cammisuli/monodon/blob/main/packages/rust/src/graph.ts)
- [@monodon/rust generators.json (binary, library, add-napi, add-wasm — no tauri)](https://github.com/Cammisuli/monodon/blob/main/packages/rust/generators.json)
- [@monodon/rust executors.json (build, check, lint, run, test, wasm-pack, napi)](https://github.com/Cammisuli/monodon/blob/main/packages/rust/executors.json)
- [@monodon/rust CHANGELOG — 3.0.0 drops createNodes v1, requires Nx 22](https://github.com/Cammisuli/monodon/blob/main/packages/rust/CHANGELOG.md)
- [nxext/nx-extensions packages directory — no tauri package](https://github.com/nxext/nx-extensions/tree/main/packages)
- [Tauri discussion #7368 — Monorepo Integration: Tauri is monorepo-agnostic](https://github.com/tauri-apps/tauri/discussions/7368)
- [Tauri Core Ecosystem Releases page — current versions](https://v2.tauri.app/release/)
- [Tauri 2 project structure (canonical src-tauri layout)](https://v2.tauri.app/start/project-structure/)
- [Tauri 2 create-project (create-tauri-app + manual tauri init paths)](https://v2.tauri.app/start/create-project/)
- [Nx createNodesV2 / project-graph plugin recipe](https://nx.dev/docs/extending-nx/project-graph-plugins)
- [Tauri 2 updater plugin (separate signing keypair)](https://v2.tauri.app/plugin/updater/)
- [Tauri 2 macOS code signing requirements](https://v2.tauri.app/distribute/sign/macos/)
- [nrwl/nx#34963 — Clarify official status of @monodon/rust (closed as outdated)](https://github.com/nrwl/nx/issues/34963)

### Angle: Developer experience

Imagine you cloned the ts-monorepo-template, ran `task bootstrap`, and now you want to launch the Tauri desktop app. Here is what actually happens, in plain English.

**What Tauri 2 actually is.** Tauri is two processes glued together: (1) a Rust binary that owns the OS window and any privileged work (file system, IPC, sidecar processes), and (2) a web frontend (your TS/React/Svelte) rendered in the OS's _native_ webview (WebKit on macOS/Linux, WebView2/Edge on Windows). No Chromium is shipped. Tauri 2.0 went GA in October 2024 and is the modern Electron replacement of 2026 (https://v2.tauri.app/blog/tauri-20/). Apps are ~10x smaller and add iOS + Android targets from the same Rust core.

**Day-to-day loop (`task dev:<app>`).** Under the hood, `task dev:<app>` shells out to `cargo tauri dev`. That command does three things in parallel: it starts your Vite dev server (port 1420 by default), it `cargo build`s `src-tauri/`, and it spawns a native window pointed at the dev URL. Frontend edits hot-reload in milliseconds via Vite HMR — same feel as a browser. Rust edits trigger a full `cargo` rebuild + window restart (~3-15s on a warm cache once you've tuned things) (https://v2.tauri.app/develop/).

**Where the experience is slick.** Frontend HMR is excellent — identical to web dev. Tauri 2 also extended HMR to iOS and Android emulators, which is genuinely new in 2024+ (https://v2.tauri.app/blog/tauri-20/). The JS API surface grew ~40% in v2, so common things (clipboard, fs, opener, notifications) are official plugins instead of bespoke Rust commands. `create-tauri-app` gets you to a running window in minutes, not hours.

**Where it hurts.** The first `cargo tauri dev` on a cold cache compiles 300+ Rust dependencies and takes 3–8 minutes — the single most jarring first-contributor experience (https://v2.tauri.app/develop/). After that, the real silent killer is build-cache invalidation between `rust-analyzer` (your IDE) and `cargo tauri dev`. They share `target/` but use different env vars (notably `MACOSX_DEPLOYMENT_TARGET` derived from `tauri.conf.json`), so every save invalidates the other's cache, turning 10s rebuilds into 60s+ rebuilds (https://yuexunj.com/how-to-make-your-tauri-dev-faster/). The fix is three lines of rust-analyzer config + a `[profile.dev.package."*"]` block in `Cargo.toml`, but every new contributor hits this blind.

**The Nx plugin reality check.** The team brief assumes `@nxext/tauri` exists. As of June 2026 the `nxext/nx-extensions` repo ships capacitor, ionic, preact, solid, stencil, svelte, sveltekit — no tauri (https://github.com/nxext/nx-extensions). No `@nxext/tauri` is published on npm. The community pattern is `nx:run-commands` in `project.json` wrapping `cargo tauri dev|build|android|ios`, optionally combined with `@monodon/rust` so the `src-tauri/` crate appears in the Nx project graph for affected-detection (https://v2.tauri.app/start/frontend/vite/, https://github.com/tauri-apps/tauri/discussions/7368). "Roll your own" is not a downside — it is the actual ecosystem state.

**Key findings:**

- Tauri 2.0 reached stable GA in October 2024 and unifies desktop (macOS, Windows, Linux) + mobile (iOS, Android) from one Rust core with a native-webview frontend (https://v2.tauri.app/blog/tauri-20/).
- There is no `@nxext/tauri` package on npm as of June 2026; the nxext/nx-extensions repo's packages directory contains capacitor, ionic-angular, ionic-react, preact, solid, stencil, svelte, sveltekit — no tauri (https://github.com/nxext/nx-extensions).
- The official Tauri monorepo guidance is explicitly tool-agnostic — maintainers say Tauri only cares that `devUrl` and `frontendDist` point to the right places; Nx/Turborepo/pnpm-workspaces are all fine (https://github.com/tauri-apps/tauri/discussions/7368).
- The standard 2026 Nx integration is `nx:run-commands` wrapping `cargo tauri dev|build|android dev|ios dev`, optionally combined with `@monodon/rust` (a.k.a. `@nx/rust` since v18 / `@monodon/rust`) so `src-tauri/` is a first-class Nx project for affected-graph detection.
- First-time `cargo tauri dev` on a cold cache takes 3–8 minutes to compile ~300 Rust dependencies — the single biggest barrier to new-contributor onboarding (https://v2.tauri.app/develop/).
- Hot reload is asymmetric: frontend HMR is Vite-fast (sub-second), but Rust changes trigger a full `cargo` rebuild and window restart, typically 10–60s depending on cache health (https://github.com/tauri-apps/tauri/discussions/11732).
- Rust-analyzer and `cargo tauri dev` silently invalidate each other's `target/` cache because Tauri sets `MACOSX_DEPLOYMENT_TARGET` from `tauri.conf.json` and rust-analyzer does not — fixable by setting `rust-analyzer.cargo.extraEnv` + `rust-analyzer.cargo.targetDir: target/analyzer` (https://yuexunj.com/how-to-make-your-tauri-dev-faster/).
- Tauri 2 extends HMR to iOS simulators and Android emulators, so frontend changes preview live on device — but iOS requires `tauri ios dev --force-ip-prompt`, Xcode open with the device connected, and a `TAURI_DEV_HOST` env var that points to a routable IPv6 address (https://v2.tauri.app/develop/).
- Sidecar binaries (e.g. shipping a Go/Python helper) must be named with a target-triple suffix like `my-sidecar-aarch64-apple-darwin` and listed in `tauri.conf.json > bundle > externalBin`, plus explicit `shell:allow-execute` permission in `capabilities/default.json` (https://v2.tauri.app/develop/sidecar/).
- Code signing is a hard prerequisite for distribution on all three desktop OSes: Apple Developer ID ($99/yr) for macOS, an OV/EV cert or Azure Key Vault for Windows (HSM mandatory since June 2023), and GPG-signed AppImage for Linux (https://v2.tauri.app/distribute/sign/macos/, https://v2.tauri.app/distribute/sign/windows/).
- Vite's default file watcher tries to watch `src-tauri/` even though Tauri lists it in `server.watch.ignored`, causing infinite reload loops on Rust file changes — a known v2 bug (https://github.com/tauri-apps/tauri/issues/12141).
- Tauri 2.11 is the current CLI as of mid-2026 (`@tauri-apps/cli@2.11.2`, published 2026-05-16; `@tauri-apps/api@2.11.0`, 2026-04-30), confirming an actively-maintained 2.x release cadence.

**Gotchas:**

- Junior engineers will run `pnpm i` then `task dev:desktop` and stare at a black terminal for 5+ minutes during the first `cargo build`; without a banner explaining this they will assume it hung and Ctrl-C, leaving a poisoned `target/` lock that takes another 5 minutes on retry.
- The `MACOSX_DEPLOYMENT_TARGET` / rust-analyzer cache-thrash gotcha is invisible — the IDE just feels slow. Ship a workspace `.vscode/settings.json` with `rust-analyzer.cargo.extraEnv` + `targetDir: target/analyzer` or every contributor pays the same 60s-per-save tax forever.
- Tauri does NOT have an official Nx plugin; the team brief's premise that `@nxext/tauri` is the primary integration is outdated. The honest answer is `nx:run-commands` in `project.json` + `@monodon/rust` for the crate — not a third-party plugin.
- Mobile dev requires Xcode/Android Studio to be open AND the Tauri CLI process to stay alive at the same time; if either dies, the device disconnects silently. New contributors will close Xcode after launching and wonder why HMR stopped (https://v2.tauri.app/develop/).
- Sidecar binaries must be named with the target-triple suffix (`my-sidecar-x86_64-pc-windows-msvc.exe`) or Tauri will silently skip bundling them, and the cryptic runtime error appears only on a colleague's machine after distribution.
- Code signing is non-negotiable for distribution but optional for `tauri dev` — so the app feels fine locally and then fails on Windows SmartScreen / macOS Gatekeeper the moment you hand a .dmg to a teammate. Surface signing setup in the launcher CLI day 1, not at release time.
- Tauri's frontend lives at `http://localhost:1420` by default — colliding with this port (Vite, Storybook, dev proxies) produces a window pointed at the wrong app with no error. Pin and document.
- Adding a new file to `src-tauri/` triggers a rebuild even if it's not in the crate tree, because Tauri watches the directory, not the source graph — known v2 limitation, mitigated only with a strict `.taurignore` (https://github.com/tauri-apps/tauri/discussions/11732).

**Recommendation (this angle):** Drop the `@nxext/tauri` framing — it doesn't exist on npm in 2026. Standardize on `nx:run-commands` in `project.json` wrapping `cargo tauri dev|build|android dev|ios dev`, plus `@monodon/rust` so `src-tauri/` is a real Nx project for affected-graph detection. Ship a workspace `.vscode/settings.json` with the rust-analyzer cache-isolation fix (`MACOSX_DEPLOYMENT_TARGET` + `targetDir: target/analyzer`) and a tuned `[profile.dev.package."*"]` in the template's `Cargo.toml` — without those two files, every contributor pays a hidden 50s-per-save tax that the docs will not surface. The launcher CLI must show a "first build: 3–8 min, this is normal" banner around the first `cargo tauri dev` so juniors don't kill the build.

**Citations:**

- [Tauri 2.0 Stable Release (Oct 2024)](https://v2.tauri.app/blog/tauri-20/)
- [Tauri 2 Develop docs — dev workflow, HMR, mobile prerequisites](https://v2.tauri.app/develop/)
- [Tauri 2 Prerequisites — Rust + per-OS system deps](https://v2.tauri.app/start/prerequisites/)
- [Tauri 2 Vite integration — devUrl / frontendDist config](https://v2.tauri.app/start/frontend/vite/)
- [Tauri monorepo integration discussion #7368](https://github.com/tauri-apps/tauri/discussions/7368)
- [Tauri rebuilding / hot-reloading pain discussion #11732](https://github.com/tauri-apps/tauri/discussions/11732)
- [Vite watches src-tauri despite ignore config — bug #12141](https://github.com/tauri-apps/tauri/issues/12141)
- [How to make your Tauri dev faster — rust-analyzer cache isolation](https://yuexunj.com/how-to-make-your-tauri-dev-faster/)
- [Tauri 2 sidecar / external binary docs](https://v2.tauri.app/develop/sidecar/)
- [Tauri 2 macOS code signing requirements](https://v2.tauri.app/distribute/sign/macos/)
- [Tauri 2 Windows code signing (HSM mandatory)](https://v2.tauri.app/distribute/sign/windows/)
- [nxext/nx-extensions repository — confirms no @nxext/tauri package](https://github.com/nxext/nx-extensions)
- [Nx run-commands executor reference](https://nx.dev/docs/guides/tasks--caching/run-commands-executor)
- [Tauri v2 + Next.js monorepo guide (community)](https://melvinoostendorp.nl/blog/tauri-v2-nextjs-monorepo-guide)

### Angle: Production readiness

Shipping a Tauri 2 desktop app to real users in 2026 is not "cargo build && upload to S3" — it is a code-signing pipeline with a Rust cross-compile fan-out and three OS vendors playing gatekeeper. Here is the mental model.

The pipeline has three phases that always run, regardless of how fancy you get: (1) cross-compile native Rust for each (OS, arch) tuple, (2) sign with a vendor-blessed certificate that ties the binary to your legal identity, (3) hand to a distribution channel that the OS trusts. The work lives in the seams between those phases — Tauri itself handles the bundle formats (DMG, MSI, NSIS, AppImage, deb, rpm, .app, .ipa, .apk), but signing and distribution are your responsibility.

The standard "happy path" in 2026 is `tauri-apps/tauri-action@v0` (v0.6.2 as of Mar 2026) running on a GitHub Actions matrix: `macos-latest` for both `aarch64-apple-darwin` and `x86_64-apple-darwin` (or `universal-apple-darwin` for a single fat binary), `windows-latest` for `x86_64-pc-windows-msvc`, and `ubuntu-22.04` (plus `ubuntu-22.04-arm` for public repos) for Linux. The action invokes `cargo tauri build`, picks up signing env vars, and uploads artifacts to a draft GitHub Release. Eleven secrets typically need to live in GitHub: six for macOS (`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_TEAM_ID`, plus either `APPLE_ID`+`APPLE_PASSWORD` or App Store Connect API keys), three for Windows (Azure Key Vault triad: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`), and two for the auto-updater (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`).

The signing story is where most teams get blindsided. Apple wants a Developer ID Application certificate ($99/yr) plus notarization via `notarytool` — typical wall-clock is 2-10 minutes, P95 ~15 minutes, and is non-deterministic. Windows is uglier: since June 2023, the CA/Browser Forum requires OV and EV code-signing private keys to live in a FIPS 140-2 Level 2 HSM, killing the "buy a cert and stick it in a CI secret" workflow. Real 2026 options are (a) Azure Key Vault + AzureSignTool with OIDC federated credentials (the "boring enterprise" path), (b) DigiCert KeyLocker or SSL.com eSigner (cloud HSM-as-a-service), or (c) SignPath Foundation (free for qualifying OSS projects, HSM-backed, OV-level). EV remains painful and expensive but buys instant SmartScreen reputation.

The Tauri auto-updater uses minisign (Ed25519) — generate keys once with `tauri signer generate`, embed the pubkey in `tauri.conf.json`, keep the privkey + password in GH secrets. `tauri-action` autogenerates `.sig` files and an updater manifest (`latest.json`) when `createUpdaterArtifacts` is on.

Linux is the least gated path — AppImage works everywhere, Flatpak/Snap require their own publisher setup, AUR is a community drop. Microsoft Store and Mac App Store have separate signing identities (MAS Installer vs Developer ID) and sandboxing constraints.

Reference projects shipping this at scale: Hoppscotch (165MB → 8MB Electron→Tauri migration), Spacedrive, AppFlowy, Padloc. None are commercial open-core monorepo templates — they're hand-rolled per-project pipelines, which is the opportunity for the template.

**Key findings:**

- @nxext/tauri does not exist on npm — the @nxext organization publishes packages for Stencil/Svelte/SvelteKit/Solid/Preact/Capacitor/Ionic but no Tauri plugin (verified via npm registry search, all @nxext/\* packages last published 2025-06-11). The team brief's reference is incorrect — Nx + Tauri 2 in 2026 means project.json + run-commands wrapping @tauri-apps/cli.
- tauri-apps/tauri-action v0.6.2 (Mar 2026) is the canonical CI primitive — handles cross-platform builds, multi-installer artifacts (NSIS+MSI, DMG, AppImage+deb+rpm), auto-generates updater .sig files and latest.json, uploads to draft GitHub Release.
- Production matrix in 2026: macos-latest (aarch64-apple-darwin + x86_64-apple-darwin or universal-apple-darwin), windows-latest (x86_64-pc-windows-msvc), ubuntu-22.04 (x64), ubuntu-22.04-arm for ARM64 Linux (public repos only — private repos must use pguyot/arm-runner-action which is ~10x slower).
- macOS universal binary in Tauri 2 is one flag: `tauri build --target universal-apple-darwin`. Requires both Rust targets installed; build time roughly doubles; produces single .app that runs native on Intel and Apple Silicon.
- Windows signing post-June-2023: OV and EV certs require FIPS 140-2 Level 2 HSM storage per CA/Browser Forum mandate. Old certs grandfathered until June 2026 cutoff. The 'buy a .pfx and put it in GH secrets' model is dead.
- Three production-grade Windows signing paths in 2026: (a) Azure Key Vault + AzureSignTool with OIDC federated credentials (no static client secret needed), (b) DigiCert KeyLocker cloud HSM (FIPS 140-2 L3), (c) SignPath Foundation — free OSS signing, HSM-backed, OV-level, has signed Tauri projects.
- macOS notarization in 2026 uses notarytool exclusively (xcrun altool removed Nov 2023). Two auth paths: Apple ID + app-specific password (APPLE_ID/APPLE_PASSWORD/APPLE_TEAM_ID) or App Store Connect API key (APPLE_API_ISSUER/APPLE_API_KEY/APPLE_API_KEY_PATH — recommended for CI). P50 2-10 min, P95 ~15 min wall-clock, non-deterministic.
- Auto-updater uses minisign (Ed25519) — `tauri signer generate -w ~/.tauri/myapp.key`, embed pubkey in tauri.conf.json, set TAURI_SIGNING_PRIVATE_KEY + TAURI_SIGNING_PRIVATE_KEY_PASSWORD env vars at build time (.env files do NOT work, must be process env). .sig file is only generated when createUpdaterArtifacts is enabled.
- Standard secret inventory for full production setup: 11 GH secrets — 6 macOS (APPLE_CERTIFICATE base64 .p12, APPLE_CERTIFICATE_PASSWORD, APPLE_SIGNING_IDENTITY, APPLE_TEAM_ID, APPLE_ID, APPLE_PASSWORD), 3 Windows Azure KV (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET — replaceable with OIDC), 2 Tauri updater (TAURI_SIGNING_PRIVATE_KEY, TAURI_SIGNING_PRIVATE_KEY_PASSWORD).
- Tauri 2 official distribution channels: macOS (DMG direct + Mac App Store), Windows (NSIS .exe + MSI direct + Microsoft Store), Linux (AppImage + deb + rpm + Snap + Flatpak + AUR), Mobile (Google Play .apk/.aab + iOS App Store .ipa). Homebrew is community-driven, not official.
- Reference production users on Tauri 2 in 2026: Hoppscotch (migrated from Electron, 165MB→8MB, ~70% memory reduction), Spacedrive (file manager, Rust-heavy backend), AppFlowy (Notion alt), Padloc (password manager). Tracked at github.com/tauri-apps/awesome-tauri and madewithtauri.com.
- CrabNebula Cloud is the vendor-managed distribution + auto-update CDN for Tauri (analogous to Sentry for crashes or Vercel for web) — handles latest.json hosting, global CDN, channel management. Officially listed as a Tauri distribution target.

**Gotchas:**

- The team brief claims '@nxext/tauri (community)' provides Nx generators/executors — this package does not exist on npm. Verify before designing around it: the realistic path is project.json + run-commands wrapping @tauri-apps/cli, or invest in writing a thin internal Nx plugin.
- createUpdaterArtifacts must be explicitly enabled in tauri.conf.json — otherwise no .sig files generated and the updater silently can't verify. Easy to miss because builds succeed.
- .env files do NOT work for TAURI_SIGNING_PRIVATE_KEY — the variable must be in actual process env. Local builds that work from .env will break in CI for non-obvious reasons.
- Windows code signing certs purchased after June 2023 cannot be stored as .pfx in a GH secret — the CA/Browser Forum HSM mandate means the cert literally cannot leave the HSM. If a team's docs still show 'WINDOWS_CERTIFICATE base64', the docs are pre-2023 and broken.
- ubuntu-22.04-arm GitHub-hosted runners are public-repo-only. Private repos shipping ARM64 Linux must either self-host an ARM runner, use pguyot/arm-runner-action emulation (~1hr full build), or skip ARM Linux.
- Notarization is non-deterministic and can stall on Apple's side for hours — discussion #8630 documents builds hung >1hr. Production pipelines need a notarization-only retry job, not a flat 'one-shot build+sign+notarize' job.
- Mac App Store distribution needs a DIFFERENT certificate (3rd Party Mac Developer Application + Installer) than direct DMG (Developer ID Application). Both notarized separately. Tauri supports both but the conf and secrets are distinct.
- Tauri auto-updater private key loss is unrecoverable — if you lose the key, all installed users are stranded with no upgrade path because the pubkey is baked into their installed binary. Treat the key like a root CA: HSM or air-gapped backup.

**Recommendation (this angle):** For ts-monorepo-template, use Tauri 2 via project.json + run-commands wrapping @tauri-apps/cli (do NOT bet on @nxext/tauri — it doesn't exist) plus a reusable GitHub Actions workflow that invokes tauri-apps/tauri-action@v0 on a (macos-latest, windows-latest, ubuntu-22.04) matrix. Document the 11-secret inventory as a per-deployer checklist and offer two Windows signing presets — Azure Key Vault + AzureSignTool with OIDC for commercial users, SignPath Foundation for OSS users — rather than burying the post-2023 HSM mandate in a footnote. Ship the minisign keypair generation, updater manifest hosting, and macOS notarytool retry-on-stall logic as template defaults; these are the real cost centers and the differentiator vs a hand-rolled Tauri pipeline.

**Citations:**

- [tauri-apps/tauri-action GitHub](https://github.com/tauri-apps/tauri-action)
- [Tauri 2 GitHub Actions Distribution Guide](https://v2.tauri.app/distribute/pipelines/github/)
- [Tauri 2 Windows Code Signing](https://v2.tauri.app/distribute/sign/windows/)
- [Tauri 2 macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/)
- [Tauri 2 Updater Plugin (minisign keys)](https://v2.tauri.app/plugin/updater/)
- [Tauri 2 Distribution Overview (channels)](https://v2.tauri.app/distribute/)
- [Ship Your Tauri v2 App Like a Pro Part 2 — 11 secrets pipeline (2026)](https://dev.to/tomtomdu73/ship-your-tauri-v2-app-like-a-pro-github-actions-and-release-automation-part-22-2ef7)
- [Building a Universal Binary with Tauri v2](https://dev.to/hiyoyok/building-a-universal-binary-with-tauri-v2-its-easier-than-you-think-1b53)
- [DigiCert timeline: Code signing private key storage requirement (June 2023 HSM mandate)](https://knowledge.digicert.com/alerts/code-signings-new-private-key-storage-requirement)
- [SignPath Foundation — free OSS code signing](https://signpath.org/)
- [vcsjones/AzureSignTool — SignTool with Azure Key Vault support](https://github.com/vcsjones/AzureSignTool)
- [GitHub Actions Code Signing with Azure Key Vault HSM + OIDC](https://forelens.com/blog/github-actions-code-signing-with-azure-key-vault-hsm-rbac-oidc-and-managed-identity/)
- [Shipping a Production macOS App with Tauri 2.0 (notarytool 2026)](https://dev.to/0xmassi/shipping-a-production-macos-app-with-tauri-20-code-signing-notarization-and-homebrew-mc3)
- [tauri-apps/awesome-tauri (reference apps)](https://github.com/tauri-apps/awesome-tauri)
- [Tauri Monorepo Integration Discussion #7368](https://github.com/tauri-apps/tauri/discussions/7368)

### Angle: Tradeoffs + recommendation

Imagine you are a startup founder. You want to ship a desktop app. You have two real choices in 2026: Electron (Slack, VS Code, Discord) or Tauri 2 (Hoppscotch desktop, Spacedrive, AppFlowy, Padloc). Both let you write the UI in HTML/CSS/JS. The difference is what they put behind the UI.

Electron ships an entire copy of Chrome and Node.js inside your app. That makes the installer ~100-200 MB and idle RAM ~150-300 MB, but the upside is huge: your app looks and behaves identically on Windows, Mac, and Linux because it is the same Chromium everywhere. The auto-update and packaging story is battle-tested.

Tauri does the opposite. It writes the host process in Rust, and on each OS it uses whatever browser engine is already installed — WebView2 (Chromium) on Windows, WKWebView (Safari) on Mac, WebKitGTK on Linux. That brings the installer to ~5-10 MB and RAM to ~30-50 MB. Hoppscotch's migration is the canonical proof: 165 MB → 8 MB, ~70% less memory.

Now the catches. First, your CSS that worked in Chrome dev might break on Linux's WebKitGTK, which is famously behind on features and varies by distro. You will write fewer CSS hacks for Electron. Second, every change to Rust code triggers a Rust compile, which is slow — `tauri dev` sometimes recompiles ~300 crates and takes a minute even for trivial changes. Third, code signing is mandatory for distribution on all three platforms: Apple Developer ID ($99/yr), and Windows OV (~$200-300) or EV (~$400+, requires hardware token or Azure Key Vault). Electron has the same signing requirement but a more mature CI tooling chain (electron-builder, electron-forge).

Now the Nx integration story — this is where the official team brief is **wrong**. The brief names `@nxext/tauri` as the primary plugin. As of June 2026 that package does not exist on npm (returns 404) and is not in the nxext/nx-extensions monorepo's packages directory. There is no first-class Nx plugin for Tauri. The real path is: generate a Tauri project with `pnpm create tauri-app`, point `frontendDist`/`devUrl` in `tauri.conf.json` at the Nx-built frontend, then drive it from a project.json with `nx:run-commands` executors wrapping `cargo tauri dev` and `cargo tauri build`. That is roughly the same effort as integrating any non-Nx-native tool — manageable, but not "drop in a plugin."

For the ts-monorepo-template, this means: bundling Tauri by default forces every user — including those who only want a marketing site — to install a Rust toolchain, pay for code signing keys, and own a webview compatibility matrix. That is too much for the bottom three profiles. But for any founder who genuinely needs a desktop binary, Tauri 2 is the right pick over Electron in 2026.

**Key findings:**

- Tauri 2.0 went GA on 2024-10-02; current cli/api versions are 2.11.x as of May 2026, indicating a mature and actively shipped 2.x line.
- @nxext/tauri returns HTTP 404 on the npm registry and is absent from the nxext/nx-extensions packages directory (which lists capacitor, ionic-angular/react, preact, solid, stencil, svelte, sveltekit) — the team brief overstates plugin maturity.
- The pragmatic Nx-Tauri integration in 2026 is run-commands in project.json wrapping cargo tauri dev / cargo tauri build, with frontendDist pointed at the Nx-built web bundle — community starters like qdelettre/nx-astro-tauri-starter follow this pattern.
- Hoppscotch's Electron-to-Tauri migration cut installer size from 165 MB to 8 MB (~95% smaller) and reduced memory ~70%, a credible production data point.
- Tauri uses different webviews per OS — WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux — and WebKitGTK is widely reported as the weakest link, with CSS/font/version-skew issues across distros.
- tauri dev is documented as slow (minute-plus iteration, ~300 crate recompiles) due to rust-analyzer vs tauri-cli fighting over the target/ directory and MACOSX_DEPLOYMENT_TARGET cache invalidation.
- Code signing is required for shipping on all three desktop OSes: Apple Developer ID at $99/yr for macOS, OV (~$200-300) or EV (~$400+, HSM-stored, e.g. Azure Key Vault) for Windows — non-trivial setup that does not fit a 'just clone the template' onboarding.
- Tauri 2's externalBin/sidecar mechanism bundles Go/Python/Node binaries via platform-triple suffixed filenames (e.g. my-sidecar-aarch64-apple-darwin), making Tauri a natural shell for polyglot monorepo workers.
- Tauri 2 added iOS and Android targets in the 2.0 GA, so it also competes with React Native / Expo on the mobile axis — but the mobile story is younger and the team brief explicitly scopes this team to desktop.
- Stack Overflow and GitHub data cited by 2026 trade press show Tauri repo growth ~55% YoY while Electron has plateaued — adoption is real but Electron still has the larger ecosystem and the proven auto-update path.

**Gotchas:**

- The team brief names @nxext/tauri as the primary plugin — it does not exist on npm as of June 2026. Do not scaffold a phantom dependency; document run-commands as the path.
- Adding Tauri by default forces a Rust toolchain on every template user, including users who only want the marketing site. This will visibly slow first-clone-to-running for the bottom three personas.
- Linux WebKitGTK is the silent productivity tax: visual regressions, font kerning, missing CSS features that Chrome supports. Plan a Playwright matrix that includes WebKit, not just Chromium.
- Code signing is not optional for distribution — budget Apple Developer ID + a Windows certificate flow before promising 'one-command release.' Without signing, Windows SmartScreen and macOS Gatekeeper will frighten end users.
- tauri dev iteration speed degrades badly without separating rust-analyzer and tauri-cli target directories and aligning MACOSX_DEPLOYMENT_TARGET — document this in the template's tauri-quickstart, or first-time users will conclude 'Tauri is slow' and bounce.
- Tauri's sidecar requires the exact -<target-triple> filename suffix per platform; CI must produce six artifacts (macOS x64+arm64, Windows x64+arm64, Linux x64+arm64) if you want a real cross-platform release, not just one.
- Tauri 2 mobile (iOS/Android) shares the same project but requires Xcode and Android SDK on the dev machine — do not advertise 'mobile included' in a desktop preset; that is a separate profile decision.

**Recommendation (this angle):** Exclude Tauri from the default scaffolds for Just Me, Side Project, and Early Startup; offer it as an opt-in `--with-desktop` flag for Scaling Startup and bundle it by default only for Production at Scale when the user explicitly selects a desktop product. Ship Tauri integration as run-commands in project.json (NOT @nxext/tauri — that package does not exist on npm as of June 2026), with a documented sidecar pattern for the Go/Python/Rust workers already in the monorepo. The recommendation over Electron stands for 2026 — 10x smaller binaries, Rust security model, and proven production users (Hoppscotch, Spacedrive, AppFlowy) — but only for users who actually need a desktop binary; including it for everyone taxes onboarding with Rust toolchain, code-signing setup, and Linux WebKitGTK quirks they did not sign up for.

**Citations:**

- [Tauri 2.0 Stable Release](https://v2.tauri.app/blog/tauri-20/)
- [Tauri 2.0 homepage (current platforms supported)](https://v2.tauri.app/)
- [Tauri/Electron tradeoffs: bundle, RAM, benchmarks (2026)](https://www.pkgpulse.com/blog/best-desktop-app-frameworks-2026)
- [Tauri vs Electron: performance, bundle size, real trade-offs (Hopp blog)](https://www.gethopp.app/blog/tauri-vs-electron)
- [Tauri WebView Versions reference (per-OS engine)](https://v2.tauri.app/reference/webview-versions/)
- [WebKitGTK instability discussion (Tauri community)](https://github.com/orgs/tauri-apps/discussions/8524)
- [Playwright WebKit engine pitfall (Tauri testing)](https://takazudomodular.com/pj/zudo-tauri/docs/frontend/playwright-engine-pitfall/)
- [Tauri Monorepo Integration discussion](https://github.com/orgs/tauri-apps/discussions/7368)
- [create-tauri-app monorepo parameter request](https://github.com/tauri-apps/tauri/issues/7975)
- [Tauri v2 + Next.js monorepo guide (community)](https://melvinoostendorp.nl/blog/tauri-v2-nextjs-monorepo-guide)
- [qdelettre/nx-astro-tauri-starter (community Nx integration)](https://github.com/qdelettre/nx-astro-tauri-starter)
- [Tauri macOS Code Signing docs](https://v2.tauri.app/distribute/sign/macos/)
- [Tauri Windows Code Signing docs (HSM/Azure Key Vault path)](https://v2.tauri.app/distribute/sign/windows/)
- [Tauri Embedding External Binaries (sidecar)](https://v2.tauri.app/develop/sidecar/)
- [tauri dev incredibly slow issue (DX evidence)](https://github.com/tauri-apps/tauri/issues/8920)

## Team 4 — Nx + React Native (bare)

### Synthesized verdict

**Verdict:** `exclude` | **Fit score:** 22 / 100 | **Default profile bundles:** _(none by default)_

**Reasoning:**

All four angle reports converge on the same uncomfortable answer: bare React Native via `@nx/react-native` is technically viable in 2026, but it is the wrong default for ts-monorepo-template's audiences. The plugin-landscape angle confirms there is exactly one viable Nx plugin (`@nx/react-native` 22.7.5), it is well-maintained by Nrwl, and it does its job — but its job is narrow (inferred targets + Metro workspace resolver), and it cannot solve any of the load-bearing problems that make mobile painful. The dev-experience angle documents a 1–2 hour first-run on a fresh macOS laptop, a pnpm-breaks-Metro problem out of the box, an Xcode-vs-Nx Metro-root asymmetry that silently breaks release builds, and a hard macOS-only constraint for iOS — all things the template cannot abstract away.

The production-readiness angle adds the most damaging finding: bare RN forces the template to also own fastlane (match for iOS signing, supply for Android), a 2-platform GitHub Actions matrix with 10x-cost macOS runners, the CocoaPods → SPM migration on the December 2, 2026 deadline, and the post-App-Center OTA landscape (EAS Update, Codemagic CodePush, hot-updater) — because App Center died March 2025 and CodePush silently no-ops in Bridgeless mode. Nx adds caching and an affected graph; it does not reduce any of that surface area. The recommendation angle then names the load-bearing constraint: `@nx/react-native` and `@nx/expo` cannot coexist in the same workspace because they pin different react-native versions. The template must pick exactly one mobile lane, and that lane is a one-way door.

Audience 1 (founders, vibe-coders, juniors) gains nothing from owning ios/ and android/ folders. They want "scaffold an app, see it on my phone, ship to TestFlight" — the exact path Expo + EAS optimizes for with prebuild, config plugins, EAS Build, EAS Update, and Expo Go QR-code preview. Audience 2 (Aegis via MCP) is even worse served: an AI agent cannot drive Xcode's signing UI, cannot install Xcode itself, and cannot meaningfully recover from CocoaPods version skew. Bare RN forces both audiences into native-toolchain content the template's documentation and launcher CLI cannot make humane.

The historical justifications for bare workflow have collapsed in 2026. React Native 0.76 made the New Architecture default in both bare and Expo; 0.82 removed the legacy bridge entirely; Continuous Native Generation (prebuild + config plugins) closed the "I need custom native code" gap that used to force ejection. Stripe, RevenueCat, Firebase, Sentry, BLE, camera, biometrics all ship config plugins. The remaining bare-only cases — brownfield embedding into an existing native app, kernel-level integrations, MFi accessories, medical-device SDKs — describe zero of the template's likely buyers. None of the "real-world New Architecture wins" (43% faster cold starts, 26% lower memory) differentiate bare from Expo because they land equally in both.

The honest verdict is exclude `@nx/react-native` from the template entirely. Ship `@nx/expo` as the single mobile profile (covered by the sibling Expo team). Document `expo prebuild` as the documented escape hatch for the rare brownfield or hard-native case, with a one-page ADR explaining that the two Nx plugins cannot coexist so the choice is structurally load-bearing. The template's "sharp recommendations" principle says don't bundle things that exist primarily as escape hatches — and that is exactly what bare workflow has become in 2026.

**Integration outline:**

Concrete recommendation is NOT to integrate `@nx/react-native`. Instead:

1. Author docs/adr/0XX-mobile-workflow-expo-not-bare.md explaining: (a) `@nx/expo` and `@nx/react-native` cannot coexist in one Nx workspace (version-pin conflict on react-native); (b) RN 0.76+ closed the New Architecture parity gap; (c) Continuous Native Generation via `expo prebuild` + config plugins covers historic custom-native-code cases; (d) bare workflow's residual use cases (brownfield AAR/XCFramework embedding, kernel-level integrations, MFi accessories, vendor SDKs without config plugins) describe zero of the template's audiences. Cite the recommendation-angle Nx issue #31498 and the Expo brownfield docs.

2. Add an "Escape hatch: drop down to bare" section in the mobile profile docs (owned by the Expo team) that documents the `npx expo prebuild` flow, the implications (loses Expo Go preview, loses EAS Update OTA semantics if not opted-in, must own Podfile/Gradle from that point forward), and links to @callstack/react-native-brownfield for the brownfield-specific case.

3. Do NOT add `@nx/react-native` to the launcher CLI generator menu. Do NOT add it to any of the 5 profiles (p-solo, p-hobby, p-startup-small, p-startup-scale, p-enterprise). Do NOT add a Dockerfile template (mobile builds are macOS-native anyway). Do NOT add Helm chart shape changes (mobile is client-side, not k8s). Do NOT add Crossplane XRD changes. Do NOT add profile values changes.

4. In the launcher CLI's mobile-profile flow (owned by Expo team), add a single sentence: "Need bare workflow? Run `expo prebuild` after scaffolding. See ADR-0XX." That is the entire bare-workflow integration footprint.

5. If — and only if — a future enterprise buyer brings a real brownfield or hard-native requirement, add `@nx/react-native` as an opt-in `--mobile=bare` flag to the launcher CLI behind a feature gate, with a documented warning that it permanently removes `@nx/expo` from the workspace. Pin to the @nx/react-native version matching the workspace's Nx major (currently 22.7.5), ship a curated metro.config.js using @rnx-kit/metro-resolver-symlinks for pnpm, patch the iOS AppDelegate jsBundleURLForBundleRoot path at scaffold time, and ship a fastlane skeleton (match for iOS, supply for Android) with a GH Actions ubuntu+macos-15 matrix gated on `nx affected`. This is on-demand integration only — not Day 1, not Day 2.

**Risks:**

- Bundling bare RN locks every future app in the workspace out of @nx/expo (the two plugins cannot coexist) — a one-way door taken for users who almost certainly want the other lane.
- macOS-only constraint for iOS builds excludes Linux/Windows contributors entirely; the launcher CLI cannot abstract Xcode away and AI agents cannot drive Xcode's signing UI.
- CocoaPods trunk goes read-only December 2, 2026; templates that ship pod-install paths without an SPM migration ramp will rot within months of release.
- App Center CodePush is dead (March 2025) and CodePush itself silently no-ops in Bridgeless mode (RN 0.76+ default); copy-pasted 2023 OTA tutorials will appear to work but ship broken updates — high blast-radius footgun.
- macOS GitHub Actions runners cost ~10x Linux; bare RN CI is the single biggest cost line the template would introduce if recommended by default.
- fastlane match in non-readonly mode on CI silently regenerates certs and invalidates every developer's local profile — load-bearing config the template would have to document and the launcher CLI cannot validate.
- @nx/react-native pins RN ~0.79.3 in its generator while 0.84 is stable (nrwl/nx#31498); any scaffold path requires a post-generate bump the template owner must maintain across Nx releases.
- pnpm + Metro is broken out of the box; the template would have to ship and maintain @rnx-kit/metro-resolver-symlinks plumbing forever as Metro's symlink story slowly improves upstream.

### Angle: Plugin landscape + integration mechanics

Here is the honest landscape for "Nx + bare React Native" in mid-2026. It is a one-horse race, and the horse is `@nx/react-native`.

**What the plugin actually is.** `@nx/react-native` is a first-party Nx package maintained by the Nx team (Nrwl). The latest stable is `22.7.5` (published 2026-05-27); a `23.0.0` is in beta. It ships two things you care about: (a) a Project-Crystal-style "inference" plugin (`@nx/react-native/plugin`), and (b) a bag of generators and legacy executors. Modern usage is the inference plugin — the executors exist mostly so older workspaces don't break.

**How Nx "sees" a React Native project.** The plugin registers a `createNodesV2` hook with the glob `**/app.{json,config.js,config.ts}`. For each match, Nx checks the sibling directory and only accepts the project if it has BOTH `package.json` AND `metro.config.js`, AND it does NOT have an `expo` dependency or an `expo` key in app config — that's how it routes Expo projects to `@nx/expo` instead. So the contract is: "drop `app.json` + `metro.config.js` next to a `package.json` with no Expo dep, and Nx will infer 9 targets for you." Targets created: `start`, `run-ios`, `run-android`, `build-ios`, `build-android`, `bundle`, `pod-install`, `sync-deps`, `upgrade`. Build targets are cached with outputs declared at `ios/build/Build/Products` and `android/app/build/outputs`.

**The Metro integration mechanic.** Metro by default doesn't traverse outside the app folder, which breaks any workspace that has `packages/*`. The plugin exports a `withNxMetro(userConfig, opts)` helper your `metro.config.js` wraps around the default config. It adds workspace `watchFolders`, sets `nodeModulesPaths`, and injects a custom resolver so imports from `packages/contracts` actually resolve.

**Why no real alternatives.** I went looking. The only historically-cited community option was `nx-react-native-expo`, last published 2021-01-18, explicitly deprecated when Nrwl shipped `@nx/expo`. There is no `@callstack/nx-plugin` on npm. Brownfield helpers like `@callstack/react-native-brownfield` and `expo-brownfield` exist at the React Native layer, not the Nx layer — they're orthogonal. The "alternative" is rolling your own with `nx:run-commands` in `project.json`, which works but throws away the inferred targets, caching, and migrations.

**One real gotcha.** Nx pins React Native `~0.79.3` in its application generator while the current stable is `0.84` and the New Architecture has been the default since `0.76`. Tracked as nrwl/nx#31498. The template should NOT rely on `nx g app` to pin the RN version — it generates an outdated app and a post-generation bump is mandatory.

**Key findings:**

- @nx/react-native is the only viable Nx plugin for bare React Native in 2026; latest stable is 22.7.5 published 2026-05-27 by Nrwl maintainers (nrwlowner, jack-nrwl, jameshenry, maxkless), with 23.0.0 in beta
- The plugin uses a Project-Crystal-style createNodesV2 hook with glob `**/app.{json,config.js,config.ts}` defined in packages/react-native/plugins/plugin.ts
- A project is detected ONLY if the directory containing the app config also has BOTH package.json AND metro.config.js, AND no `expo` dep or `appConfig.expo` key — Expo projects are deliberately skipped and routed to @nx/expo
- Nine inferred target names are configurable: startTargetName, podInstallTargetName, runIosTargetName, runAndroidTargetName, buildIosTargetName, buildAndroidTargetName, bundleTargetName, syncDepsTargetName, upgradeTargetName (defaults: start, pod-install, run-ios, run-android, build-ios, build-android, bundle, sync-deps, upgrade)
- build-ios and build-android are cached with outputs ios/build/Build/Products and android/app/build/outputs respectively; build-ios dependsOn sync-deps
- Six generators ship: init (hidden), application (alias app), library (alias lib), component (alias c), web-configuration (react-native-web), and convert-to-inferred (executor->plugin migration)
- Eleven legacy executors exist for back-compat: run-android, run-ios, bundle, build-android, build-ios, start, sync-deps, ensure-symlink, storybook, pod-install, upgrade
- The plugin peer-depends on metro-config >= 0.82.0 and metro-resolver >= 0.82.0; @nx/detox and @nx/rollup are optionalDependencies
- withNxMetro(userConfig, opts) is the workspace-resolver wrapper exposed via @nx/react-native/plugins/with-nx-metro — it adds workspace watchFolders, sets nodeModulesPaths, and injects a custom resolveRequest
- The application generator pins react-native ~0.79.3 + react ^19.0.0 + metro ~0.82.4 even though RN 0.84 is the current stable — bug tracked at nrwl/nx#31498; New Architecture is default since 0.76 so the version gap doesn't block New-Arch use
- No actively maintained community Nx plugin exists for React Native: nx-react-native-expo (0.0.9) was last published 2021-01-18 and is officially deprecated; @callstack/nx-plugin does not exist on npm
- Brownfield React Native (embedding into an existing native app) is handled at the RN layer via @callstack/react-native-brownfield or expo-brownfield, not via Nx-specific tooling — Nx just owns the workspace shape

**Gotchas:**

- RN version pin is stale: `nx g @nx/react-native:app` generates RN ~0.79.3 even though 0.84 is stable (nrwl/nx#31498). Bake a post-generate bump into the launcher CLI — do not assume `nx g app` produces a current app.
- Project detection requires BOTH app.{json,config.\*} AND metro.config.js as siblings of package.json. A bare RN project missing metro.config.js gets silently skipped by inference — no error, just no targets.
- The plugin auto-skips any project that has an `expo` dependency or an `expo` key in app config. If you accidentally add `expo` to package.json (common in mixed monorepos), your bare-RN targets vanish without warning.
- createNodesV2 and createNodes are exported as aliases of the same function in this plugin. Plugins still using the deprecated `createNodes` alias work, but anyone reading the source expecting two separate implementations will be confused.
- build targets cache outputs at hardcoded Xcode/Gradle paths (ios/build/Build/Products, android/app/build/outputs). If you customize Xcode build settings or Gradle output dirs, Nx cache will be wrong and restore stale artifacts.
- withNxMetro must wrap the user's config, not the other way around — the package README/docs are thin on this. Order matters because Metro's mergeConfig is shallow-merge for some keys.
- The convert-to-inferred generator migrates project.json executors to the inferred-target shape, but it does NOT remove the legacy package.json scripts (`react-native start` etc) that older Nx scaffolds added. Manual cleanup required.
- macOS-only constraint is not enforced by the plugin: run-ios and build-ios will be inferred on Linux/Windows runners and silently fail at execution. Add a CI guard before invoking iOS targets.

**Recommendation (this angle):** Standardize on `@nx/react-native` pinned to the Nx-major you ship (currently `22.7.5`) and use the inference plugin in `nx.json` — there is no second contender worth evaluating. Do not rely on `nx g @nx/react-native:app` for the React Native version; the launcher CLI must post-bump to RN 0.84+ to land users on a supported, New-Architecture-default app. Document the strict detection contract (sibling `package.json` + `metro.config.js`, no `expo` dep) prominently because the failure mode is silent.

**Citations:**

- [@nx/react-native — npm package](https://www.npmjs.com/package/@nx/react-native)
- [React Native Plugin for Nx — official docs](https://nx.dev/docs/technologies/react/react-native/introduction)
- [@nx/react-native plugin.ts source (createNodesV2, glob, filter)](https://github.com/nrwl/nx/blob/master/packages/react-native/plugins/plugin.ts)
- [@nx/react-native executors.json source](https://github.com/nrwl/nx/blob/master/packages/react-native/executors.json)
- [@nx/react-native generators.json source](https://github.com/nrwl/nx/blob/master/packages/react-native/generators.json)
- [@nx/react-native package.json (peer deps, maintainer)](https://github.com/nrwl/nx/blob/master/packages/react-native/package.json)
- [@nx/react-native pinned versions.ts (RN ~0.79.3, React 19)](https://raw.githubusercontent.com/nrwl/nx/master/packages/react-native/src/utils/versions.ts)
- [@nx/react-native withNxMetro source](https://github.com/nrwl/nx/blob/master/packages/react-native/plugins/with-nx-metro.ts)
- [nrwl/nx issue #31498 — outdated Expo/RN version on generate](https://github.com/nrwl/nx/issues/31498)
- [Inferred Tasks (Project Crystal) — Nx concept](https://nx.dev/docs/concepts/inferred-tasks)
- [Convert to Inferred Tasks generator](https://nx.dev/docs/guides/tasks--caching/convert-to-inferred)
- [React Native 0.76 release — New Architecture by default](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture)
- [React Native versions / endoflife.date (0.84 stable, 0.81 unsupported)](https://endoflife.date/react-native)
- [nx-react-native-expo — deprecated community plugin (last 2021)](https://www.npmjs.com/package/nx-react-native-expo)
- [@callstack/react-native-brownfield — brownfield helper (RN layer, not Nx)](https://github.com/callstack/react-native-brownfield)

### Angle: Developer experience

Imagine you're a new contributor who just cloned the template and want to run the mobile app. Here's what actually happens in 2026.

The first 30 minutes (best case). On a macOS laptop with no prior mobile setup, you spend most of the half-hour installing OS-level tools, not Nx-specific things. You need Node 22.11+, Watchman, JDK 17 (Azul Zulu via Homebrew), Xcode 16+ (a 12GB App Store download), CocoaPods, plus Android Studio with the Android 15/SDK 35 platform. The React Native docs are honest about this: "the install isn't hard because any one step is complicated — it's hard because several tools must agree with each other at the same time." On Linux or Windows you can do Android but iOS is macOS-only, full stop. Realistically the first run is 1-2 hours unless tooling is preinstalled.

Once installed, `task dev:<app>` looks like this. Three commands you actually run: `nx start <app>` boots the Metro bundler (port 8081), then in another terminal `nx run-ios <app>` or `nx run-android <app>` compiles native code, installs the binary on a simulator/emulator, and connects it to Metro. After the first build (slow — Xcode + Gradle), iteration is fast: save a .tsx file, Metro pushes the new JS bundle, Fast Refresh keeps component state. Press `j` in the Metro terminal to open React Native DevTools (Chrome DevTools Protocol-based, replaces Flipper since 0.76, zero-config). Breakpoints survive reloads now, which they didn't in the Flipper era.

Where it's slick. Nx auto-infers `start`, `run-ios`, `run-android`, `build-ios`, `build-android`, `bundle`, `pod-install` targets without you writing a project.json. The plugin handles `pod install` for new native modules. Metro got ~15x faster module resolution in 0.76 and another ~3x startup boost in 0.79, so warm reloads are genuinely fast even on a large monorepo. React Compiler 1.0 (October 2025) works with RN via Babel/Metro and removes most manual useMemo/useCallback work.

Where it hurts. The big one: Nx points Metro's root at the workspace root, not the app root. That means the iOS AppDelegate needs `jsBundleURLForBundleRoot:@"apps/<app-name>/index"` instead of `@"index"`, and the Xcode "Bundle React Native code and images" build phase needs `ENTRY_FILE=./apps/<app-name>/index.js`. Forget either and Xcode-driven builds fail with "No Metro config found" while `nx run-ios` works fine — a confusing asymmetry. The second big one is pnpm: Metro assumes flat node_modules, pnpm builds a symlinked virtual store, so out-of-the-box you get "Unable to resolve module react-native". The 2026 fix is either `node-linker=hoisted` in `.npmrc` (loses pnpm's isolation benefit) or `@rnx-kit/metro-resolver-symlinks` plus a custom metro.config.js with watchFolders, both project and root node_modules paths, and `disableHierarchicalLookup: true`.

**Key findings:**

- React Native 0.76 (Oct 2024) made the New Architecture default and shipped React Native DevTools (zero-config, CDP-based) as the replacement for Flipper, with breakpoints that survive reloads.
- Bare-workflow prerequisites in 2026 are Node 22.11+, Watchman, JDK 17 (Azul Zulu recommended), Xcode 16+, CocoaPods, Android Studio with SDK 35; iOS development requires macOS.
- The @nx/react-native plugin auto-infers seven targets (start, run-ios, run-android, build-ios, build-android, bundle, pod-install) and ships generators for application, library, component, and convert-to-inferred.
- Nx sets Metro's project root to the workspace root, requiring manual edits to iOS AppDelegate (jsBundleURLForBundleRoot:@"apps/<app>/index") and the Xcode Bundle React Native code build-phase ENTRY_FILE to make Xcode-driven builds work.
- pnpm workspaces break Metro by default because Metro expects flat node_modules; fixes are either node-linker=hoisted in .npmrc or @rnx-kit/metro-resolver-symlinks plus custom watchFolders and disableHierarchicalLookup in metro.config.js.
- Metro 0.82 (shipped with React Native 0.79, April 2025) gives ~3x faster startup; 0.76 already delivered ~15x faster module resolution and ~4x faster warm builds.
- React Compiler 1.0 went GA in October 2025 and works on React Native via Babel; it's not enabled by default in bare RN (only Expo SDK 54+ wires it in automatically) so the template must opt-in via metro/babel config.
- Open Nx issue #31130 (May 2025, unresolved as of search) means the application generator forces a Vite/Webpack bundler choice even though Metro is the only correct option for RN, surfacing a confusing prompt at scaffold time.
- CocoaPods is being deprecated: Google stops Pod support after Q2 2026, the CocoaPods repo stops accepting new podspecs after Dec 2, 2026, and RN 0.84 (Feb 2026) defaulted to precompiled binaries to ease the Swift Package Manager transition.
- Radon IDE (VSCode/Cursor extension from Software Mansion) is the highest-leverage 2026 DX upgrade: embeds simulator + emulator in the editor, inline variable values at breakpoints, integrated network/Redux/React Query panels, no separate windows.
- React Native 0.76 removed the bundled @react-native-community/cli — bare projects must explicitly list it in devDependencies or `react-native` shell commands break silently.
- Minimum iOS deploy target jumped to 15.1 and minimum Android SDK to 24 (Android 7.0) in 0.76; older device support is gone.

**Gotchas:**

- Nx Metro root = workspace root, not app root. Forgetting to patch AppDelegate jsBundleURLForBundleRoot and Xcode ENTRY_FILE means `nx run-ios` works but Xcode-driven Archive/TestFlight builds die with 'No Metro config found' — a classic CI/release-day surprise.
- pnpm + Metro is broken out of the box. New contributor runs `pnpm install` then `nx run-ios` and gets 'Unable to resolve module react-native'. Template MUST ship either node-linker=hoisted or @rnx-kit/metro-resolver-symlinks; otherwise day-one onboarding fails on a polyglot pnpm monorepo.
- The @nx/react-native:application generator (as of Nx 21/22) prompts the user to pick Vite or Webpack as bundler even though Metro is the only valid choice for RN — junior contributor will pick wrong and create a non-working project.
- Version skew between Nx core and @nx/react-native silently produces opaque errors; the docs explicitly warn 'install the @nx/react-native version that matches the version of nx' — easy to miss when adding the plugin later.
- iOS development is macOS-only. A Linux/Windows contributor can't run or debug the iOS half of the app even with the simulator; document this loudly or you'll get bug reports from non-Mac contributors.
- CocoaPods is sunsetting on a hard 2026 deadline (Dec 2 cutoff for new podspecs, Google SDK Pods gone after Q2). The template needs an SPM migration plan or it'll break for new contributors mid-2026.
- Fast Refresh has a history of breaking on Metro patch bumps (0.83.2 in Sep 2025 broke several libraries because dependencies use caret ranges); pin Metro exact version or use pnpm overrides to avoid surprise CI/dev breakage.
- React Native 0.76 silently broke bare projects that relied on the implicit @react-native-community/cli — upgrades require explicitly adding it (plus cli-platform-android and cli-platform-ios) to package.json or `react-native run-android` errors with 'command not found'.

**Recommendation (this angle):** Ship @nx/react-native with a curated metro.config.js that handles pnpm symlinks (use @rnx-kit/metro-resolver-symlinks rather than forcing hoisted mode — the template's pnpm-isolation guarantee is more valuable than the few lines of Metro config saved), patch the iOS AppDelegate/build-phase paths at scaffold time so Xcode-driven builds don't break for release, and pin Metro to an exact version with a documented bump cadence. Document the macOS-only iOS constraint and the 2026 CocoaPods sunset prominently in the launcher CLI flow, and recommend Radon IDE as the default editor experience — it collapses the 3-terminal Metro+iOS+Android dance into a single VSCode panel and is the single biggest DX win available right now.

**Citations:**

- [React Native Plugin for Nx — Introduction](https://nx.dev/docs/technologies/react/react-native/introduction)
- [@nx/react-native Executors reference](https://nx.dev/docs/technologies/react/react-native/executors)
- [React Native 0.76 release notes — New Architecture by default, RN DevTools](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture)
- [Set Up Your Environment — React Native official docs](https://reactnative.dev/docs/set-up-your-environment)
- [React Native Monorepo With pnpm Workspaces — Callstack](https://www.callstack.com/blog/react-native-monorepo-with-pnpm-workspaces)
- [Metro symlink support open issue (facebook/metro #1042)](https://github.com/facebook/metro/issues/1042)
- [Nx issue #31130 — Metro bundler not selectable in @nx/react-native generator](https://github.com/nrwl/nx/issues/31130)
- [Nx issue #21253 — Xcode build fails with 'No Metro config found in workspace root'](https://github.com/nrwl/nx/issues/21253)
- [Introducing React Native Support for Nx — sets Metro root to workspace root, requires AppDelegate path edits](https://blog.nrwl.io/introducing-react-native-support-for-nx-48d335e90c89)
- [React Native Roadmap to Swift Package Manager (2026)](https://dev.to/estolegion/react-native-roadmap-to-swift-package-manager-2026-3elg)
- [The CocoaPods Sunset: What Dec 2, 2026 Means for Your React Native App](https://subraatakumar.com/blog/cocoapods-sunset-react-native-app/)
- [React Compiler 1.0 release](https://react.dev/blog/2025/10/07/react-compiler-1)
- [Radon IDE — VSCode/Cursor extension for React Native](https://github.com/software-mansion/radon-ide)
- [React Native DevTools — official docs](https://reactnative.dev/docs/react-native-devtools)
- [Fast Refresh broken by Metro 0.83.2 patch — Expo issue #39892](https://github.com/expo/expo/issues/39892)

### Angle: Production readiness

Shipping a bare React Native app from a polyglot Nx monorepo to the App Store and Play Store in 2026 is not one problem — it is three loosely coupled problems stacked on each other, and a template's job is to make the seams obvious.

Problem 1: the native toolchain you cannot escape. Bare RN means you ship a real Xcode project and a real Gradle project. iOS builds REQUIRE macOS + Xcode (no Linux escape hatch), Android needs JDK 17 + Android SDK + NDK. Nx's @nx/react-native plugin does not change that — it gives you inferred targets (start, bundle, run-ios, run-android, build-ios, build-android, pod-install) that just shell out to the React Native CLI. So `nx build-ios my-app` is `xcodebuild` underneath, full stop. The plugin's value is cache keys, dependency graph, and "affected" — it does not replace fastlane.

Problem 2: code signing, which is genuinely complex per-platform and changed in 2026. iOS uses fastlane match: certs and provisioning profiles encrypted in a private git repo, App Store Connect API key (the .p8 file + key ID + issuer ID) stored as GitHub Actions secrets, match runs in readonly mode on CI. Android uses an upload keystore (base64-encoded into a secret), gradle signing config, and a Google Play service account JSON to upload to the internal/alpha/beta/production track via r0adkll/upload-google-play. The 2026 twist: Google Play now mandates Play App Signing (Google holds the production signing key), so your local keystore is only the "upload key."

Problem 3: the 2026 iOS plumbing reshuffle. CocoaPods trunk goes read-only December 2, 2026. Firebase stops publishing pods October 2026. React Native 0.84 (Feb 2026) ships precompiled iOS binaries by default (RCT_USE_PREBUILT_RNCORE) and Hermes V1; 0.82 removed the legacy bridge. The migration target is Swift Package Manager. Existing pod-based builds keep working past Dec 2026 (read-only ≠ removed), but no new pods will land, so you are on borrowed time. The template should keep CocoaPods today but document the SPM exit ramp.

Distribution is now a fork: native binaries via TestFlight (App Store Connect API key) and Play Internal track (service account JSON), JS/asset updates via OTA. Microsoft killed App Center CodePush on March 31, 2025; the live 2026 options are EAS Update (works with bare RN via expo-updates), Codemagic CodePush, or self-hosted (hot-updater, NextPush). CodePush's legacy reload silently no-ops in Bridgeless mode, so anyone copy-pasting 2023 tutorials will ship a broken OTA layer.

CI shape that actually works: GH Actions with a 2-platform matrix — ubuntu-latest for Android (cheap, ~$0.008/min), macos-14 or macos-15 for iOS (~$0.08/min, 10x). Nx Cloud distributes JS/TS work, but native iOS builds need an actual Mac runner. The signing happens via fastlane lanes, not raw xcodebuild, because match handles the cert dance.

**Key findings:**

- @nx/react-native ships inferred targets (start, bundle, run-ios, run-android, build-ios, build-android, pod-install) that wrap the React Native CLI; the plugin does not replace fastlane and adds no signing logic of its own.
- React Native 0.84 (Feb 11, 2026) ships precompiled iOS binaries by default and makes Hermes V1 the default JS engine, cutting iOS clean builds from minutes to ~seconds on M-series runners.
- CocoaPods trunk becomes permanently read-only on December 2, 2026; Firebase stops publishing pods in October 2026, with Swift Package Manager as the migration target — existing pod-based builds keep working but cannot pull new pods.
- React Native 0.82 permanently removed the legacy bridge architecture; 0.76 made New Architecture (Fabric + TurboModules + JSI) the default — anything that depends on the old bridge silently breaks.
- Microsoft retired Visual Studio App Center (and CodePush) on March 31, 2025, leaving EAS Update (works with bare RN via expo-updates), Codemagic CodePush (paid SaaS), and self-hosted hot-updater as the live OTA options.
- CodePush's reload mechanism depends on the old JS bridge and silently no-ops in Bridgeless mode (default in RN 0.76+) — any 2023-era OTA tutorial is now actively wrong.
- fastlane match is still the reference iOS signing tool for non-Expo bare RN: certs/profiles encrypted in a private git repo, readonly:true mandatory in CI, App Store Connect API key (.p8 + key ID + issuer ID) replaces username/password.
- Android CI in 2026 standardizes on r0adkll/upload-google-play action + a Google Play service account JSON with 'Release manager' role, uploading AABs to 'internal' track for staged rollouts; Play App Signing means the upload key is not the production signing key.
- GH Actions macOS runners (macos-14/macos-15) cost ~$0.08/minute — 10x the Linux rate — so the right shape is an Android-on-ubuntu + iOS-on-macos matrix, with @nx/react-native's affected graph deciding whether iOS even runs.
- EAS Build pricing for bare RN as of 2026 sits at $1–$4 per build past the free tier, or ~$29/month/seat for managed; fastlane + GitHub Actions remains the zero-marginal-cost path for public-repo or budget-constrained projects.
- Production reference repos to study: mattermost-mobile (RN bare, libraries/@mattermost internal modules, Android 16KB-page CI patch), Obytes react-native-template-obytes (Expo-flavored but 10+ GH Actions workflows including EAS, store deploys, lint+typecheck PR gate, Maestro E2E, version bumps).
- Shopify's mobile super-app pattern uses Nx Cloud distributed task execution with Codemagic Mac mini M2/M4 VMs as iOS agents — viable but requires Nx Cloud paid plan and a CI provider that exposes Apple Silicon runners as agents.

**Gotchas:**

- Nx's pod-install target is a thin wrapper around `pod install` — it does NOT detect SPM-only libraries or the precompiled-binary flag (RCT_USE_PREBUILT_RNCORE), so a template that hard-codes pod-install in CI will silently miss the 0.84+ fast path.
- macOS GitHub Actions runners are billed at 10x the Linux rate; running iOS builds on every PR (instead of only `nx affected`) is the single biggest cost mistake teams make.
- fastlane match in non-readonly mode on CI will silently regenerate certs and invalidate every developer's local profiles — the readonly:true flag is not optional, it is load-bearing.
- Google Play upload keystore vs. Play App Signing key: leaking the upload keystore is recoverable (reset upload key in Play Console), leaking nothing is the goal — but most tutorials conflate the two and will tell you to ship the production key.
- CodePush copy-paste from 2023 tutorials will appear to install in RN 0.76+ but the reload step silently no-ops because Bridgeless mode killed the bridge it depended on; integration tests must assert a real update lands, not just that the SDK initializes.
- App Store Connect API key (.p8) is single-use download — Apple does NOT let you re-download it; losing it means re-issuing and updating every CI secret across all repos.
- react-native-windows lags the core RN release train by several minor versions (0.79 as of mid-2026 while core is at 0.84); a 'mobile + Windows' bare-workflow template will hit New Architecture compatibility skew between platforms.
- Nx Cloud's free self-hosted cache plugins were deprecated in May 2026 after CVE-2025-36852 (cache poisoning); the only sanctioned options now are paid Nx Cloud or rolling your own with the documented security caveats.

**Recommendation (this angle):** For a commercial open-core monorepo template targeting bare React Native, ship @nx/react-native as the build orchestrator but pair it with fastlane (iOS match + Android supply lanes) — Nx owns caching and the affected graph, fastlane owns signing and store upload. The CI reference should be GitHub Actions with an explicit ubuntu (Android) + macos-15 (iOS) matrix gated on `nx affected`, EAS Update or hot-updater for OTA (NOT App Center CodePush — it is dead), and a documented SPM migration ramp keyed to the December 2, 2026 CocoaPods read-only date. Pin to React Native 0.81+ with New Architecture on and precompiled iOS binaries enabled; do not ship anything that touches the legacy bridge.

**Citations:**

- [@nx/react-native plugin documentation](https://nx.dev/nx-api/react-native)
- [React Native 0.84 - Hermes V1 by Default (Feb 2026)](https://reactnative.dev/blog/2026/02/11/react-native-0.84)
- [The CocoaPods Sunset: What Dec 2, 2026 Means for Your React Native App](https://dev.to/subraatakumar/the-cocoapods-sunset-what-dec-2-2026-means-for-your-react-native-app-4g4i)
- [React Native: Roadmap to Swift Package Manager (2026)](https://dev.to/estolegion/react-native-roadmap-to-swift-package-manager-2026-3elg)
- [7 Best CodePush Alternatives for React Native OTA Updates (2026)](https://www.appsonair.com/blogs/best-codepush-alternative-for-real-time-updates)
- [Expo EAS vs Fastlane vs Bitrise 2026 (PkgPulse)](https://www.pkgpulse.com/guides/expo-eas-vs-fastlane-vs-bitrise-react-native-cicd-2026)
- [fastlane sync_code_signing (match) docs](https://docs.fastlane.tools/actions/sync_code_signing/)
- [Upload Android Release to Play Store (r0adkll GH Action)](https://github.com/marketplace/actions/upload-android-release-to-play-store)
- [React Native Android CI/CD with GitHub Actions + Play Store](https://iamhusnain.com/blog/react-native-android-ci-cd-github-actions-google-play/)
- [mattermost-mobile (production RN bare reference)](https://github.com/mattermost/mattermost-mobile)
- [Obytes react-native-template-obytes (10+ GH Actions reference)](https://github.com/obytes/react-native-template-obytes)
- [Reusing Code with React Native Packages at Shopify](https://shopify.engineering/react-native-packages-shopify)
- [Codemagic: React Native OTA Updates in 2026 (CodePush successor landscape)](https://blog.codemagic.io/react-native-ota-updates-guide/)
- [Publishing a React Native Windows App to the Microsoft Store](https://microsoft.github.io/react-native-windows/docs/app-publishing)
- [Nx 21 Release: Continuous tasks and Terminal UI](https://nx.dev/blog/nx-21-release)

### Angle: Tradeoffs + recommendation

Here is what a startup founder needs to hear before they bolt React Native bare workflow onto ts-monorepo-template.

The question is not "do I want a mobile app?" It is "do I want to ship a mobile app, or do I want to own iOS and Android build pipelines?" Those are different products. Bare React Native — meaning React Native without Expo's managed workflow, scaffolded by `@nx/react-native` — gives you the ios/ and android/ folders, raw Xcode and Gradle, and the responsibility for upgrading them every six months. Expo gives you a config file and a cloud builder that does all of that for you.

In 2026 the gap between the two is essentially gone for product features. React Native 0.76 turned on the New Architecture (Fabric renderer + TurboModules + JSI bridgeless mode) by default; 0.82 removed the old bridge entirely. Expo SDK 56 ships RN 0.85 with the same New Architecture turned on. The big shift since 2024 is Continuous Native Generation (CNG): Expo `prebuild` regenerates the native projects on every build from a config file plus "config plugins" that patch Info.plist, AndroidManifest.xml, Gradle, and Podfile. That means custom native code — which was the historic reason to go bare — no longer forces you out of Expo. Stripe, RevenueCat, Firebase, Sentry, BLE, camera, biometrics all have published config plugins.

So the honest question becomes: when is it still worth running bare with `@nx/react-native`?

1. Brownfield: you are embedding RN into an existing native app, packaging as AAR/XCFramework. Expo's brownfield support exists but is newer; bare + a hand-rolled host project is still the more conservative path for a team that already owns native code.
2. Hard native: kernel-level integrations, custom C++ on the audio path, accessory MFi, medical-device SDKs that ship as `.a`/`.framework` with no plugin author.
3. You hate EAS or refuse to depend on Expo's cloud at all — and you are willing to maintain Fastlane and codesigning yourself.

For the ts-monorepo-template product, none of those describe the buyer. Audience 1 is a founder vibe-coding their first app and an AI agent doing 80% of the keystrokes. Audience 2 is Aegis writing code through MCP. Both want "scaffold an app, run on a simulator, ship to TestFlight" — which is exactly the path Expo + EAS optimizes for. Bare RN forces both audiences to learn Xcode signing, Gradle, JDK versions, CocoaPods, and the New Architecture migration matrix — content the template cannot abstract away. The Nx plugin layer (`@nx/react-native`) does not help here: it gives you `run-ios`/`run-android` executors and project graph hooks, but it cannot make Apple's signing UX humane.

There is also a hard constraint: `@nx/expo` and `@nx/react-native` cannot coexist in the same workspace — they fight over react-native dependency versions. So the template has to pick a lane. Picking bare locks every future app, including the eventual demo apps and tutorials, out of EAS Update, EAS Build, the Expo Go preview app, and config plugins.

Verdict: ship the Expo path as the default mobile profile, and document bare as "drop down to it by running `expo prebuild` once you have a real reason." The template should not bundle `@nx/react-native` at all in Phase 3.

**Key findings:**

- React Native 0.76 made the New Architecture (Fabric + TurboModules + JSI) the default; 0.82 permanently removed the old bridge — bare and Expo are on the same runtime in 2026.
- Expo Continuous Native Generation (prebuild + config plugins) closed the historic 'I need custom native code' gap that used to force teams to eject to bare workflow.
- `@nx/react-native` and `@nx/expo` cannot coexist in the same Nx workspace because they pin different react-native versions — the template must pick exactly one mobile lane.
- Nx's React Native generator has historically lagged the latest RN version (issue #31498 noted it was still generating RN 0.76 / SDK 52 a year after release) — bare workflow users frequently hand-bump.
- Expo SDK 56 (beta in 2026) ships React Native 0.85 with New Architecture on by default, and three SDK releases per year that track upstream RN within one or two minors.
- Flutter holds roughly 46% cross-platform mind/market share vs React Native's ~35% in 2026, but the JS/TS hiring pool for React Native is 3–4× larger — relevant for the template's startup-founder audience.
- Brownfield embedding (RN packaged as AAR/XCFramework into an existing native app) is the most defensible remaining reason to choose bare; Expo's brownfield path exists but is newer and less battle-tested.
- Bare workflow forces the developer to maintain ios/ and android/ folders, CocoaPods, Gradle, JDK 17, Xcode signing, and the New Architecture third-party compatibility matrix every six months — none of which the template can abstract.
- Real-world New Architecture migrations report ~43% faster cold starts, ~39% faster rendering, ~26% lower memory — but those wins land equally in bare and Expo, so they don't differentiate the choice.
- Hermes is now mandatory for the New Architecture (JSC will not run it), which simplifies the runtime story but means any third-party native lib that hasn't been ported to JSI is a hard blocker — equally painful for bare or Expo.

**Gotchas:**

- Picking `@nx/react-native` permanently excludes `@nx/expo` from the workspace — there is no 'add Expo later' without ripping the plugin out and rewriting project.json across every app.
- Nx's scaffolded RN version often trails upstream by 6–12 months; expect to manually bump `react-native`, `react`, and a long list of native deps right after `nx g app`, then re-run pod install and Gradle sync.
- New Architecture compatibility is per-third-party-package — adopting bare means owning the audit of every native dep against the Fabric/TurboModule matrix on every upgrade.
- Bare workflow needs Xcode (macOS-only), Android Studio, JDK 17, Ruby (for CocoaPods), Watchman, and a working signing setup before the first `npx react-native run-ios` succeeds — devenv.nix can pin most of these but cannot install Xcode.
- EAS Build, EAS Update, and Expo Go preview are forfeited the moment you pick bare — those are the features that make 'AI agent scaffolds an app and shows the user a QR code on their phone' actually work.
- Brownfield via Callstack's react-native-brownfield and Expo's expo-brownfield are different products with different abstractions — don't assume the patterns transfer.
- React Compiler (v1.0 stable, October 2025) works on both — it's not a reason to pick one lane, but skipping it in 2026 leaves measurable perf on the table.
- Bare + Nx + iOS code signing in CI is a known pain point: Nx's run-ios executor does not solve provisioning profile or App Store Connect API key plumbing — that's Fastlane territory.

**Recommendation (this angle):** Exclude `@nx/react-native` (bare workflow) from the template entirely; ship `@nx/expo` as the single mobile profile. The buyers — founders, vibe-coders, and AI agents driving via MCP — gain nothing from owning ios/ and android/ folders and lose EAS Build, EAS Update, config plugins, and Expo Go preview. Document `expo prebuild` as the escape hatch for the rare brownfield or hard-native case, and add a one-page ADR explaining that the two Nx plugins cannot coexist so the choice is load-bearing.

**Citations:**

- [React Native 0.76 — New Architecture by default](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture)
- [React Native New Architecture landing page](https://reactnative.dev/architecture/landing-page)
- [Nx — React Native Plugin introduction](https://nx.dev/docs/technologies/react/react-native/introduction)
- [Nx — Introducing Expo Support for Nx (blog)](https://nx.dev/blog/introducing-expo-support-for-nx)
- [Nx — Expo plugin reference](https://nx.dev/nx-api/expo)
- [nrwl/nx issue #31498 — Nx doesn't use latest Expo/RN versions](https://github.com/nrwl/nx/issues/31498)
- [Expo Brownfield overview](https://docs.expo.dev/brownfield/overview/)
- [Callstack — Everything You Need To Know About React Native Brownfield](https://www.callstack.com/blog/powering-native-apps-with-react-native-brownfield)
- [React Compiler v1.0 release](https://react.dev/blog/2025/10/07/react-compiler-1)
- [Expo SDK 56 Beta changelog (RN 0.85)](https://expo.dev/changelog/sdk-56-beta)
- [Expo — React Native's New Architecture guide](https://docs.expo.dev/guides/new-architecture/)
- [React Native — Integration with Existing Apps](https://reactnative.dev/docs/integration-with-existing-apps)
- [endoflife.date — React Native support matrix](https://endoflife.date/react-native)
- [Flutter vs React Native 2026 market share](https://tech-insider.org/flutter-vs-react-native-2026/)
- [Expo vs Bare React Native in 2026](https://usamasoft.com/blog/expo-vs-bare-react-native)

## Team 5 — Nx + Expo (managed + EAS)

### Synthesized verdict

**Verdict:** `include-day-2` | **Fit score:** 72 / 100 | **Default profile bundles:** p-startup-small, p-startup-scale, p-enterprise

**Reasoning:**

All four angles converge on the same shape: @nx/expo is the only viable Nx plugin for Expo in 2026, it's actively maintained (22.7.5 published 2026-05-27), it uses Project Crystal inferred targets so juniors don't write per-app config, and EAS Build + EAS Update + EAS Submit collectively solve the "no Mac, no sysadmin, no app-store ceremony" problem that bare React Native dumps on a founder. For a template explicitly aimed at startup founders and vibe-coders, the value proposition is concrete: ship to App Store + Google Play from Linux, OTA bugfixes without review, and Nx affected-graph caching across mobile + web + Python + Go + Rust. That's a real win, not a marketing one.

The honest tension is that three of the four agents flag the same friction: autolinking blindness (Expo reads the app's package.json, pnpm hoists to root → silent runtime "TurboModuleRegistry could not find X"), EAS CLI's lingering Yarn assumption for pnpm workspaces, Expo Router's silent splash-screen failure under Nx unless EXPO_ROUTER_APP_ROOT is set, and the port-8081 IPv4/IPv6 collision when two apps run in parallel. Each is fixable, but each is a failure mode that hits a junior contributor in their first week and looks like the template is broken. The template wins only if these are baked into the scaffold (per-app package.json with native dep stubs, distinct --port per app, EXPO_ROUTER_APP_ROOT wired in metro.config.js, withNxMetro non-optional) so the user never sees them.

There is also a real disagreement between angles on SDK pinning. dev-experience argues SDK 54 because SDK 55 mandatorily removes Legacy Architecture and that breaks long-tail native libs. production-readiness and recommendation argue SDK 55/56 because that's where Hermes diffing, XCFrameworks, and code signing land. The right call for a template shipping in mid-2026 is SDK 54 as the generator default (which is also what @nx/expo 22.7.5 actually pins), with a documented upgrade pass to SDK 55+ once the user's chosen native deps are confirmed Fabric/TurboModule-ready via reactnative.directory. Forcing every template user onto New-Architecture-only on day one will burn the long-tail use cases the founders need.

Profile mapping: this does NOT belong in p-solo (Just Me) or p-hobby (Side Project). A solo founder building a CLI tool or a marketing site does not need a mobile app, and the autolinking trap + EAS cost + dev-client cycle is overhead they will resent. Including @nx/expo by default at those tiers makes the template feel bloated. It DOES belong in p-startup-small upward: any startup serious enough to ship a customer-facing product in 2026 will need mobile, and the value of having mobile-admin + mobile-customer pre-wired into the Nx graph, sharing packages/contracts and packages/ui with the web app, is exactly the polyglot story the template is selling. For p-enterprise, the EAS Workflows + code-signed updates story is the only path that survives a security review without significant custom CI work.

The "include-day-2" verdict (not day-1) is deliberate. Day-1 of the template should be: TS + Python + Go + Rust + Nx graph + launcher CLI + marketing site + MCP server. Mobile is a heavy addition (Metro, CNG, EAS, dev-client builds, native module audit) that not every Phase-3 user will turn on. Ship it as a launcher CLI flag — "add mobile apps?" → scaffolds apps/mobile-admin + apps/mobile-customer + libs/mobile-ui + eas.json + the four workarounds baked in. That keeps the day-1 template lean and makes mobile a deliberate, opt-in expansion. Excluding it entirely would be wrong: in 2026, "I shipped a startup without a mobile app" is increasingly unusual, and the open-core competitors (RedwoodSDK, T4 stack, create-t3-turbo) all ship Expo. We'd be ceding the most credible cross-platform story by omission.

**Integration outline:**

1. Add @nx/expo to package.json devDependencies pinned to the workspace Nx version (e.g. 22.7.5 if Nx is 22.7.5 — version MUST match exactly per plugin-landscape findings). Add the plugin entry to nx.json with renamed target names that don't collide with the generic "build"/"start"/"install" conventions used by other template projects: e.g. expo-start, expo-build, expo-submit, expo-update. 2) Make mobile opt-in via the launcher CLI: `launcher add mobile` runs `nx g @nx/expo:app mobile-admin --routing=expo-router` and `nx g @nx/expo:app mobile-customer --routing=expo-router`, then `nx g @nx/expo:lib mobile-ui`. Default OFF for p-solo and p-hobby profiles; default ON for p-startup-small and above. 3) Bake the four well-known workarounds into the scaffold templates so juniors never see the failure modes: (a) each app's metro.config.js calls withNxMetro AND sets process.env.EXPO_ROUTER_APP_ROOT = path.resolve(\_\_dirname, "app") before getDefaultConfig; (b) each app's start target hardcodes a distinct --port (8081 for mobile-admin, 8082 for mobile-customer) to dodge the IPv4/IPv6 conflict; (c) each app keeps a per-app package.json listing every native module by name (not just at root) to defeat autolinking blindness; (d) the root pnpm-workspace.yaml sets nodeLinker: hoisted as the safe default with a comment pointing to the SDK 54 isolated-installs upgrade path. 4) Generate eas.json with three profiles (development, preview, production), set "projectRoot": "apps/<app-name>" explicitly per app, and turn on EAS Update code signing in the production profile (private key referenced from the template's existing AKV/Vault wiring, not committed). 5) Add a documented postinstall hook in each app's package.json that runs `nx build` for shared libs the app depends on, working around nrwl/nx#22195 where EAS Build silently misses workspace deps. 6) Helm/Crossplane impact is zero — this is client-side mobile only — but the template's CI workflow needs a new EAS Workflow YAML (.eas/workflows/build.yml) for the EAS cloud path, plus a GH Actions step that runs `nx affected -t lint,test,typecheck` and gates the eas build trigger on green. 7) Pin Expo SDK to 54 in the scaffold (matches @nx/expo 22.7.5 default), document the SDK 55+ upgrade as a separate runbook gated on Fabric/TurboModule audit of native deps via reactnative.directory. 8) Launcher CLI must NOT offer the @nx/react-native plugin alongside — the two are mutually exclusive in one workspace per plugin-landscape findings. 9) Ship a one-page "first 30 minutes with mobile" doc covering: install eas-cli, eas login, eas build --profile development once per platform, then nx start mobile-admin → scan QR → hot reload. This is the trust deliverable.

**Risks:**

- Autolinking blindness: pnpm hoists native deps to root, Expo autolinking reads only the app's package.json, so the app builds green in CI and crashes on launch with 'TurboModuleRegistry could not find X'. Mitigation (per-app package.json with native stubs) must be baked into the scaffold and tested on every template release.
- Nx major-version churn (21 → 22 in <12 months) breaks @nx/expo more aggressively than Expo SDK upgrades do. The template's Nx upgrade cadence and the @nx/expo upgrade are coupled — we cannot bump Nx without simultaneously bumping the plugin and re-testing the inferred-targets surface.
- Expo SDK 55+ mandatorily removes Legacy Architecture. Long-tail native libs that haven't shipped Fabric/TurboModule support crash at runtime, not build time. If we default to SDK 55 to chase Hermes diffing + XCFrameworks, we burn the founders whose chosen libs aren't ready.
- EAS Build is a paid dependency past 15 builds/platform/month. A startup-small profile user running parallel CI on two apps will hit the limit quickly; we must document the $19 Starter / $199 Production tier honestly in the template's pricing page, not bury it.
- EAS CLI's Yarn assumption for pnpm workspaces (eas-cli#2978) is a recurring intermittent failure. Until upstream lands a fix, our scaffold's eas.json + workflow needs explicit pnpm install commands and may need EAS_NO_VCS=1 escape hatches documented.
- Expo Router silently fails to splash screen under Nx without EXPO_ROUTER_APP_ROOT. A junior debugging 'app hangs on splash' will not find this on Google for 2+ hours. Scaffold must set this AND the doc must call it out at the top of the troubleshooting section.
- EAS Update code signing requires the Production plan ($199/mo). If we promise 'open-core trust' via signed updates in marketing copy, we are de facto requiring users to be on the paid plan — be transparent about this in the profile-mapping docs, don't sell signed OTA as a free feature.
- Two-app parallel dev workflow (mobile-admin + mobile-customer simultaneously) hits the port-8081 IPv4/IPv6 collision (expo#38352). The scaffold must hardcode distinct --port values, and the launcher CLI must allocate ports for any additional mobile apps the user adds beyond the default two.

### Angle: Plugin landscape + integration mechanics

Here is the honest 2026 state of the Nx + Expo plugin landscape, told plainly.

There is essentially **one viable Nx plugin for Expo**: `@nx/expo`, official, maintained by Nrwl, currently at 22.7.5 (published 2026-05-27, weeks before today). Latest 22.x line tracks Nx 22 mainline. It pins **Expo SDK 54 as the default** for newly generated apps (RN 0.81.5, React 19.1, Metro 0.83) and still supports SDK 53 for existing workspaces. It does NOT yet auto-scaffold SDK 55 (which shipped Feb 2026); SDK 55 is usable but you upgrade in-place after `nx g @nx/expo:app`. There are essentially no serious community plugins competing with `@nx/expo` — npm search for `keywords:nx-plugin expo` returns zero dedicated rivals. The only community footprint is boilerplate repos (e.g. `nx-expo-next-tamagui`), not redistributable plugins.

The "alternative" path is the **no-plugin route**: pnpm workspaces + raw Expo CLI, using `nx:run-commands` to wrap `expo start` / `eas build`. You lose generators and inferred targets, but you get faster Expo-team-direct support and you avoid the well-known Expo Router pain (see gotchas).

Now the mechanic. Since Nx 17, the official plugin uses **Project Crystal / inferred tasks**: instead of writing `project.json` by hand, Nx walks the workspace, finds files matching a glob, and synthesises targets at graph-load time. The `@nx/expo/plugin` createNodesV2 glob is exactly: `**/app.{json,config.js,config.ts}`. For each match it does three checks before deciding "this is an Expo app":

1. sibling `package.json` exists,
2. sibling `metro.config.js` exists,
3. `app.json` has an `expo` key OR `package.json` deps include `expo`.
   If all pass, it synthesises nine inferred targets: `start`, `serve`, `run-ios`, `run-android`, `export`, `prebuild`, `install`, `build`, `submit` (target names are all renameable in `nx.json` via `startTargetName`, etc.). Some are real Nx executors (`@nx/expo:start`, `:install`, `:prebuild`, `:build`); others are plain shell commands (`expo start --web`, `expo run:ios`, `eas submit`). `build` is the EAS Build wrapper; `submit` is `eas submit`. So Nx sees the project because **app.json exists with `metro.config.js` next to it**. No `project.json` required.

There is also `withNxMetro` (exported from `@nx/expo/plugins/with-nx-metro`) — a Metro config wrapper that auto-adds workspace folders to `watchFolders` and routes module resolution through Nx's project graph. You compose it inside your `metro.config.js` after `getDefaultConfig` from `expo/metro-config`. This is the one piece of "magic" you must remember in monorepos: without it, Metro won't see TS path aliases from `tsconfig.base.json`.

For our template: `apps/mobile-admin` and `apps/mobile-customer` should each have their own `app.json` + `metro.config.js` so the inferred plugin picks them up independently. Shared UI goes in a `libs/mobile-ui` made via `nx g @nx/expo:lib`. EAS Build needs zero local Mac — `nx build mobile-admin --profile=production` invokes EAS in the cloud (you need `eas-cli` installed and `eas login` once).

**Key findings:**

- The only official + maintained Nx-Expo plugin is `@nx/expo`; latest is 22.7.5 published 2026-05-27, peer-deps `metro-config >= 0.82.0` and `metro-resolver >= 0.82.0`.
- @nx/expo 22.7.5 defaults new apps to Expo SDK 54 (RN 0.81.5, React 19.1, Metro 0.83); SDK 53 path retained for existing workspaces; SDK 55 (released 2026-02-25) is not yet the generator default.
- Project Crystal inference glob is exactly `**/app.{json,config.js,config.ts}`; sibling `package.json` AND `metro.config.js` must exist, and either `app.json.expo` or a `expo` dep must be present, or the plugin returns `{}` and Nx skips the project.
- Nine inferred targets are synthesised by default: `start`, `serve`, `run-ios`, `run-android`, `export`, `prebuild`, `install`, `build`, `submit` — each renameable via options in `nx.json` plugins entry.
- Four of the nine targets are real Nx executors (`@nx/expo:start`, `:install`, `:prebuild`, `:build`); the other five are wrapped shell commands (`expo start --web`, `expo run:ios`, `expo run:android`, `expo export`, `eas submit`).
- `build` target is wired to EAS Build (cloud); `submit` is `eas submit`; both require `eas-cli` installed globally and `eas login` performed once.
- Generators surface: `init`, `application`, `library`, `component`, `convert-to-inferred` (the last migrates a pre-Crystal workspace from explicit `@nx/expo:*` executors to inferred targets).
- Executors surface (12 total): `update`, `build`, `build-list`, `run`, `start`, `sync-deps`, `ensure-symlink`, `prebuild`, `install`, `export`, `submit`, `serve`.
- `withNxMetro` (from `@nx/expo/plugins/with-nx-metro`) is the supported Metro wrapper; it auto-discovers workspace folders for `watchFolders`, injects Nx's resolver, and is non-optional in monorepos.
- @nx/react-native is an official sibling plugin but `@nx/expo` and `@nx/react-native` cannot coexist in one workspace due to RN version conflicts; you pick one.
- No community Nx-Expo plugin of note: `keywords:nx-plugin expo` on npm returns zero dedicated alternatives; only boilerplate repos like `nx-expo-next-tamagui` and `aronreisx/nx-multi-expo-apps` exist.
- Known Expo Router pain in Nx: app/ directory must sit at projectRoot (not under src/), and `EXPO_ROUTER_APP_ROOT` env must be set per app in metro.config.js or routing silently fails to splash screen.

**Gotchas:**

- Inference is silent: if `metro.config.js` is missing next to `app.json`, `@nx/expo/plugin` returns `{}` and the project simply disappears from `nx graph` with no error — debug with `nx show project <name> --web`.
- Default target names collide with common library scripts: `install`, `build`, `start`, `serve`, `export` are all claimed by the plugin for any folder with an `app.json`. Rename via `nx.json` plugin options if you have a non-Expo project with the same conventional script names.
- @nx/expo and @nx/react-native are mutually exclusive in one workspace due to incompatible RN peer ranges — picking @nx/expo locks you out of `@nx/react-native` generators forever in that repo.
- Expo Router (file-based routing) silently breaks on Nx: the `app/` folder must live at projectRoot, not under `src/`, and you must set `EXPO_ROUTER_APP_ROOT=<absolute path to app dir>` inside metro.config.js per project, or the app hangs on splash with `SplashScreen.preventAutoHideAsync` never being countered.
- SDK 54 ships RN+deps as precompiled XCFrameworks (huge iOS clean-build speedup) but the Nx `:build` executor still defers to EAS Build in the cloud — local prebuild + Xcode is required if you want to take advantage of XCFrameworks on-machine.
- @nx/expo version MUST equal your Nx workspace version. Mismatch causes silent generator failures with cryptic devkit errors; pin both to the same major+minor (e.g. 22.7.5 / 22.7.5).
- SDK 55 enables `experiments.autolinkingModuleResolution=true` by default for monorepo apps — this changes how duplicates are resolved and can mask Metro misconfig that worked under SDK 53; do not assume your existing metro.config.js still bundles identically after upgrade.
- `@nx/expo 22.7.5` is internally versioned `0.0.1` in source `package.json` but publishes under workspace version 22.7.5 — don't be confused by `version 0.0.1` you may see in tarball inspection.

**Recommendation (this angle):** Use `@nx/expo` 22.7.5 with the inferred-plugin path (Project Crystal) — it is the only production-viable option in 2026 and matches your existing `apps/mobile-admin` and `apps/mobile-customer` layout. Pin to Expo SDK 54 for now (the generator default) and plan an explicit SDK 55 upgrade pass once `@nx/expo` ships generator defaults for it. If you adopt Expo Router (recommended for greenfield), bake the `EXPO_ROUTER_APP_ROOT` + `withNxMetro` + root-level `app/` directory conventions into the launcher CLI's mobile-app scaffold so junior users never hit the silent splash-screen failure.

**Citations:**

- [@nx/expo on npm — version + publish history](https://registry.npmjs.org/@nx/expo)
- [Nx — Expo Plugin docs (introduction)](https://nx.dev/docs/technologies/react/expo/introduction)
- [Nx — Expo Plugin generators](https://nx.dev/docs/technologies/react/expo/generators)
- [Nx — Expo Plugin executors](https://nx.dev/docs/technologies/react/expo/executors)
- [@nx/expo plugin.ts source (createNodesV2, glob, targets)](https://raw.githubusercontent.com/nrwl/nx/22.7.5/packages/expo/plugins/plugin.ts)
- [@nx/expo versions.ts — SDK pin (SDK 54 / RN 0.81.5)](https://raw.githubusercontent.com/nrwl/nx/22.7.5/packages/expo/src/utils/versions.ts)
- [@nx/expo withNxMetro source (Metro wrapper)](https://raw.githubusercontent.com/nrwl/nx/22.7.5/packages/expo/plugins/with-nx-metro.ts)
- [Nx Blog — Step-by-Step Guide to Creating an Expo Monorepo with Nx](https://nx.dev/blog/step-by-step-guide-to-creating-an-expo-monorepo-with-nx)
- [Nx Docs — Inferred Tasks (Project Crystal)](https://nx.dev/docs/concepts/inferred-tasks)
- [Expo Changelog — SDK 54](https://expo.dev/changelog/sdk-54)
- [Expo Changelog — SDK 55 (released 2026-02-25)](https://expo.dev/changelog/sdk-55)
- [Expo Docs — Work with monorepos (autolinking, EXPO_USE_METRO_WORKSPACE_ROOT)](https://docs.expo.dev/guides/monorepos/)
- [GitHub Issue #34012 — Cannot use Expo-Router in Nx, stuck on welcome screen](https://github.com/nrwl/nx/issues/34012)
- [Nx Discussion #21847 — Getting expo-router to work in NX](https://github.com/nrwl/nx/discussions/21847)
- [TechNet — Fix Expo Router Stuck on Splash Screen in Nx (EXPO_ROUTER_APP_ROOT workaround)](https://www.technetexperts.com/expo-router-nx-monorepo-splash/)

### Angle: Developer experience

Picture the template scaffolds you `apps/mobile-admin` and `apps/mobile-customer`, both Expo apps, and ten shared TS libs under `packages/`. Your day-to-day is built on three things stacked on top of each other.

Bottom layer — Metro. Metro is the JS bundler React Native uses. It does not understand pnpm's symlinks by default. SDK 52+ knows about monorepos and configures Metro for you (watchFolders + symlink resolution) as long as you import its `getDefaultConfig`. You only fight Metro if you customize it.

Middle layer — Expo CNG (Continuous Native Generation). The `ios/` and `android/` folders are not committed. They are generated from `app.json` + config plugins by `npx expo prebuild`. Treat them as build artifacts, like `node_modules`. This is the killer feature: upgrading SDK 54 → 55 is "bump the version, prebuild, done", not "merge 800-file Xcode project diff".

Top layer — `@nx/expo`. The plugin reads `app.json` and infers Nx targets per app: `start`, `serve`, `run-ios`, `run-android`, `prebuild`, `export`, `build`, `submit`, `install`. You write zero target config. `task dev:mobile-admin` resolves to `nx start mobile-admin` which resolves to `expo start --dev-client`.

The first 30 minutes for a junior look like: `task setup` (pnpm install, EAS login). Then `task dev:mobile-admin`. Metro opens at port 8081 with a QR code. They scan it on a development build of the app (installed once via EAS Build, since SDK 53 dropped Expo Go for custom native modules). Code change in `apps/mobile-admin/app/(tabs)/index.tsx` hot reloads in ~300ms via Fast Refresh. Edit a shared `packages/ui` component, same thing — Metro watches the workspace package, no rebuild. Open the React Native DevTools (Chrome-style, replaced the old debugger in RN 0.76) to inspect state and network.

Where it hurts: (1) the second `expo start` collides on port 8081 — you must pass `--port` explicitly because Expo only checks IPv4, so it silently binds the second app to IPv6 and you get confusing "wrong app" errors. (2) iOS builds require a Mac OR EAS Build credits — `eas build --platform ios` from Linux works but the free tier queue is slow. (3) any new native module triggers a CNG cycle: `npx expo prebuild --clean` then a new dev-client build via EAS, which is a 15-30 minute round-trip the junior won't expect after years of pure-JS work.

Slick parts: EAS Update for OTA, no app-store review for JS-only fixes; SDK 55's Hermes bytecode diffing cuts OTA payloads ~75%; precompiled XCFrameworks (SDK 54+) cut iOS clean builds from ~120s to ~10s on M-series Macs.

**Key findings:**

- Expo SDK 55 shipped 2026-02-25 with React Native 0.83 and React 19.2; Legacy Architecture is removed (not deprecated), so SDK 55+ projects are New-Architecture-only with no opt-out.
- Expo SDK 54 was the last SDK to support the Legacy Architecture; it also introduced precompiled XCFrameworks that cut iOS clean build times from ~120s to ~10s on M-series Macs.
- Expo SDK 55 raised the minimum Xcode to 26 and made `eas update` require `--environment`; both are easy to miss when bumping SDK in a monorepo.
- Expo officially supports pnpm workspaces and auto-configures Metro from SDK 52+, but the guide explicitly warns to use a `pnpm-workspace.yaml` (not the package.json `workspaces` field) and that isolated installs may need `nodeLinker: hoisted` for native libs.
- `@nx/expo` infers targets `start`, `serve`, `run-ios`, `run-android`, `prebuild`, `export`, `build`, `submit`, and `install` from each app's `app.json` via Project Crystal — no per-project target config required.
- The canonical Nx Expo blog guide is dated August 2023 and predates Project Crystal inferred tasks; using it verbatim leads to redundant `project.json` target definitions.
- EAS CLI historically mis-detects pnpm monorepos as Yarn workspaces because `@expo/package-manager` checks Yarn indicators first — symptom is corepack erroring on `yarn install` during cloud builds (eas-cli#2978).
- Expo CLI does not reliably detect dev-server port conflicts: it binds IPv4 8081 to app A, then silently binds the same port to app B on IPv6, so devs must pass `--port` explicitly when running two apps simultaneously (expo#38352).
- React Native DevTools (Chrome-style) replaced the legacy debugger in RN 0.76 / SDK 52 and was further refined in SDK 54/55's expo-dev-client UI rewrite — the LogBox UI is still experimental behind `EXPO_UNSTABLE_LOG_BOX=1` in SDK 55.
- Expo Go cannot host apps with custom native modules (e.g., MMKV, react-native-skia), so any non-trivial template app must ship a development build via EAS Build first — a one-time 15-30 min wait before hot reload becomes available.
- Hermes bytecode diffing in SDK 55 cuts OTA update download sizes ~75%; it is opt-in on SDK 55 and becomes default on SDK 56.
- Testing stack converged: `jest-expo` preset + `@testing-library/react-native` (Jest 30), with `react-test-renderer` deprecated because it does not support React 19+.

**Gotchas:**

- Two Expo apps started in parallel collide on port 8081 — and Expo's IPv4-only conflict check does not catch it; bake `--port` into the Nx `start` target for every app (mobile-admin=8081, mobile-customer=8082).
- Do NOT add Metro `watchFolders` / `disableHierarchicalLookup` manually — SDK 52+ does this and any leftover from old guides breaks pnpm symlink resolution. Run `expo start --clear` after upgrading.
- `packageManager` field + EAS Build = corepack confusion: EAS may try `yarn install` on a pnpm repo. Confirm `eas-cli` version and set `EAS_NO_VCS=1` or pin install commands in `eas.json` `build.*.cache` until the upstream fix lands.
- Custom native modules require a CNG round-trip: any new `expo-mmkv`-style dep means `npx expo prebuild --clean` plus a fresh dev-client build (15-30 min on EAS free tier) before juniors can hot reload again — surprise the first time it happens.
- Expo SDK 55 silently drops Legacy Architecture; libraries that haven't shipped Fabric/TurboModules-compatible versions will crash at runtime, not at build time. Audit every native dep before bumping SDK.
- EAS Update needs `--environment` (preview/production) explicitly in SDK 55; CI scripts written against SDK 54 will fail with a non-obvious error.
- Duplicate `react-native` or `react` in the pnpm graph causes runtime 'invalid hook call' errors that look like React bugs. Use `pnpm why react-native --depth=10` after any dep change.
- The Nx blog 'Step-by-Step Guide to Creating an Expo Monorepo' is from August 2023 — pre-Project-Crystal; do not copy its `project.json` targets, let inference do its job.

**Recommendation (this angle):** Use `@nx/expo` with Project Crystal inferred targets and Expo SDK 54 (NOT 55) as the template baseline — SDK 54 still has Legacy Architecture as an escape hatch for the long tail of native libs juniors will inevitably reach for, and gives the ~10s iOS build speedup. Standardize on pnpm workspaces with `pnpm-workspace.yaml`, never customize Metro config, and pre-bake distinct `--port` values into each app's `start` target. Ship one dev-client build via EAS per platform on day one so contributors hit hot reload in their first 30 minutes instead of the 30 minutes after.

**Citations:**

- [Expo SDK 55 Changelog (Feb 2026, RN 0.83, Legacy Architecture removed)](https://expo.dev/changelog/sdk-55)
- [Expo SDK 54 Changelog (RN 0.81, precompiled XCFrameworks, dev-client UI rewrite)](https://expo.dev/changelog/sdk-54)
- [Expo Plugin for Nx — inferred targets](https://nx.dev/nx-api/expo)
- [Nx Expo monorepo step-by-step guide (Aug 2023 — pre-Crystal, outdated targets)](https://nx.dev/blog/step-by-step-guide-to-creating-an-expo-monorepo-with-nx)
- [Expo Monorepos guide — pnpm workspaces and Metro](https://docs.expo.dev/guides/monorepos/)
- [Expo Continuous Native Generation (CNG)](https://docs.expo.dev/workflow/continuous-native-generation/)
- [Expo Development Builds — introduction](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build local vs cloud (Linux/Windows can build iOS via cloud)](https://docs.expo.dev/build-reference/local-builds/)
- [React Native DevTools replaces Chrome DevTools in RN 0.76+](https://reactnative.dev/docs/react-native-devtools)
- [Expo CLI fails to detect port 8081 conflict on IPv4 vs IPv6](https://github.com/expo/expo/issues/38352)
- [EAS CLI mis-detects pnpm as Yarn workspace](https://github.com/expo/eas-cli/issues/2978)
- [Expo unit testing with Jest + jest-expo preset](https://docs.expo.dev/develop/unit-testing/)
- [Nx Inferred Tasks (Project Crystal)](https://nx.dev/docs/concepts/inferred-tasks)
- [Expo Router introduction (file-based routing, RSC)](https://docs.expo.dev/router/introduction/)
- [Expo PNPM + isolated deps issue (#41806)](https://github.com/expo/expo/issues/41806)

### Angle: Production readiness

Picture you have two React Native apps inside this Nx monorepo (`apps/mobile-admin`, `apps/mobile-customer`) and you want to ship them to the App Store and Google Play without buying a Mac. Expo Application Services (EAS) is the answer. There are three services to learn, and the trick is they each solve a different "production hurts" problem:

1. **EAS Build** runs `xcodebuild` and `gradle` in fresh macOS / Linux VMs owned by Expo. You upload nothing; you push to git and run `eas build --platform ios --profile production` (or `nx build mobile-admin --platform=ios --profile=production` via the `@nx/expo` executor — it's a thin wrapper). EAS clones the repo, restores credentials it stores on your behalf, builds the binary, and gives you a signed `.ipa` / `.aab` URL. The Free tier gets you 15 builds/month per platform; the Production plan ($199/mo) gives 2 concurrent builders + $225 of credit; extra concurrency is $50/builder. Real cost driver isn't dollars, it's queue time on M-series Mac builders.

2. **EAS Submit** uploads the `.ipa` to App Store Connect and the `.aab` to a Google Play track (internal / alpha / beta / production). It needs two secrets stored once: an **App Store Connect API Key** (`.p8` file, replaces Apple ID passwords) and a **Google Play Service Account JSON**. Both live in the EAS dashboard, not in your repo.

3. **EAS Update** is OTA (over-the-air) for the JS/asset bundle — push a bug fix without going through review, as long as you didn't change native code. The model is "channels" embedded in the binary at build time (`production`, `staging`, `preview`) that point to "branches" of updates. SDK 55 (Feb 2026) added Hermes bytecode diffing — updates are ~75% smaller. Staged rollouts (5% → 25% → 100%) and one-click rollback (`eas update --branch production --republish --group <last-good>`) make this safe. Code signing of updates (RSA cert embedded in binary, private key on your KMS) is **Production plan only** and is the one knob that prevents Expo itself from tampering with updates — important for "open-core" trust.

The Nx-specific landmine: `@nx/expo` works, but EAS Build clones only the app directory by default. In a monorepo you must (a) set `"projectRoot": "apps/mobile-admin"` in `eas.json` so EAS understands the workspace shape, and (b) add a `postinstall` hook that pre-builds shared `libs/*` packages, because the EAS builder won't run `nx build` for your dependencies. SDK 54+ supports isolated dependencies (pnpm strict mode), but the safe default is still `node-linker=hoisted` in `pnpm-workspace.yaml` if you hit autolinking errors. SDK 55 (current as of Feb 2026) ships React Native 0.83, requires the New Architecture, and dropped Legacy Architecture entirely — so any RN library you pull in must be Fabric/TurboModule-compatible.

CI/CD shape in 2026: GitHub Actions for lint/test/typecheck (Nx affected), then either (i) `eas build --non-interactive` from GH Actions via `expo-github-action@v8`, or (ii) trigger an **EAS Workflow** (YAML lives in `.eas/workflows/`) which runs on Expo's infra and saves you maintaining macOS GH runners. EAS Workflows are the right answer for this template — fewer moving parts.

**Key findings:**

- SDK 55 (released Feb 2026, React Native 0.83) makes the New Architecture mandatory and drops Legacy Architecture entirely — any RN library brought into the template must be Fabric/TurboModule-compatible.
- SDK 54+ supports pnpm isolated installations and unified autolinking, removing the historical 'node-linker=hoisted' workaround — but `node-linker: hoisted` in pnpm-workspace.yaml remains the safest default for Nx monorepos until libs prove clean.
- EAS Build pricing in 2026: Free = 15 Android + 15 iOS builds/mo, 1 concurrency; Production = $199/mo + $225 credit + 2 concurrencies; Enterprise = custom + $1,000 credit + 5 concurrencies; extra concurrency is $50/builder/mo.
- EAS Update with Hermes bytecode diffing in SDK 55 reduces OTA download size by ~75%, materially changing the cost calculus at scale (1 TiB included on Production, $0.10/GiB after).
- EAS Update code signing (RSA cert embedded in binary, private key on your KMS) requires Production or Enterprise plan; it is NOT enabled by default — without it, EAS itself could theoretically tamper with the JS bundle.
- EAS Submit needs exactly two secrets: an App Store Connect API Key (.p8) for iOS and a Google Play service account JSON for Android — both uploaded once via EAS dashboard, then referenced by name in eas.json submit profiles.
- @nx/expo plugin (Nx 21+) ships executors `build`, `submit`, `update`, `start`, `run-ios`, `run-android`, `prebuild`, `export`, `eject` — they are thin wrappers around the eas-cli, so any EAS CLI argument flows through.
- Known Nx + EAS friction: clean Nx+Expo apps can fail EAS builds because the postinstall hook that should patch package.json silently fails — workaround is to commit a fully-resolved package.json or use `requireCommit: false` + explicit dependency listing (GitHub nrwl/nx#22195).
- EAS Workflows (YAML in `.eas/workflows/*.yml`) is Expo's own CI runner introduced in 2025 — it removes the need for self-hosted macOS GitHub runners and supports build, submit, slack, test, and matrix jobs natively.
- Real-world production adopters include Coinbase, Chime, Discord, Bluesky, FanDuel, NFL, Shop (Shopify), Pizza Hut, Burger King, Microsoft Authenticator, Replit, and 2,500+ tracked apps as of 2026 — Expo is no longer a 'startup-only' choice.
- Self-hosted EAS Build via `--local` flag on an M-series Mac mini is supported but not recommended for the template's audience; the GitHub Actions / EAS Workflows path keeps the 'no Mac required' promise intact.
- Apple-side credentials: EAS can either auto-manage (you log in once with `eas credentials`) or you can upload an existing distribution certificate + provisioning profile; once uploaded, collaborators without Apple Developer access can still trigger iOS builds.

**Gotchas:**

- EAS Build clones the workspace but only installs from the app's directory unless you set `projectRoot` in eas.json — without it, Nx libraries import as 'module not found' inside the EAS builder.
- EAS CLI commands (`eas build`, `eas update`, `eas submit`) must be run from the app directory, NOT the monorepo root — this breaks the standard `nx run` mental model and forces the @nx/expo wrappers to `cd` first.
- SDK 55 mandates New Architecture — if the template pins to SDK 55+, every native module dependency must be checked at https://reactnative.directory for 'New Arch ready' status before commit.
- Channel ↔ branch mapping in EAS Update is set on the channel, not the branch — repointing production from branch `prod-sdk54` to `prod-sdk55` is how SDK upgrades land safely; getting this backwards bricks the rollback path.
- `eas update` with a runtime version mismatch silently does nothing on clients — runtimeVersion policy (`appVersion`, `nativeVersion`, `fingerprint`) must match between the binary and the published update or devices skip it.
- EAS Update code signing is OFF by default and requires a paid plan — for an open-core template selling on 'trust', this should be ON in the production profile from day one, with a documented key-rotation runbook.
- Apple Developer Program 'Account Holder' role is required to generate signing credentials the first time — App Manager role works ONLY after the Account Holder grants 'Access to Certificates' (recent Apple policy, not the old behaviour).
- iOS builds fail on EAS with `use_frameworks!` + pnpm due to a React-bridging header path issue (expo/expo#19200) — if the template pins to pnpm, document `use_frameworks!: static` workaround OR fall back to `node-linker: hoisted`.

**Recommendation (this angle):** Ship the template on Expo SDK 55 with `@nx/expo` 21+, pnpm `node-linker: hoisted`, and EAS Workflows as the default CI (with GitHub Actions only for Nx-affected lint/test/typecheck). Lock in three eas.json profiles (`development`, `preview`, `production`), turn on EAS Update code signing in `production` from day one (it's the template's trust story for open-core), and commit a documented `postinstall` that builds `libs/*` before EAS resolves the workspace — the Nx+EAS missing-dependency bug is the single most common failure mode.

**Citations:**

- [Expo Docs — Work with monorepos](https://docs.expo.dev/guides/monorepos/)
- [Expo Docs — Set up EAS Build with a monorepo](https://docs.expo.dev/build-reference/build-with-monorepos/)
- [Nx — @nx/expo plugin reference](https://nx.dev/nx-api/expo)
- [Nx Blog — Step-by-Step Guide to Creating an Expo Monorepo with Nx](https://nx.dev/blog/step-by-step-guide-to-creating-an-expo-monorepo-with-nx)
- [Expo Changelog — SDK 55 (Feb 2026, React Native 0.83, New Architecture mandatory)](https://expo.dev/changelog/sdk-55)
- [Expo Changelog — SDK 54 (isolated dependencies, unified autolinking)](https://expo.dev/changelog/sdk-54)
- [Expo Docs — EAS Submit (App Store Connect / Google Play)](https://docs.expo.dev/submit/introduction/)
- [Expo Docs — End-to-end code signing with EAS Update](https://docs.expo.dev/eas-update/code-signing/)
- [Expo Docs — Trigger builds from CI (GitHub Actions)](https://docs.expo.dev/build/building-on-ci/)
- [Expo Docs — EAS Workflows: Get started](https://docs.expo.dev/eas/workflows/get-started/)
- [Expo Pricing (2026 tiers, concurrencies, MAU, OTA bandwidth)](https://expo.dev/pricing)
- [Evan Bacon — Who's using Expo in 2026 (2,521 tracked production apps)](https://evanbacon.dev/blog/expo-apps)
- [GitHub nrwl/nx#22195 — EAS build fails for clean Nx+Expo (missing deps, postinstall hook silently fails)](https://github.com/nrwl/nx/issues/22195)
- [Expo Docs — Apple Developer Program roles and permissions for EAS Build](https://docs.expo.dev/app-signing/apple-developer-program-roles-and-permissions/)
- [Expo Docs — Run EAS Build locally (self-hosted Mac mini path)](https://docs.expo.dev/build-reference/local-builds/)

### Angle: Tradeoffs + recommendation

Imagine you're a startup founder who needs a mobile app. You have three real choices in 2026: bare React Native (you own the iOS/Android folders), Expo (Expo owns the native side until you don't want it to), or Flutter (different language entirely — Dart). This team asks: should ts-monorepo-template default to Expo, and specifically the @nx/expo plugin?

Here is what Expo actually gives you. Expo is "managed React Native": you write JavaScript/TypeScript and React Native, and the platform handles the parts that hurt — iOS code signing, native module linking, OTA updates, store delivery. Three pieces matter:

1. CNG (Continuous Native Generation). Instead of keeping ios/ and android/ folders in git, you describe what you need in app.json and the native projects are regenerated on every build. You can still drop into native code via a "dev client" or "local Expo module" when you need to — so the escape hatch is real.

2. EAS Build. iOS builds run on Apple silicon machines in Expo's cloud. A Linux founder can ship to the App Store without ever owning a Mac. That alone justifies Expo for a solo founder.

3. EAS Update. Push JavaScript-only fixes over-the-air without going through App Review. SDK 56 made these patches 58% smaller via Hermes bytecode diffing.

Now the Nx part. @nx/expo (current version 22.6.5, June 2026) wraps Expo CLI in Nx generators and executors. It gives you `nx start mobile-customer`, `nx build mobile-customer`, affected-graph caching, and module-boundary enforcement so packages/contracts can't be imported by random places. That's the upside.

The downside is real and concrete. Expo's autolinking (the thing that wires native modules into your iOS/Android build) reads the _app's_ package.json. Nx and pnpm-style monorepos hoist dependencies to the root. So `react-native-webview` shows up at runtime as "TurboModuleRegistry could not find RNCWebViewModule" — JS works, native build is blind. Workaround: keep a minimal app-level package.json with `"react-native-webview": "*"` style stubs. Second pain: EAS Build internally assumes Yarn, and the pnpm symlink layout occasionally trips it. Third pain: Nx's major-version cadence (21→22 in months) keeps breaking the @nx/expo plugin slightly faster than Expo's own SDK churn.

So the question for the template isn't "Expo yes/no" — Expo wins vs bare RN for any non-game startup. The question is "Nx wrapper yes/no" given the autolinking friction. My recommendation: include @nx/expo for Scaling/Production profiles where the polyglot Nx graph pays off, but for Just Me and Side Project profiles ship plain Expo + pnpm workspaces — fewer moving parts, fewer ways for the iOS build to silently miss a native module the night before a demo.

**Key findings:**

- @nx/expo is actively maintained at version 22.6.5 as of June 2026, with generators for apps/libraries and executors that proxy Expo CLI commands.
- Expo SDK 54 ships with React Native 0.81 + React 19.1, and the New Architecture is enabled by default with ~83% of EAS Build projects already on it as of January 2026.
- Expo SDK 56 (May 2026) adds prebuilt iOS XCFrameworks (16% faster iOS builds), 40% faster Android cold starts, Hermes-bytecode-diffed OTA updates that are 58% smaller, and stable Expo UI (SwiftUI/Compose primitives).
- Continuous Native Generation (CNG) lets the template avoid checking in ios/ and android/ folders — they regenerate from app.json on every build, eliminating drift between native projects.
- EAS Build runs iOS builds on cloud Macs, so a Linux/Windows-only founder can ship to the App Store without owning Apple hardware.
- EAS free tier in 2026 gives 15 Android + 15 iOS builds/month + 1,000 EAS Update MAUs + 100 GiB bandwidth — enough for a single-developer prototype but not for two parallel apps in CI.
- The Starter plan is $19/month with $45 build credit; Production is $199/month with $225 build credit; per-build cost is $1-$4 depending on platform/worker size.
- Expo Router in 2026 is a full app framework with universal React Server Components in developer preview — same routing primitives on web, iOS, Android.
- The documented Nx + Expo failure mode is autolinking: Expo searches the app's package.json for native modules, but Nx/pnpm hoist deps to the root, causing runtime TurboModule-not-found errors despite JS bundles working.
- Workaround for the autolinking issue is a minimal per-app package.json with wildcard ('\*') references to each native module — proven on Nx 22 + Expo SDK 54.
- EAS Build internally assumes Yarn-style node_modules layout; pnpm monorepos work but require explicit Metro watchFolders config including node_modules/.pnpm plus unstable_enableSymlinks=true.
- React Native (Expo) holds ~35% of the cross-platform mobile market vs Flutter's ~46% in 2026, but RN wins on JS developer availability and shared code with the web app (the ts-monorepo-template's primary surface).

**Gotchas:**

- Autolinking blindness — JS works, native build silently misses modules unless each app has its own package.json listing native deps. The error message ('TurboModuleRegistry could not find X') happens at runtime, not at build time, so CI can pass and the app crashes on launch.
- EAS Build still assumes Yarn workspace layout internally; pnpm monorepos need explicit metro.config.js with watchFolders pointing at node_modules/.pnpm and unstable_enableSymlinks=true, otherwise EAS resolves dependencies from the wrong location.
- Nx's major-version churn (21 → 22 in <12 months) breaks @nx/expo more often than Expo's own SDK upgrades break apps — the wrapper is always playing catch-up, and the plugin's executor signatures change between Nx majors.
- SDK 54 is the last release where the New Architecture can be disabled; if the template pins to SDK <54 to keep an option open, it's already on a dead-end branch.
- EAS Update OTA bypasses App Review only for JS/asset changes — any native dependency bump (including upgrading expo-camera) still requires a fresh store build, so OTA is not a silver bullet for fast iteration.
- Local 'expo run:ios' on a non-Mac is impossible; the Linux-friendly story works only via EAS Build, which costs money past 15 builds/month per platform.
- Universal React Server Components in Expo Router are still developer-preview in mid-2026 — static/server output isn't fully wired, so any RSC-first architecture in the template would be betting on unfinished APIs.
- Expo Go (the prebuilt sandbox app) cannot load custom native modules, so the moment the template includes any module not in the Expo SDK, every contributor needs a dev client build — a non-obvious cliff for the Just Me profile.

**Recommendation (this angle):** Include @nx/expo by default for Scaling Startup and Production at Scale profiles where the polyglot Nx graph (TS/Python/Go/Rust + contracts) and module-boundary enforcement justify the autolinking workaround. For Just Me and Side Project profiles, ship Expo via plain pnpm workspaces (no Nx wrapper) — the autolinking trap and Nx's major-version churn are not worth the caching benefit at that scale. For Early Startup, make @nx/expo an opt-in flag in the launcher CLI, default off, with a one-paragraph doc explaining the per-app package.json workaround so contributors aren't surprised by the runtime TurboModule error.

**Citations:**

- [Expo Plugin for Nx — nx.dev](https://nx.dev/nx-api/expo)
- [Expo | Nx (technologies/react/expo)](https://nx.dev/docs/technologies/react/expo)
- [@nx/expo on npm](https://www.npmjs.com/package/@nx/expo)
- [The NX + Expo Native Module Mystery — Serhii Starodub, Jan 2026](https://serhiistarodub.medium.com/the-nx-expo-native-module-mystery-07ab83f8ad97)
- [Work with monorepos — Expo Documentation](https://docs.expo.dev/guides/monorepos/)
- [Set up EAS Build with a monorepo — Expo Documentation](https://docs.expo.dev/build-reference/build-with-monorepos/)
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [Expo SDK 56 Changelog](https://expo.dev/changelog/sdk-56)
- [Continuous Native Generation (CNG) — Expo Documentation](https://docs.expo.dev/workflow/continuous-native-generation/)
- [Introduction to development builds — Expo Documentation](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Application Services Pricing](https://expo.dev/pricing)
- [Usage-based pricing — Expo Documentation](https://docs.expo.dev/billing/usage-based-pricing/)
- [Using React Server Components in Expo Router apps](https://docs.expo.dev/guides/server-components/)
- [EAS mistakes pnpm for yarn workspace — eas-cli issue #2978](https://github.com/expo/eas-cli/issues/2978)
- [React Native vs Flutter 2026: Definitive Comparison](https://www.cozcore.com/blog/flutter-vs-react-native-2026/)

---

## Workflow metadata

| Field           | Value                       |
| --------------- | --------------------------- |
| Workflow ID     | `wf_38b1a2bb-144`           |
| Agents          | 25 (20 angle + 5 synthesis) |
| Subagent tokens | 1,649,070                   |
| Tool uses       | 597                         |
| Wall clock      | ~8 min                      |

## What's next

This report is **advisory** — it is not yet folded into the spec or plan. Options:

1. **Accept the verdicts as-is.** Open a follow-up PR to the spec/plan that (a) adds Expo to Section 12, (b) reframes mobile-\* apps as Expo, (c) adds the scaffold verbs for .NET / C / C++ / Tauri to Section 2.5, (d) updates Section 17 non-goals, (e) emits ADR-0014 for the Tauri desktop track.
2. **Defer.** Treat this report as future-them work and continue with Phase 4+ of the existing plan.
3. **Reject a specific verdict.** Push back on any individual team's verdict and I can re-dispatch that team with the corrected framing.
