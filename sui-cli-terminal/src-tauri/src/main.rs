// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod utils;

use tauri::{
    Manager,
};
use std::sync::Mutex;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct CommandOutput {
    stdout: String,
    stderr: String,
    exit_code: i32,
    duration_ms: u64,
}

#[derive(Serialize, Deserialize)]
pub struct CliError {
    command: String,
    exit_code: i32,
    message: String,
}

pub struct AppState {
    last_command: Mutex<String>,
    session_cache: Mutex<std::collections::HashMap<String, CommandOutput>>,
}

use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

fn main() {
    let app_state = AppState {
        last_command: Mutex::new(String::new()),
        session_cache: Mutex::new(std::collections::HashMap::new()),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // CLI commands
            commands::cli::execute_sui_command,
            commands::cli::list_keys,
            commands::cli::generate_key,
            commands::cli::set_active_key,
            
            // Walrus commands
            commands::walrus::upload_blob,
            commands::walrus::download_blob,
            commands::walrus::list_blobs,
            
            // System commands
            commands::cli::get_active_address,
            commands::cli::get_environment,
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                let window = app.get_webview_window("main").unwrap();
                apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                    .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // Save state before closing
                    // api.prevent_close(); // Uncomment if needed
                    // Cleanup
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
