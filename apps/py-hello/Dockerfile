# syntax=docker/dockerfile:1.10
# Rendered from internal/templates/dockerfiles/python.Dockerfile.template.
# Re-render via `task app:refresh-dockerfile -- --app py-hello`.

ARG PY_VERSION=3.13
ARG RUNTIME=gcr.io/distroless/python3-debian12:nonroot

FROM python:${PY_VERSION}-slim-bookworm AS deps
RUN pip install --no-cache-dir uv==0.5.*
WORKDIR /src
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv,id=uv-${TARGETARCH} \
    uv sync --frozen --no-dev --no-install-project

FROM deps AS build
COPY . .
RUN --mount=type=cache,target=/root/.cache/uv,id=uv-${TARGETARCH} \
    uv sync --frozen --no-dev --compile-bytecode

FROM ${RUNTIME} AS runtime
WORKDIR /app
COPY --from=build /src/.venv /app/.venv
COPY --from=build /src/src/py_hello /app/py_hello
ENV PYTHONPATH=/app PATH=/app/.venv/bin:$PATH
USER nonroot:nonroot
ENTRYPOINT ["python", "-m", "py_hello"]
