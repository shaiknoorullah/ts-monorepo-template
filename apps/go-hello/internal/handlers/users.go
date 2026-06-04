package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	userv1 "github.com/ts-monorepo-template/contracts/gen/go/user/v1"
)

type UserStore interface {
	Create(ctx context.Context, u *userv1.User) error
	Get(ctx context.Context, id string) (*userv1.User, error)
	List(ctx context.Context, limit, offset int) ([]*userv1.User, error)
}

type EventPublisher interface {
	PublishUserCreated(ctx context.Context, u *userv1.User) error
}

func RegisterUsers(r chi.Router, store UserStore, pub EventPublisher) {
	r.Route("/v1/users", func(r chi.Router) {
		r.Get("/", func(w http.ResponseWriter, req *http.Request) {
			users, err := store.List(req.Context(), 100, 0)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			_ = json.NewEncoder(w).Encode(users)
		})
		r.Post("/", func(w http.ResponseWriter, req *http.Request) {
			var u userv1.User
			if err := json.NewDecoder(req.Body).Decode(&u); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			if err := store.Create(req.Context(), &u); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if err := pub.PublishUserCreated(req.Context(), &u); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(&u)
		})
		r.Get("/{id}", func(w http.ResponseWriter, req *http.Request) {
			id := chi.URLParam(req, "id")
			u, err := store.Get(req.Context(), id)
			if err != nil {
				http.Error(w, err.Error(), http.StatusNotFound)
				return
			}
			_ = json.NewEncoder(w).Encode(u)
		})
	})
}
