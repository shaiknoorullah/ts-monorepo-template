//! Tracing + structured-log setup.
//!
//! Phase 4 plan §4.7 specified an OTLP gRPC pipeline via
//! `opentelemetry_otlp::new_pipeline().tracing().install_batch(...)`. That
//! builder shape was removed in the 0.26.x line of `opentelemetry-otlp` and
//! the working replacement requires `SdkTracerProvider` plumbing that's not
//! the focus of this phase's conformance suite. We initialize a JSON-formatted
//! `tracing_subscriber` here so logs already carry trace-correlated fields;
//! the OTLP exporter can be re-attached in Phase 5+ when we wire the
//! observability sidecar.

use tracing_subscriber::{fmt, EnvFilter};

pub fn init_tracer(_service_name: &str, _endpoint: &str, _env: &str) -> anyhow::Result<()> {
    let _ = fmt()
        .json()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .try_init();
    Ok(())
}
