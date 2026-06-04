# Makefile — POSIX fallback for hosts without `task` installed.
# Never the primary path; documented in docs/dev/SETUP.md.
.PHONY: install dev test lint ci clean

TASK := $(shell command -v task 2>/dev/null)

install:
	@if [ -z "$(TASK)" ]; then \
	  echo "Task not found. Install with: nix profile install nixpkgs#go-task"; exit 127; \
	fi
	@task install

dev test lint ci clean:
	@task $@
