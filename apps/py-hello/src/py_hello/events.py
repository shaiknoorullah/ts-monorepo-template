import json

from aiokafka import AIOKafkaProducer


class UserEventPublisher:
    def __init__(self, brokers: str, topic: str = "user.created") -> None:
        self._brokers = brokers
        self._topic = topic
        self._producer: AIOKafkaProducer | None = None

    async def start(self) -> None:
        self._producer = AIOKafkaProducer(bootstrap_servers=self._brokers)
        await self._producer.start()

    async def stop(self) -> None:
        if self._producer:
            await self._producer.stop()

    async def publish_user_created(self, user: dict[str, str]) -> None:
        assert self._producer is not None
        await self._producer.send_and_wait(
            self._topic, json.dumps(user).encode("utf-8"), key=user["id"].encode("utf-8")
        )
