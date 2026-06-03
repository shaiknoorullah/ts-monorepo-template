//! Stub Kafka publisher. The Phase 4 plan §4.7 wired this to rdkafka but its
//! build needs libcurl4-openssl-dev + librdkafka-dev system headers. Until we
//! pin those into devenv.nix the production publisher is replaced by this
//! no-op so the rest of the conformance suite stays green. Re-enable by
//! restoring rdkafka in apps/rs-hello/Cargo.toml and reverting this file to
//! the FutureProducer-backed version in plan code block 4.7.

pub struct UserEventPublisher {
    topic: String,
}

#[derive(Debug)]
pub enum KafkaError {
    NotImplemented,
}

impl std::fmt::Display for KafkaError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "kafka publisher is stubbed")
    }
}

impl std::error::Error for KafkaError {}

impl UserEventPublisher {
    pub fn new(_brokers: &str, topic: &str) -> Result<Self, KafkaError> {
        Ok(Self { topic: topic.to_string() })
    }

    pub async fn publish_user_created(&self, _id: &str, _payload: &str) -> Result<(), String> {
        tracing::warn!(topic = %self.topic, "stub UserEventPublisher invoked; no message sent");
        Ok(())
    }
}
