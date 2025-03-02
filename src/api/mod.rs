pub mod error;
pub mod people;
pub mod pump;
pub mod sample_type;
pub mod sensor_data;
pub mod serde;
pub mod task;
pub mod task_info;
pub mod well;

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
