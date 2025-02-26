pub mod error;
pub mod sensor_data;

use sqlx::sqlite::SqlitePool;

pub use error::Error;
pub use sensor_data::insitu_log_handler;

#[derive(Clone)]
pub struct ApiContext {
    db: SqlitePool,
}

impl ApiContext {
    pub fn new(db: SqlitePool) -> Self {
        Self { db }
    }
}
