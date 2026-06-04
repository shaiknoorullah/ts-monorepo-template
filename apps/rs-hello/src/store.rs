use sqlx::{postgres::PgPoolOptions, PgPool};

#[derive(Debug, Clone)]
pub struct UserStore {
    pub pool: PgPool,
}

impl UserStore {
    pub async fn connect(dsn: &str) -> Result<Self, sqlx::Error> {
        let pool = PgPoolOptions::new().max_connections(5).connect(dsn).await?;
        Ok(Self { pool })
    }

    pub async fn init_schema(&self) -> Result<(), sqlx::Error> {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS users (id text primary key, email text, display_name text, created_at timestamptz default now())",
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn create(&self, id: &str, email: &str, display_name: &str) -> Result<(), sqlx::Error> {
        sqlx::query("INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3)")
            .bind(id)
            .bind(email)
            .bind(display_name)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn get(&self, id: &str) -> Result<Option<(String, String, String)>, sqlx::Error> {
        let row: Option<(String, String, String)> =
            sqlx::query_as("SELECT id, email, display_name FROM users WHERE id = $1")
                .bind(id)
                .fetch_optional(&self.pool)
                .await?;
        Ok(row)
    }
}
