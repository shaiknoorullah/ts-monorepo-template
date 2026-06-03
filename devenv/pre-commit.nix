# devenv/pre-commit.nix
{ pkgs }:
{
  nixpkgs-fmt.enable = true;
  prettier = {
    enable = true;
    excludes = [ "pnpm-lock.yaml" "dist/" ".nx/" ];
  };
  eslint.enable = true;
  ruff.enable = true;
  ruff-format.enable = true;
  gofmt.enable = true;
  golangci-lint.enable = true;
  rustfmt.enable = true;
  clippy = {
    enable = true;
    entry = "${pkgs.cargo}/bin/cargo clippy -- -D warnings";
  };
  shellcheck.enable = true;
  commitlint = {
    enable = true;
    stages = [ "commit-msg" ];
    # `commitlint` is not a built-in git-hooks.nix hook, so we need an
    # explicit entry; the workspace already pins @commitlint/cli via
    # pnpm. Without this entry devenv evaluation aborts with:
    #   error: The option `git-hooks.hooks.commitlint.entry' was
    #     accessed but has no value defined.
    entry = "pnpm exec commitlint --edit";
    language = "system";
  };
  gitleaks.enable = true;
}
