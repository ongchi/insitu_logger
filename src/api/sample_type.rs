use axum::{Extension, Json};
use serde::{Deserialize, Serialize};

use super::{ApiContext, Error};

#[derive(Debug, Serialize, Deserialize)]
pub struct SampleType {
    id: i64,
    name: String,
    variant: Option<String>,
    comment: Option<String>,
}

pub async fn list_sample_types(ctx: Extension<ApiContext>) -> Result<Json<Vec<SampleType>>, Error> {
    let sample_types = sqlx::query_as!(
        SampleType,
        "SELECT id, name, variant, comment FROM sample_type"
    )
    .fetch_all(&ctx.db)
    .await?;
    Ok(Json(sample_types))
}
