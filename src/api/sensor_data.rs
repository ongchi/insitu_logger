use std::io::Cursor;

use axum::extract::Multipart;
use axum::http::StatusCode;
use axum::response::Result;
use axum::Json;
use insitu_log_reader::InSituLogReader;

pub async fn insitu_log_handler(mut multipart: Multipart) -> Result<Json<InSituLogReader>> {
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
