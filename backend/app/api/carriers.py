from fastapi import APIRouter, Depends

from app.schemas.carrier import CarrierVerification, CarrierVerificationResponse
from app.services.carrier_service import verify_carrier_service
from app.api.auth import verify_api_key

router = APIRouter(tags=["carriers"])


@router.post(
    "/verify-carrier",
    response_model=CarrierVerificationResponse,
    dependencies=[Depends(verify_api_key)],
)
async def verify_carrier(carrier: CarrierVerification):
    """
    Verify carrier eligibility using FMCSA API
    """
    return await verify_carrier_service(carrier.mc_number)
