use axum::response::{IntoResponse, Response};

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("SQL error")]
    Sqlx(#[from] sqlx::Error),
    #[error("an internal error occurred")]
    Anyhow(#[from] anyhow::Error),
    #[error("failed to parse log data")]
    InSitulog(#[from] insitu_log_reader::InSituLogError),
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        match self {
            Error::Sqlx(e) => {
                tracing::error!("SQL error: {:?}", e);
                axum::http::StatusCode::INTERNAL_SERVER_ERROR.into_response()
            }
            Error::Anyhow(e) => {
                tracing::error!("Internal error: {:?}", e);
                axum::http::StatusCode::INTERNAL_SERVER_ERROR.into_response()
            }
            Error::InSitulog(e) => {
                tracing::error!("failed to parse log data: {:?}", e);
                axum::http::StatusCode::BAD_REQUEST.into_response()
            }
        }
    }
}
