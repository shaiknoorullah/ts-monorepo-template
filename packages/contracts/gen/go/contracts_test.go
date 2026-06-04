package contracts_test

import (
	"testing"

	healthv1 "github.com/ts-monorepo-template/contracts/gen/go/health/v1"
	userv1 "github.com/ts-monorepo-template/contracts/gen/go/user/v1"
)

func TestUserMessageFields(t *testing.T) {
	u := &userv1.User{Id: "u-1", Email: "a@b.c", DisplayName: "Test"}
	if u.GetId() != "u-1" {
		t.Fatalf("unexpected id: %q", u.GetId())
	}
	if u.GetEmail() != "a@b.c" {
		t.Fatalf("unexpected email: %q", u.GetEmail())
	}
}

func TestHealthServingEnum(t *testing.T) {
	if healthv1.HealthCheckResponse_SERVING_STATUS_SERVING != 1 {
		t.Fatalf("SERVING enum value drifted: %d", healthv1.HealthCheckResponse_SERVING_STATUS_SERVING)
	}
}
