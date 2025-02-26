use axum::http::{header, StatusCode, Uri};
use axum::response::{IntoResponse, Response};
use rust_embed::RustEmbed;

pub async fn index_handler() -> impl IntoResponse {
    static_handler(Uri::from_static("/index.html")).await
}

pub async fn static_handler(uri: Uri) -> impl IntoResponse {
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
