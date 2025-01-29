use axum::{
    http::{header, HeaderValue, StatusCode, Uri},
    response::{IntoResponse, Response},
    routing::{get, Router},
};
use rust_embed::RustEmbed;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    // Server routes
    let app = Router::new()
        .route("/ping", get(|| async { "pong" }))
        .route("/", get(index_handler))
        .route("/{*path}", get(static_handler))
        .layer(CorsLayer::new().allow_origin([
            HeaderValue::from_static("http://localhost:4000"),
            HeaderValue::from_static("http://localhost:5173"),
        ]));

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 4000));
    println!("Listening on {:?}", addr);
    axum_server::bind(addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn index_handler() -> impl IntoResponse {
    static_handler(Uri::from_static("/index.html")).await
}

async fn static_handler(uri: Uri) -> impl IntoResponse {
    StaticFile(uri.path().trim_start_matches("/").to_string())
}

#[derive(RustEmbed)]
#[folder = "web/dist"]
struct Assets;

pub struct StaticFile<T>(pub T);

impl<T> IntoResponse for StaticFile<T>
where
    T: Into<String>,
{
    fn into_response(self) -> Response {
        let path = self.0.into();

        match Assets::get(path.as_str()) {
            Some(content) => {
                let mime = mime_guess::from_path(path).first_or_octet_stream();
                ([(header::CONTENT_TYPE, mime.as_ref())], content.data).into_response()
            }
            None => (StatusCode::NOT_FOUND, "404 Not Found").into_response(),
        }
    }
}
