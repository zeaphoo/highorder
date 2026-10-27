//! HTTP server lifecycle.

use crate::config::ServerConfig;

/// Runs the HighOrder HTTP server until a shutdown signal is received.
pub async fn serve(config: ServerConfig) -> anyhow::Result<()> {
    let addr = config.socket_addr()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;

    tracing::info!("highorder listening on http://{}", listener.local_addr()?);

    axum::serve(listener, crate::router())
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    tracing::info!("highorder stopped");
    Ok(())
}

/// Resolves once the process should shut down (Ctrl-C).
pub async fn shutdown_signal() {
    if let Err(err) = tokio::signal::ctrl_c().await {
        tracing::error!("failed to listen for shutdown signal: {err}");
    }
    tracing::info!("shutdown signal received");
}

