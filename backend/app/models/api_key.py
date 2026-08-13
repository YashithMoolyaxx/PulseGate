import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class APIKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # CRITICAL: Indexed SHA-256 Hash for O(log N) lookups
    hashed_key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    
    rate_limit_rpm: Mapped[int] = mapped_column(Integer, default=60) # Allowed Requests Per Minute
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # ORM Relationship to logs
    logs: Mapped[list["GatewayLog"]] = relationship("GatewayLog", back_populates="api_key_obj")