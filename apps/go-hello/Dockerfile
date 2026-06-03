# syntax=docker/dockerfile:1.10
# Rendered from internal/templates/dockerfiles/go.Dockerfile.template.
# Re-render via `task app:refresh-dockerfile -- --app go-hello`.

ARG GO_VERSION=1.24
ARG RUNTIME=gcr.io/distroless/static-debian12:nonroot

FROM golang:${GO_VERSION}-bookworm AS deps
WORKDIR /src
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod,id=go-mod-${TARGETARCH} \
    go mod download

FROM deps AS build
ARG TARGETOS
ARG TARGETARCH
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod,id=go-mod-${TARGETARCH} \
    --mount=type=cache,target=/root/.cache/go-build,id=go-build-${TARGETARCH} \
    mkdir -p /out && \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
      go build -trimpath -ldflags="-s -w" -o /out/app ./cmd/server

FROM ${RUNTIME} AS runtime
WORKDIR /app
COPY --from=build /out/app /app/app
USER nonroot:nonroot
ENTRYPOINT ["/app/app"]
