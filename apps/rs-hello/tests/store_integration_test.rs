use rs_hello::store::UserStore;
use testcontainers::runners::AsyncRunner;
use testcontainers_modules::postgres::Postgres;

#[tokio::test]
#[ignore]
async fn user_store_round_trip() {
    let pg = Postgres::default().start().await.unwrap();
    let host = pg.get_host().await.unwrap();
    let port = pg.get_host_port_ipv4(5432).await.unwrap();
    let dsn = format!("postgres://postgres:postgres@{}:{}/postgres", host, port);

    let store = UserStore::connect(&dsn).await.expect("connect");
    store.init_schema().await.expect("schema");
    store
        .create("11111111-1111-1111-1111-111111111111", "a@b.c", "Alice")
        .await
        .expect("create");

    let got = store
        .get("11111111-1111-1111-1111-111111111111")
        .await
        .expect("get")
        .expect("row");
    assert_eq!(got.1, "a@b.c");
    assert_eq!(got.2, "Alice");
}
