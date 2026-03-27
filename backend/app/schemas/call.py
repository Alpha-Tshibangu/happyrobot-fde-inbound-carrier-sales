from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class CallBase(BaseModel):
    carrier_mc_number: str
    carrier_name: Optional[str] = None
    load_id: Optional[str] = None
    outcome: str  # booked, rejected, failed_negotiation, ineligible
    sentiment: str  # positive, neutral, negative
    initial_offer: Optional[float] = None
    final_price: Optional[float] = None
    negotiation_rounds: int = 0
    extracted_data: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    duration_seconds: Optional[int] = None


class CallCreate(CallBase):
    pass


class Call(CallBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CallStats(BaseModel):
    total_calls: int
    booked_calls: int
    rejected_calls: int
    failed_negotiations: int
    ineligible_carriers: int
    average_negotiation_rounds: float
    average_discount_percentage: float
    sentiment_distribution: Dict[str, int]
    conversion_rate: float
