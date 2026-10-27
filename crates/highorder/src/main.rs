//! HighOrder command line tool.
//!
//! This binary only handles argument parsing and logging. Everything else is
//! implemented in `highorder_core`.

use clap::Parser;
use highorder_core::ServerConfig;
use tracing_subscriber::EnvFilter;

/// HighOrder command line tool.
#[derive(Debug, Clone, Parser)]
#[command(name = "highorder", version, about = "HighOrder command line tool")]
struct Cli {
    /// Host to bind the HTTP server to (IP address or host name).
    #[arg(long, value_name = "HOST", default_value = "127.0.0.1")]
    host: String,

    /// Port to bind the HTTP server to.
    #[arg(short, long, value_name = "PORT", default_value_t = 8080)]
    port: u16,

    /// Log filter, e.g. "info", "debug" or "highorder_core=trace".
    #[arg(long, value_name = "FILTER", default_value = "info")]
    log: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::new(cli.log))
        .init();

    highorder_core::serve(ServerConfig::new(cli.host, cli.port)).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use clap::CommandFactory;

    #[test]
    fn cli_definition_is_valid() {
        Cli::command().debug_assert();
    }

    #[test]
    fn host_and_port_are_parsed_from_flags() {
        let cli = Cli::try_parse_from(["highorder", "--host", "0.0.0.0", "--port", "9000"])
            .expect("args should parse");
        assert_eq!(cli.host, "0.0.0.0");
        assert_eq!(cli.port, 9000);
    }

    #[test]
    fn defaults_are_loopback_8080() {
        let cli = Cli::try_parse_from(["highorder"]).expect("args should parse");
        assert_eq!(cli.host, "127.0.0.1");
        assert_eq!(cli.port, 8080);
        assert_eq!(cli.log, "info");
    }
}
