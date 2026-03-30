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
    status: Optional[str] = "available"
    booked_carrier_mc: Optional[str] = None
    booked_carrier_name: Optional[str] = None
    booked_rate: Optional[float] = None
    margin_dollars: Optional[float] = None
    customer_confirmed: Optional[bool] = False
    urgency_level: Optional[str] = "medium"


class Load(LoadBase):
    status: str = "available"
    booked_carrier_mc: Optional[str] = None
    booked_carrier_name: Optional[str] = None
    booked_rate: Optional[float] = None
    margin_dollars: Optional[float] = None
    customer_confirmed: bool = False
    urgency_level: str = "medium"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LoadSearch(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    equipment_type: Optional[str] = None
    pickup_date_from: Optional[datetime] = None
    pickup_date_to: Optional[datetime] = None
    status: Optional[str] = None
    urgency_level: Optional[str] = None


class LoadStatusUpdate(BaseModel):
    status: str
    booked_carrier_mc: Optional[str] = None
    booked_carrier_name: Optional[str] = None
    booked_rate: Optional[float] = None
    customer_confirmed: Optional[bool] = None
    urgency_level: Optional[str] = None


class LoadMetrics(BaseModel):
    total_loads: int
    available_loads: int
    booked_loads: int
    in_transit_loads: int
    delivered_loads: int
    cancelled_loads: int
    coverage_rate: float
    average_margin: float
    total_margin: float
    urgent_loads: int
