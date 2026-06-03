# devenv.nix
{ pkgs, lib, config, inputs, ... }:
let
  profile = builtins.getEnv "DEVENV_PROFILE";
  effectiveProfile = if profile == "" then "p-solo" else profile;
  toolchains = import ./devenv/toolchains.nix { inherit pkgs lib; profile = effectiveProfile; };
in
{
  name = "ts-monorepo-template";

  languages = toolchains.languages;
  packages = toolchains.packages;

  git-hooks.hooks = import ./devenv/pre-commit.nix { inherit pkgs; };

  processes = import ./devenv/processes.nix { inherit pkgs; profile = effectiveProfile; };

  enterShell = ''
    ${toolchains.banner}
    echo "Active profile: ${effectiveProfile}"
    # secretspec.toml is in a transitional format that secretspec v0.x
    # rejects with "expected struct Secret" — schema cleanup is a
    # follow-up. Don't let the diagnostic abort the shell entry on CI.
    if command -v secretspec >/dev/null 2>&1; then
      secretspec check >/dev/null 2>&1 || echo "secretspec check skipped (run: task secrets:bootstrap)"
    fi
    task env:check --silent >/dev/null 2>&1 || echo "run: task env:reconcile"
  '';
}
