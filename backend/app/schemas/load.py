from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LoadBase(BaseModel):
    load_id: str
    origin: str
    destination: str
    pickup_datetime: datetime
    delivery_datetime: datetime
    equipment_type: str
    loadboard_rate: float
    notes: Optional[str] = None
    weight: Optional[float] = None
    commodity_type: Optional[str] = None
    num_of_pieces: Optional[int] = None
    miles: Optional[float] = None
    dimensions: Optional[str] = None


class LoadCreate(LoadBase):
    pass


class Load(LoadBase):
    class Config:
        from_attributes = True


class LoadSearch(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    equipment_type: Optional[str] = None
    pickup_date_from: Optional[datetime] = None
    pickup_date_to: Optional[datetime] = None
