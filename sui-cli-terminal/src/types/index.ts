export interface CommandOutput {
    stdout: String;
    stderr: String;
    exit_code: number;
    duration_ms: number;
}

export interface CliError {
    command: String;
    exit_code: number;
    message: String;
}
