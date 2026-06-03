use std::net::SocketAddr;
use std::sync::Arc;

use rs_hello::{config::Config, handlers, telemetry};
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cfg = Config::from_env()?;
    telemetry::init_tracer(
        &cfg.otel_service_name,
        &cfg.otel_exporter_otlp_endpoint,
        &cfg.deployment_env,
    )?;

    let ready: handlers::ReadinessFn = Arc::new(|| true);
    let app = handlers::health_router(ready).merge(handlers::users_router());

    let addr: SocketAddr = format!("0.0.0.0:{}", cfg.http_port).parse()?;
    let listener = TcpListener::bind(addr).await?;
    tracing::info!(port = cfg.http_port, "http listening");
    axum::serve(listener, app).await?;
    Ok(())
}
