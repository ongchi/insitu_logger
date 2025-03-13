use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("SQL error")]
    Sqlx(#[from] sqlx::Error),
    #[error("invalid JSON")]
    Json(#[from] serde_json::Error),
    #[error("an internal error occurred")]
    Anyhow(#[from] anyhow::Error),
    #[error("failed to parse log data")]
    AquaTrollLog(#[from] aqua_troll_log_reader::AquaTrollLogError),
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        match self {
            Error::Sqlx(e) => {
                tracing::error!("SQL error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
            }
            Error::Json(e) => {
                tracing::error!("Invalid JSON: {:?}", e);
                (StatusCode::BAD_REQUEST, e.to_string()).into_response()
            }
            Error::Anyhow(e) => {
                tracing::error!("Internal error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
            }
            Error::AquaTrollLog(e) => {
                tracing::error!("failed to parse log data: {:?}", e);
                (StatusCode::BAD_REQUEST, e.to_string()).into_response()
            }
        }
    }
}
