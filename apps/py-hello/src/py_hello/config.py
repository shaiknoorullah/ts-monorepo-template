from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", env_file=None)

    http_port: int = 8080
    grpc_port: int = 9000
    metrics_port: int = 9090
    pg_dsn: str = "postgresql+asyncpg://hello:hello@localhost:5432/hello"
    redis_url: str = "redis://localhost:6379/0"
    kafka_brokers: str = "localhost:9092"
    otel_exporter_otlp_endpoint: str = "otel-collector.observability:4317"
    otel_service_name: str = "py-hello"
    deployment_env: str = "dev"
