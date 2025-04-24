# insitu_logger

A compact, single-binary web application for visualizing sensor data and field note taking.
Built using [Svelte 5](https://svelte.dev/) and [BokehJS](https://bokeh.org/),
the project is based on the [pocketstack](https://github.com/knarkzel/pocketstack) template and is powered by a Rust backend.

# Features

- 📦 Self-contained binary (no external server or setup required)
- 📈 Interactive visualizations with BokehJS
- ⚡ Fast and reactive frontend using Svelte 5
- 🦀 Rust backend for performance and reliability

# Build Instructions

## Clone the Repository

```shell
git clone https://github.com/ongchi/insitu_logger
cd insitu_logger
```

## Build BokehJS

```shell
git submodule update --recursive
cd web/bokeh/bokehjs/
node make build
```

## Build the Frontend

```shell
cd ../../
pnpm run build
```

## Build and Run the Backend

```shell
cd ../
cargo run --release
```
