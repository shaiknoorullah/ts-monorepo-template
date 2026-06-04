# devenv/processes.nix
{ pkgs, profile }:
{
  # data-plane processes wire up in Phase 5 once docker-compose lands.
  # Stub structure here so devenv.nix evaluates cleanly Day-1.
  placeholder = {
    exec = "true";
  };
}
