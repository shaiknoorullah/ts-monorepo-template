package config

import "github.com/kelseyhightower/envconfig"

type Config struct {
	HTTPPort     int    `envconfig:"HTTP_PORT" default:"8080"`
	GRPCPort     int    `envconfig:"GRPC_PORT" default:"9000"`
	MetricsPort  int    `envconfig:"METRICS_PORT" default:"9090"`
	PGDSN        string `envconfig:"PG_DSN" required:"true"`
	RedisURL     string `envconfig:"REDIS_URL" required:"true"`
	KafkaBrokers string `envconfig:"KAFKA_BROKERS" required:"true"`
	OTLPEndpoint string `envconfig:"OTEL_EXPORTER_OTLP_ENDPOINT" default:"otel-collector.observability:4317"`
	ServiceName  string `envconfig:"OTEL_SERVICE_NAME" default:"go-hello"`
	Env          string `envconfig:"DEPLOYMENT_ENV" default:"dev"`
}

func Load() (Config, error) {
	var c Config
	err := envconfig.Process("", &c)
	return c, err
}
