//go:build integration

package integration

import (
	"context"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"

	"github.com/ts-monorepo-template/apps/go-hello/internal/store"
	userv1 "github.com/ts-monorepo-template/contracts/gen/go/user/v1"
)

func TestPGUserStoreRoundTrip(t *testing.T) {
	ctx := context.Background()
	pg, err := tcpostgres.Run(ctx,
		"postgres:16-alpine",
		tcpostgres.WithDatabase("hello"),
		tcpostgres.WithUsername("hello"),
		tcpostgres.WithPassword("hello"),
		tcpostgres.BasicWaitStrategies(),
	)
	if err != nil {
		t.Fatalf("postgres container: %v", err)
	}
	defer func() { _ = pg.Terminate(ctx) }()

	dsn, err := pg.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("connstr: %v", err)
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("pool: %v", err)
	}
	defer pool.Close()

	if _, err := pool.Exec(ctx, `CREATE TABLE users (id text primary key, email text, display_name text, created_at timestamptz default now())`); err != nil {
		t.Fatalf("create table: %v", err)
	}

	s := &store.PGUserStore{Pool: pool}
	u := &userv1.User{Id: "11111111-1111-1111-1111-111111111111", Email: "a@b.c", DisplayName: "Alice"}
	if err := s.Create(ctx, u); err != nil {
		t.Fatalf("create: %v", err)
	}
	got, err := s.Get(ctx, u.Id)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.Email != "a@b.c" || got.DisplayName != "Alice" {
		t.Fatalf("round-trip mismatch: %+v", got)
	}
}
