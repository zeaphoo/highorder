//! Server configuration.

use std::net::SocketAddr;

/// Where the HTTP server should listen.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_owned(),
            port: 8080,
        }
    }
}

impl ServerConfig {
    pub fn new(host: impl Into<String>, port: u16) -> Self {
        Self {
            host: host.into(),
            port,
        }
    }

    /// Resolves the configuration into a socket address.
    ///
    /// Accepts either a plain IP (`127.0.0.1`) or a host name (`localhost`).
    pub fn socket_addr(&self) -> anyhow::Result<SocketAddr> {
        let host = self.host.trim();
        if host.is_empty() {
            anyhow::bail!("host must not be empty");
        }

        let candidate = format!("{host}:{}", self.port);
        candidate.parse().or_else(|parse_err| {
            // Fall back to DNS resolution for host names such as `localhost`.
            use std::net::ToSocketAddrs;
            candidate
                .to_socket_addrs()
                .map_err(|dns_err| {
                    anyhow::anyhow!("invalid listen address {candidate}: {parse_err} ({dns_err})")
                })?
                .next()
                .ok_or_else(|| anyhow::anyhow!("{candidate} did not resolve to any address"))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_is_loopback_8080() {
        let addr = ServerConfig::default().socket_addr().unwrap();
        assert_eq!(addr.to_string(), "127.0.0.1:8080");
    }

    #[test]
    fn accepts_host_names() {
        let addr = ServerConfig::new("localhost", 9000).socket_addr().unwrap();
        assert_eq!(addr.port(), 9000);
    }

    #[test]
    fn rejects_empty_host() {
        assert!(ServerConfig::new("  ", 8080).socket_addr().is_err());
    }

    #[test]
    fn rejects_garbage_host() {
        assert!(ServerConfig::new("not a host", 8080).socket_addr().is_err());
    }
}
