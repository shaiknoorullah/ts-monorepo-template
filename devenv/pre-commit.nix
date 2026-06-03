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
  };
  gitleaks.enable = true;
}
