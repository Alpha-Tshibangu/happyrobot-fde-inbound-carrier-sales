from pydantic import BaseModel
from typing import Optional


class CarrierVerification(BaseModel):
    mc_number: str


class CarrierVerificationResponse(BaseModel):
    is_eligible: bool
    mc_number: str
    carrier_name: Optional[str] = None
    status: Optional[str] = None
    safety_rating: Optional[str] = None
    insurance_on_file: Optional[bool] = None
    error: Optional[str] = None
