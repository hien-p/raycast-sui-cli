pub fn sanitize_output(text: &str) -> String {
    let mut result = text.to_string();

    // Remove private keys
    result = regex::Regex::new(r"suiprivkey[a-zA-Z0-9]+")
        .unwrap()
        .replace_all(&result, "****")
        .to_string();

    // Mask addresses (keep first and last 4 chars)
    result = regex::Regex::new(r"0x[a-fA-F0-9]{64}")
        .unwrap()
        .replace_all(&result, |caps: &regex::Captures| {
            let addr = &caps[0];
            format!("0x{}...{}", &addr[2..6], &addr[addr.len()-4..])
        })
        .to_string();

    // Remove mnemonics
    result = regex::Regex::new(r"\b([a-z]+\s+){11,23}[a-z]+\b")
        .unwrap()
        .replace_all(&result, "[MNEMONIC]")
        .to_string();

    result
}

pub fn mask_address(addr: &str) -> String {
    if addr.len() < 10 {
        return addr.to_string();
    }
    format!("0x{}...{}", &addr[2..6], &addr[addr.len()-4..])
}
