from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from app.db.database import Base


class Load(Base):
    __tablename__ = "loads"

    load_id = Column(String, primary_key=True, index=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    pickup_datetime = Column(DateTime, nullable=False)
    delivery_datetime = Column(DateTime, nullable=False)
    equipment_type = Column(String, nullable=False)
    loadboard_rate = Column(Float, nullable=False)
    notes = Column(Text)
    weight = Column(Float)
    commodity_type = Column(String)
    num_of_pieces = Column(Integer)
    miles = Column(Float)
    dimensions = Column(String)

    # New fields for load management
    status = Column(String, default="available", index=True)  # available, booked, in_transit, delivered, cancelled
    booked_carrier_mc = Column(String, index=True)
    booked_carrier_name = Column(String)
    booked_rate = Column(Float)
    margin_dollars = Column(Float)  # booked_rate - loadboard_rate
    customer_confirmed = Column(Boolean, default=False)
    urgency_level = Column(String, default="medium")  # low, medium, high
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
