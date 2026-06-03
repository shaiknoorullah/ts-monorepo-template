# syntax=docker/dockerfile:1.10
# Rendered from internal/templates/dockerfiles/rust.Dockerfile.template.
# Re-render via `task app:refresh-dockerfile -- --app rs-hello`.
#
# Phase 4 deviation: rdkafka was disabled at the workspace level (libcurl4-openssl-dev
# + librdkafka-dev not available in every sandbox/CI runner). This Dockerfile mirrors
# that decision — no apt-get install of librdkafka-dev. To re-enable, uncomment
# `rdkafka.workspace = true` in apps/rs-hello/Cargo.toml AND add a system-deps
# install layer here.

ARG RUST_VERSION=1.83
ARG RUNTIME=gcr.io/distroless/cc-debian12:nonroot

FROM rust:${RUST_VERSION}-bookworm AS chef
RUN cargo install cargo-chef --locked --version 0.1.*
WORKDIR /src

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS deps
COPY --from=planner /src/recipe.json recipe.json
RUN --mount=type=cache,target=/usr/local/cargo/registry,id=cargo-registry-${TARGETARCH} \
    --mount=type=cache,target=/usr/local/cargo/git,id=cargo-git-${TARGETARCH} \
    --mount=type=cache,target=/src/target,id=cargo-target-${TARGETARCH} \
    cargo chef cook --release --recipe-path recipe.json

FROM deps AS build
COPY . .
RUN --mount=type=cache,target=/usr/local/cargo/registry,id=cargo-registry-${TARGETARCH} \
    --mount=type=cache,target=/usr/local/cargo/git,id=cargo-git-${TARGETARCH} \
    --mount=type=cache,target=/src/target,id=cargo-target-${TARGETARCH} \
    mkdir -p /out && \
    cargo build --release --bin rs-hello && \
    cp /src/target/release/rs-hello /out/app

FROM ${RUNTIME} AS runtime
WORKDIR /app
COPY --from=build /out/app /app/app
USER nonroot:nonroot
ENTRYPOINT ["/app/app"]
