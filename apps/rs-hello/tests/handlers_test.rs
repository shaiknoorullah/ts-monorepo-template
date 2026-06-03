use axum::body::Body;
use axum::http::{Request, StatusCode};
use rs_hello::handlers::{health_router, ReadinessFn};
use std::sync::Arc;
use tower::ServiceExt;

#[tokio::test]
async fn healthz_returns_ok() {
    let ready: ReadinessFn = Arc::new(|| true);
    let app = health_router(ready);
    let resp = app
        .oneshot(Request::builder().uri("/healthz").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn readyz_returns_503_when_dep_down() {
    let ready: ReadinessFn = Arc::new(|| false);
    let app = health_router(ready);
    let resp = app
        .oneshot(Request::builder().uri("/readyz").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
}
