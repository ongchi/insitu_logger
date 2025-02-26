pub mod api;
pub mod frontend;

use std::net::SocketAddr;

use api::sensor_data::{clear_sensor_data, insert_sensor_data};
use axum::extract::DefaultBodyLimit;
use axum::http::{HeaderValue, Method};
use axum::routing::{get, post, put, Router};
use axum::Extension;
use sqlx::sqlite::SqlitePool;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::api::{insitu_log_handler, ApiContext};
use crate::frontend::{index_handler, static_handler};

#[tokio::main]
async fn main() {
    // Setup tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Setup database
    let pool = SqlitePool::connect("sqlite:water_sampling.db")
        .await
        .unwrap();

    // Server routes
    let app = Router::new()
        .route("/", get(index_handler))
        .route(
            "/sensor_log/{task_id}",
            put(insert_sensor_data).delete(clear_sensor_data),
        )
        .route("/sensor_log/upload", post(insitu_log_handler))
        .route("/{*path}", get(static_handler))
        .layer(Extension(ApiContext::new(pool)))
        .layer(DefaultBodyLimit::max(100 * 1000 * 1000))
        .layer(
            CorsLayer::new()
                // For frontend development
                .allow_origin([HeaderValue::from_static("http://localhost:5173")])
                .allow_methods([Method::GET, Method::POST, Method::DELETE]),
        );

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 4000));
    tracing::info!("Listening on {:?}", addr);
    axum_server::bind(addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
