package store

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	userv1 "github.com/ts-monorepo-template/contracts/gen/go/user/v1"
)

type PGUserStore struct {
	Pool *pgxpool.Pool
}

func (s *PGUserStore) Create(ctx context.Context, u *userv1.User) error {
	_, err := s.Pool.Exec(ctx,
		`INSERT INTO users (id, email, display_name, created_at) VALUES ($1, $2, $3, now())`,
		u.Id, u.Email, u.DisplayName)
	return err
}

func (s *PGUserStore) Get(ctx context.Context, id string) (*userv1.User, error) {
	row := s.Pool.QueryRow(ctx, `SELECT id, email, display_name FROM users WHERE id = $1`, id)
	var u userv1.User
	if err := row.Scan(&u.Id, &u.Email, &u.DisplayName); err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *PGUserStore) List(ctx context.Context, limit, offset int) ([]*userv1.User, error) {
	rows, err := s.Pool.Query(ctx,
		`SELECT id, email, display_name FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*userv1.User
	for rows.Next() {
		var u userv1.User
		if err := rows.Scan(&u.Id, &u.Email, &u.DisplayName); err != nil {
			return nil, err
		}
		out = append(out, &u)
	}
	return out, rows.Err()
}
