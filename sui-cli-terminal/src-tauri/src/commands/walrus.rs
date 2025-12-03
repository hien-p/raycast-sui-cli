use tauri::command;
use std::process::Command as StdCommand;
use crate::CommandOutput;

#[command]
pub async fn upload_blob(
    path: String,
    epochs: Option<u32>,
) -> Result<CommandOutput, String> {
    let mut cmd = StdCommand::new("walrus");
    cmd.arg("store").arg(&path);
    
    if let Some(e) = epochs {
        cmd.arg("--epochs").arg(e.to_string());
    }

    let output = cmd.output()
        .map_err(|e| format!("Failed to upload blob: {}", e))?;

    Ok(CommandOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
        duration_ms: 0,
    })
}

#[command]
pub async fn download_blob(
    blob_id: String,
    output_path: Option<String>,
) -> Result<CommandOutput, String> {
    let mut cmd = StdCommand::new("walrus");
    cmd.arg("read").arg(&blob_id);
    
    if let Some(path) = output_path {
        cmd.arg("--out").arg(path);
    }

    let output = cmd.output()
        .map_err(|e| format!("Failed to download blob: {}", e))?;

    Ok(CommandOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
        duration_ms: 0,
    })
}

#[command]
pub async fn list_blobs() -> Result<CommandOutput, String> {
    let output = StdCommand::new("walrus")
        .arg("list")
        .output()
        .map_err(|e| format!("Failed to list blobs: {}", e))?;

    Ok(CommandOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
        duration_ms: 0,
    })
}
