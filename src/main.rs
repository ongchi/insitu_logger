pub mod api;
pub mod frontend;

use std::net::SocketAddr;

use axum::extract::DefaultBodyLimit;
use axum::http::{header, HeaderValue, Method};
use axum::routing::{delete, get, post, put, Router};
use axum::Extension;
use sqlx::sqlite::SqlitePool;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::api::ApiContext;
use crate::frontend::{index_handler, static_handler};

#[tokio::main]
async fn main() {
    // Setup tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Setup database
    let pool = SqlitePool::connect("sqlite://water_sampling.db")
        .await
        .unwrap();

    // Server routes
    let app = Router::new()
        .route("/api/well", get(api::well::list_wells))
        .route("/api/pump", get(api::pump::list_pumps))
        .route("/api/sample_type", get(api::sample_type::list_sample_types))
        .route("/api/people", get(api::people::list_people))
        .route("/api/task", put(api::task::insert_task))
        .route(
            "/api/task/{task_id}",
            delete(api::task::delete_task).patch(api::task::update_task),
        )
        .route(
            "/api/task/{task_id}/sample_set",
            get(api::task::get_sample_set).patch(api::task::update_sample_set),
        )
        .route(
            "/api/task/{task_id}/sensor",
            get(api::sensor_data::get_sensor_data)
                .post(api::sensor_data::insert_sensor_data)
                .delete(api::sensor_data::clear_sensor_data),
        )
        .route(
            "/api/task/{task_id}/sensor/last_timestamp",
            get(api::sensor_data::get_latest_timestamp),
        )
        .route(
            "/api/task/{task_id}/info",
            get(api::task_info::get_task_info).put(api::task_info::insert_task_info),
        )
        .route(
            "/api/task/{task_id}/info/{task_info_id}",
            delete(api::task_info::delete_task_info).patch(api::task_info::update_task_info),
        )
        .route(
            "/api/task/{task_id}/info/{task_info_id}/minuted_by",
            get(api::task_info::get_minuted_by).put(api::task_info::add_minuted_by),
        )
        .route(
            "/api/task/{task_id}/info/{task_info_id}/minuted_by/{people_id}",
            delete(api::task_info::delete_minuted_by),
        )
        .route(
            "/api/task/{task_id}/info/{task_info_id}/sampled_by",
            get(api::task_info::get_sampled_by).put(api::task_info::add_sampled_by),
        )
        .route(
            "/api/task/{task_id}/info/{task_info_id}/sampled_by/{people_id}",
            delete(api::task_info::delete_sampled_by),
        )
        .route(
            "/api/task/last_timestamp",
            get(api::task_info::get_last_timestamp),
        )
        .route("/api/task/summary", get(api::task::list_task_summaries))
        .route(
            "/sensor_log/upload",
            post(api::sensor_data::insitu_log_handler),
        )
        .route("/", get(index_handler))
        .route("/{*path}", get(static_handler))
        .layer(Extension(ApiContext::new(pool)))
        .layer(DefaultBodyLimit::max(100 * 1000 * 1000))
        .layer(
            CorsLayer::new()
                // For frontend development
                .allow_origin([HeaderValue::from_static("http://localhost:5173")])
                .allow_methods([
                    Method::GET,
                    Method::POST,
                    Method::PATCH,
                    Method::PUT,
                    Method::DELETE,
                ])
                .allow_headers([header::CONTENT_TYPE]),
        );
    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 4000));
    tracing::info!("Listening on {:?}", addr);
    axum_server::bind(addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
