use tauri::command;
use std::process::Command as StdCommand;
use std::time::Instant;
use crate::{CommandOutput, AppState};
use tauri::State as TauriState;

#[command]
pub async fn execute_sui_command(
    args: Vec<String>,
    state: TauriState<'_, AppState>,
) -> Result<CommandOutput, String> {
    let start = Instant::now();

    let output = StdCommand::new("sui")
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute: {}", e))?;

    let duration_ms = start.elapsed().as_millis() as u64;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    // Sanitize sensitive data
    let sanitized_stdout = crate::utils::sanitizer::sanitize_output(&stdout);
    let sanitized_stderr = crate::utils::sanitizer::sanitize_output(&stderr);

    // Update state
    if let Ok(mut cmd) = state.last_command.lock() {
        *cmd = args.join(" ");
    }

    Ok(CommandOutput {
        stdout: sanitized_stdout,
        stderr: sanitized_stderr,
        exit_code: output.status.code().unwrap_or(-1),
        duration_ms,
    })
}

#[command]
pub async fn list_keys(
    _state: TauriState<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    let output = StdCommand::new("sui")
        .args(&["keytool", "list"])
        .output()
        .map_err(|e| format!("Failed to list keys: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    // Parse output and return structured data
    let keys = crate::utils::parser::parse_keys(&stdout)
        .map_err(|e| format!("Parse error: {}", e))?;

    Ok(keys)
}

#[command]
pub async fn generate_key(
    scheme: String,
    word_length: Option<u32>,
) -> Result<CommandOutput, String> {
    let mut cmd = StdCommand::new("sui");
    cmd.arg("keytool").arg("generate").arg(&scheme);
    
    if let Some(length) = word_length {
        cmd.arg("--word-length").arg(length.to_string());
    }

    let output = cmd.output()
        .map_err(|e| format!("Failed to generate key: {}", e))?;

    Ok(CommandOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
        duration_ms: 0,
    })
}

#[command]
pub async fn set_active_key(address: String) -> Result<CommandOutput, String> {
    let output = StdCommand::new("sui")
        .args(&["client", "switch", "--address", &address])
        .output()
        .map_err(|e| format!("Failed to switch key: {}", e))?;

    Ok(CommandOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
        duration_ms: 0,
    })
}

#[command]
pub async fn get_active_address() -> Result<String, String> {
    let output = StdCommand::new("sui")
        .args(&["client", "active-address"])
        .output()
        .map_err(|e| format!("Failed: {}", e))?;

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

#[command]
pub async fn get_environment() -> Result<serde_json::Value, String> {
    let output = StdCommand::new("sui")
        .args(&["client", "envs"])
        .output()
        .map_err(|e| format!("Failed: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    Ok(serde_json::json!({
        "envs": stdout,
    }))
}
