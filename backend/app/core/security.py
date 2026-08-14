import hashlib
import secrets

def generate_raw_api_key() -> str:
    """
    Generates a cryptographically secure random 32-character string.
    Format: pg_live_<32_hex_chars>
    """
    # secrets module uses system entropy (CSPRNG)
    random_hex = secrets.token_hex(16) 
    return f"pg_live_{random_hex}"

def hash_api_key(raw_key: str) -> str:
    """
    Computes SHA-256 hash of a raw API key.
    Outputs a deterministic 64-character hexadecimal string.
    """
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()