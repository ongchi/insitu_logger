use axum::{
    extract::{DefaultBodyLimit, Multipart},
    http::{header, HeaderValue, StatusCode, Uri},
    response::{IntoResponse, Response, Result},
    routing::{get, post, Router},
    Json,
};
use insitu_log_reader::InSituLogReader;
use rust_embed::RustEmbed;
use std::{io::Cursor, net::SocketAddr};
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    // Server routes
    let app = Router::new()
        .route("/", get(index_handler))
        .route("/insitu_log", post(insitu_log_handler))
        .route("/{*path}", get(static_handler))
        .layer(CorsLayer::new().allow_origin([
            HeaderValue::from_static("http://localhost:4000"),
            HeaderValue::from_static("http://localhost:5173"),
        ]))
        .layer(DefaultBodyLimit::max(100 * 1000 * 1000));

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

async fn insitu_log_handler(mut multipart: Multipart) -> Result<Json<InSituLogReader>> {
    let log = if let Some(field) = multipart.next_field().await.unwrap() {
        let file_name = field.file_name().unwrap_or("").to_string();
        let data = field.bytes().await.unwrap();
        let ext = file_name.split('.').last().unwrap_or("");

        let mut reader = Cursor::new(data);

        match ext {
            "csv" => InSituLogReader::from_csv(&mut reader)
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?,
            "txt" => InSituLogReader::from_txt(&mut reader)
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?,
            "zip" => InSituLogReader::from_zipped_html(&mut reader)
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?,
            _ => return Err(StatusCode::BAD_REQUEST)?,
        }
    } else {
        return Err(StatusCode::BAD_REQUEST)?;
    };

    Ok(Json(log))
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
