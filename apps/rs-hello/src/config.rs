use figment::{providers::Env, Figment};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    #[serde(default = "default_http_port")]
    pub http_port: u16,
    #[serde(default = "default_grpc_port")]
    pub grpc_port: u16,
    #[serde(default = "default_metrics_port")]
    pub metrics_port: u16,
    pub pg_dsn: String,
    pub redis_url: String,
    pub kafka_brokers: String,
    #[serde(default = "default_otlp")]
    pub otel_exporter_otlp_endpoint: String,
    #[serde(default = "default_service_name")]
    pub otel_service_name: String,
    #[serde(default = "default_env")]
    pub deployment_env: String,
}

fn default_http_port() -> u16 {
    8080
}
fn default_grpc_port() -> u16 {
    9000
}
fn default_metrics_port() -> u16 {
    9090
}
fn default_otlp() -> String {
    "otel-collector.observability:4317".into()
}
fn default_service_name() -> String {
    "rs-hello".into()
}
fn default_env() -> String {
    "dev".into()
}

impl Config {
    pub fn from_env() -> Result<Self, figment::Error> {
        Figment::new().merge(Env::raw()).extract()
    }
}
