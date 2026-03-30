from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.db.database import Base


class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    carrier_mc_number = Column(String, index=True)
    carrier_name = Column(String)
    load_id = Column(String)
    outcome = Column(String)  # booked, rejected, failed_negotiation, ineligible
    sentiment = Column(String)  # positive, neutral, negative
    initial_offer = Column(Float)
    final_price = Column(Float)
    negotiation_rounds = Column(Integer, default=0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    duration_seconds = Column(Integer)
