import secrets
import hashlib
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt

SECRET_KEY = "PULSEGATE_SECRET_JWT_KEY_PRODUCTION_SECURE_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

def generate_api_key() -> str:
    """Generates a secure API key with live prefix."""
    token = secrets.token_hex(24)
    return f"pg_live_{token}"

def hash_api_key(key: str) -> str:
    """Hashes an API key using SHA-256."""
    return hashlib.sha256(key.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])