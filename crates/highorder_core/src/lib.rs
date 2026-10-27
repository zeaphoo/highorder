//! HighOrder core runtime.
//!
//! All real functionality lives here: the application router and the HTTP
//! server. Command line front-ends (see the `highorder` crate) are thin
//! wrappers around this crate.

pub mod config;
pub mod router;
pub mod server;

pub use config::ServerConfig;
pub use router::router;
pub use server::{serve, shutdown_signal};
