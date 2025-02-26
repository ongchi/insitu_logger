use std::io::Cursor;

use axum::extract::{Extension, Multipart, Path};
use axum::Json;
use insitu_log_reader::{InSituLogError, InSituLogReader};

use super::{ApiContext, Error};

pub async fn insitu_log_handler(mut multipart: Multipart) -> Result<Json<InSituLogReader>, Error> {
    let log = if let Some(field) = multipart.next_field().await.unwrap() {
        let file_name = field.file_name().unwrap_or("").to_string();
        let data = field.bytes().await.unwrap();
        let ext = file_name.split('.').last().unwrap_or("");

        let mut reader = Cursor::new(data);

        match ext {
            "csv" => InSituLogReader::from_csv(&mut reader)?,
            "txt" => InSituLogReader::from_txt(&mut reader)?,
            "zip" => InSituLogReader::from_zipped_html(&mut reader)?,
            _ => return Err(InSituLogError::InvalidData)?,
        }
    } else {
        return Err(InSituLogError::InvalidData)?;
    };

    Ok(Json(log))
}

pub async fn insert_sensor_data(
    ctx: Extension<ApiContext>,
    Path(task_id): Path<u32>,
) -> Result<(), Error> {
    unimplemented!()
}

pub async fn clear_sensor_data(
    ctx: Extension<ApiContext>,
    Path(task_id): Path<u32>,
) -> Result<(), Error> {
    sqlx::query!("DELETE FROM sensor_data WHERE task_id = $1", task_id)
        .fetch_one(&ctx.db)
        .await?;

    Ok(())
}
