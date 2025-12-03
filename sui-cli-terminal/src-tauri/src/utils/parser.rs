use serde_json::Value;

pub fn parse_keys(output: &str) -> Result<Vec<Value>, String> {
    // Basic parsing logic - assumes output is somewhat structured or we parse line by line
    // For now, implementing a simple parser that tries to extract key info
    // In a real scenario, we might want to parse JSON output if CLI supports --json
    
    // If output is JSON, parse it directly
    if let Ok(json) = serde_json::from_str::<Value>(output) {
        if let Some(arr) = json.as_array() {
            return Ok(arr.clone());
        }
    }

    // Fallback: Parse text output
    // This is a placeholder. Real implementation depends on `sui keytool list` output format.
    let mut keys = Vec::new();
    for line in output.lines() {
        if line.contains("0x") {
            keys.push(serde_json::json!({
                "raw": line
            }));
        }
    }
    
    Ok(keys)
}
