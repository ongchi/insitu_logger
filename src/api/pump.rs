use axum::{Extension, Json};
use serde::{Deserialize, Serialize};

use super::{ApiContext, Error};

#[derive(Debug, Serialize, Deserialize)]
pub struct Pump {
    id: i64,
    name: String,
    comment: Option<String>,
}

pub async fn list_pumps(ctx: Extension<ApiContext>) -> Result<Json<Vec<Pump>>, Error> {
    let pumps = sqlx::query_as!(Pump, "SELECT id, name, comment FROM pump")
        .fetch_all(&ctx.db)
        .await?;
    Ok(Json(pumps))
}
