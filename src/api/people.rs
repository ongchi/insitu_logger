use axum::{Extension, Json};
use serde::{Deserialize, Serialize};

use super::{ApiContext, Error};

#[derive(Debug, Serialize, Deserialize)]
pub struct People {
    id: i64,
    name: String,
}

pub async fn list_people(ctx: Extension<ApiContext>) -> Result<Json<Vec<People>>, Error> {
    let people = sqlx::query_as!(People, "SELECT id, name FROM people")
        .fetch_all(&ctx.db)
        .await?;
    Ok(Json(people))
}
