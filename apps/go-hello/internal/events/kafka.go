package events

import (
	"context"
	"encoding/json"

	"github.com/segmentio/kafka-go"
	userv1 "github.com/ts-monorepo-template/contracts/gen/go/user/v1"
)

type KafkaPublisher struct {
	Writer *kafka.Writer
	Topic  string
}

func (p *KafkaPublisher) PublishUserCreated(ctx context.Context, u *userv1.User) error {
	payload, err := json.Marshal(u)
	if err != nil {
		return err
	}
	return p.Writer.WriteMessages(ctx, kafka.Message{
		Topic: p.Topic,
		Key:   []byte(u.Id),
		Value: payload,
	})
}
