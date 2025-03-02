use axum::{Extension, Json};
use serde::{Deserialize, Serialize};

use super::{ApiContext, Error};

#[derive(Debug, Serialize, Deserialize)]
pub struct Well {
    id: i64,
    name: String,
    #[serde(rename = "type")]
    type_: Option<String>,
    comment: Option<String>,
}

pub async fn list_wells(ctx: Extension<ApiContext>) -> Result<Json<Vec<Well>>, Error> {
    let wells = sqlx::query_as!(Well, "SELECT id, name, type as type_, comment FROM well")
        .fetch_all(&ctx.db)
        .await?;
    Ok(Json(wells))
}
