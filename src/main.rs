pub mod api;
pub mod frontend;

use std::net::SocketAddr;

use axum::extract::DefaultBodyLimit;
use axum::routing::{get, post, Router};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::api::insitu_log_handler;
use crate::frontend::{index_handler, static_handler};

#[tokio::main]
async fn main() {
    // Setup tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Server routes
    let app = Router::new()
        .route("/", get(index_handler))
        .route("/upload/sensor_log", post(insitu_log_handler))
        .route("/{*path}", get(static_handler))
        .layer(DefaultBodyLimit::max(100 * 1000 * 1000));

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 4000));
    tracing::info!("Listening on {:?}", addr);
    axum_server::bind(addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
