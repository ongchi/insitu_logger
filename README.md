# insitu_logger

A compact, single-binary web application for visualizing sensor data and field note taking.
Built using [Svelte 5](https://svelte.dev/) and [Plotly.js](https://plotly.com/javascript/),
the project is based on the [pocketstack](https://github.com/knarkzel/pocketstack) template and is powered by a Rust backend.

# Features

- 📦 Self-contained binary (no external server or setup required)
- 📈 Interactive visualizations with Plotly.js
- ⚡ Fast and reactive frontend using Svelte 5
- 🦀 Rust backend for performance and reliability

# Build Instructions

## Requirements

- [Node.js](https://nodejs.org/) & [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install)
- [SQLx CLI](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli)

## Clone the Repository

```shell
git clone https://github.com/ongchi/insitu_logger
cd insitu_logger
```

## Build the Frontend

```shell
cd web
pnpm install
pnpm run build
```

## Create Database

```shell
cd ..
sqlx database create
sqlx migrate run
cat fixtures/sample.sql | sqlite3 water_sampling.db
```

## Build and Run the Backend

```shell
cargo run --release
```
