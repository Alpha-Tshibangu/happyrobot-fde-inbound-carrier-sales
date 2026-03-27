from sqlalchemy import Column, Integer, String, Float, DateTime, Text
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
