use std::sync::Arc;

use axum::{
    extract::Path,
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::get,
    Router,
};
use serde_json::json;

pub type ReadinessFn = Arc<dyn Fn() -> bool + Send + Sync>;

pub fn health_router(ready: ReadinessFn) -> Router {
    Router::new()
        .route("/healthz", get(|| async { Json(json!({ "status": "ok" })) }))
        .route(
            "/readyz",
            get({
                let ready = ready.clone();
                move || {
                    let ready = ready.clone();
                    async move {
                        if (ready)() {
                            (StatusCode::OK, Json(json!({ "status": "ok" }))).into_response()
                        } else {
                            (StatusCode::SERVICE_UNAVAILABLE, Json(json!({ "status": "down" })))
                                .into_response()
                        }
                    }
                }
            }),
        )
}

pub fn users_router() -> Router {
    Router::new()
        .route("/v1/users", get(list_users).post(create_user))
        .route("/v1/users/:id", get(get_user))
}

async fn list_users() -> impl IntoResponse {
    Json(json!([]))
}

async fn create_user(Json(body): Json<serde_json::Value>) -> impl IntoResponse {
    (StatusCode::CREATED, Json(body))
}

async fn get_user(Path(id): Path<String>) -> impl IntoResponse {
    Json(json!({ "id": id }))
}
