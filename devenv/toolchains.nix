# devenv/toolchains.nix
{ pkgs, lib, profile }:
let
  wants = {
    "p-solo"          = { node = true; py = true; go = false; rs = false; cloud = []; };
    "p-hobby"         = { node = true; py = true; go = false; rs = false; cloud = []; };
    "p-startup-small" = { node = true; py = true; go = true;  rs = false; cloud = [ "terraform" "hcloud-cli" ]; };
    "p-startup-scale" = { node = true; py = true; go = true;  rs = true;  cloud = [ "terraform" "awscli2" ]; };
    "p-enterprise"    = { node = true; py = true; go = true;  rs = true;  cloud = [ "terraform" "awscli2" "azure-cli" "google-cloud-sdk" "vault" "istioctl" ]; };
  };
  w = wants.${profile} or wants."p-solo";
in
{
  languages.javascript = {
    enable = w.node;
    package = pkgs.nodejs_22;
    pnpm.enable = w.node;
  };
  languages.python = {
    enable = w.py;
    package = pkgs.python313;
    uv.enable = w.py;
  };
  languages.go = {
    enable = w.go;
    package = pkgs.go_1_24;
  };
  languages.rust = {
    enable = w.rs;
    channel = "stable";
    components = [ "rustc" "cargo" "clippy" "rustfmt" ];
  };

  packages = with pkgs; [
    go-task
    direnv
    secretspec
    cosign
    kubectl
    jq
    yq-go
    git
    gnumake
    shellcheck
    gitleaks
  ] ++ (map (n: pkgs.${n}) w.cloud);

  banner = ''
    echo "ts-monorepo-template devenv shell (profile=${profile})"
  '';
}
