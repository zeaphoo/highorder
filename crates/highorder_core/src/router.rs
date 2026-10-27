//! Application router.

use axum::{routing::get, Json, Router};
use serde_json::{json, Value};
use tower_http::trace::TraceLayer;

/// Builds the HighOrder application router.
pub fn router() -> Router {
    Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .layer(TraceLayer::new_for_http())
}

async fn root() -> &'static str {
    "highorder server ok"
}

async fn health() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    #[tokio::test]
    async fn health_returns_ok() {
        let response = router()
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn unknown_route_is_404() {
        let response = router()
            .oneshot(
                Request::builder()
                    .uri("/nope")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }
}
