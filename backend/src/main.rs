use std::time::Instant;

use axum::{extract::State, response::IntoResponse, routing::get, Router};
use axum_typed_websockets::{Message, WebSocket, WebSocketUpgrade};
use serde::{Deserialize, Serialize};
use sqlx::{migrate::Migrator, prelude::*, sqlite::SqliteConnectOptions, SqlitePool};
use tokio::net::TcpListener;

static MIGRATOR: Migrator = sqlx::migrate!();

#[derive(Debug, Clone)]
pub struct AppState {
    pool: SqlitePool,
}

async fn ws_handler(
    ws: WebSocketUpgrade<ServerMsg, ClientMsg>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| search_socket(socket, state))
}

#[derive(Debug, FromRow, Serialize)]
pub struct Song {
    name: String,
}

async fn search_socket(mut socket: WebSocket<ServerMsg, ClientMsg>, state: AppState) {
    let start = Instant::now();

    tokio::task::spawn(async move {
        while let Some(msg) = socket.recv().await {
            match msg {
                Ok(Message::Item(ClientMsg::Search(term))) => {
                    let result: Vec<Song> = sqlx::query_as(
                        "SELECT name FROM song WHERE name LIKE ? || '%' COLLATE NOCASE",
                    )
                    .bind(term)
                    .fetch_all(&state.pool)
                    .await
                    .unwrap();

                    socket
                        .send(Message::Item(ServerMsg::SearchResults(result)))
                        .await
                        .unwrap();

                    println!("ping: {:?}", start.elapsed());
                }
                Ok(_) => {}
                Err(err) => {
                    eprintln!("got error: {}", err);
                }
            }
        }
    });
}

#[derive(Debug, Serialize)]
pub enum ServerMsg {
    SearchResults(Vec<Song>),
}

#[derive(Debug, Deserialize)]
pub enum ClientMsg {
    Search(String),
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let pool = SqlitePool::connect_with(
        SqliteConnectOptions::new()
            .filename("db.sqlite")
            .create_if_missing(true),
    )
    .await
    .unwrap();

    println!("Running migrations");
    MIGRATOR.run(&pool).await.unwrap();

    let router = Router::new()
        .route("/search", get(ws_handler))
        .with_state(AppState { pool });

    let listener = TcpListener::bind("0.0.0.0:8080").await?;

    println!("Listening on http://0.0.0.0:8080");
    axum::serve(listener, router).await
}
