package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/segmentio/kafka-go"

	"github.com/ts-monorepo-template/apps/go-hello/internal/config"
	"github.com/ts-monorepo-template/apps/go-hello/internal/events"
	"github.com/ts-monorepo-template/apps/go-hello/internal/handlers"
	"github.com/ts-monorepo-template/apps/go-hello/internal/store"
	"github.com/ts-monorepo-template/apps/go-hello/internal/telemetry"
)

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(os.Stdout)

	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("config load")
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	shutdown, err := telemetry.InitTracer(ctx, cfg.OTLPEndpoint, cfg.ServiceName, cfg.Env)
	if err != nil {
		log.Fatal().Err(err).Msg("otel init")
	}
	defer func() { _ = shutdown(context.Background()) }()

	pool, err := pgxpool.New(ctx, cfg.PGDSN)
	if err != nil {
		log.Fatal().Err(err).Msg("pgxpool")
	}
	defer pool.Close()

	kw := &kafka.Writer{Addr: kafka.TCP(cfg.KafkaBrokers), Balancer: &kafka.LeastBytes{}}
	defer func() { _ = kw.Close() }()

	r := chi.NewRouter()
	handlers.RegisterHealth(r, func() error { return pool.Ping(ctx) })
	handlers.RegisterUsers(r, &store.PGUserStore{Pool: pool}, &events.KafkaPublisher{Writer: kw, Topic: "user.created"})

	metricsMux := http.NewServeMux()
	metricsMux.Handle("/metrics", promhttp.Handler())
	go func() { _ = http.ListenAndServe(fmt.Sprintf(":%d", cfg.MetricsPort), metricsMux) }()

	srv := &http.Server{Addr: fmt.Sprintf(":%d", cfg.HTTPPort), Handler: r}
	go func() {
		log.Info().Int("port", cfg.HTTPPort).Msg("http listening")
		_ = srv.ListenAndServe()
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	_ = srv.Shutdown(context.Background())
}
