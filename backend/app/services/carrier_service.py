"""Carrier verification service using VerifyCarrier API."""

import httpx
import json
from fastapi import HTTPException

from app.schemas.carrier import CarrierVerificationResponse


async def verify_carrier_service(mc_number: str) -> CarrierVerificationResponse:
    """
    Verify carrier eligibility using VerifyCarrier API.

    Args:
        mc_number: Motor Carrier number to verify

    Returns:
        CarrierVerificationResponse with eligibility details
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"https://verifycarrier.com/api/lookup/mc/{mc_number}",
                headers={"Accept": "application/json"},
            )

            if response.status_code == 404:
                return CarrierVerificationResponse(
                    is_eligible=False, mc_number=mc_number, error="Carrier not found"
                )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code, detail="VerifyCarrier API error"
                )

            data = response.json()

            # Debug logging to see what VerifyCarrier returns
            print(f"DEBUG - VerifyCarrier response for MC {mc_number}: {json.dumps(data, indent=2)}")

            if not data.get("success"):
                print(f"DEBUG - API returned success=False for MC {mc_number}")
                return CarrierVerificationResponse(
                    is_eligible=False,
                    mc_number=mc_number,
                    error="Carrier verification failed",
                )

            carrier_data = data.get("data", {})
            safety_data = carrier_data.get("safety", {})
            authority_data = carrier_data.get("authority", {})
            risk_data = carrier_data.get("risk", {})

            return CarrierVerificationResponse(
                is_eligible=True,  # Let AI decide based on full data
                mc_number=mc_number,
                carrier_name=carrier_data.get("legal_name"),
                status="ACTIVE" if not safety_data.get("out_of_service", False) else "OUT_OF_SERVICE",
                safety_rating=safety_data.get("rating"),
                insurance_on_file=authority_data.get("common") == "A" or authority_data.get("contract") == "A",
                additional_info={
                    "dba_name": carrier_data.get("dba_name"),
                    "dot_number": carrier_data.get("dot_number"),
                    "fleet_size": carrier_data.get("fleet", {}).get("power_units"),
                    "driver_count": carrier_data.get("fleet", {}).get("drivers"),
                    "risk_score": risk_data.get("score"),
                    "risk_tier": risk_data.get("tier"),
                    "risk_description": risk_data.get("description"),
                    "cargo_carried": carrier_data.get("cargo_carried", []),
                    "address": carrier_data.get("address", {}),
                    "out_of_service": safety_data.get("out_of_service", False),
                    "safety_rating_date": safety_data.get("rating_date"),
                    "common_authority": authority_data.get("common"),
                    "contract_authority": authority_data.get("contract"),
                    "broker_authority": authority_data.get("broker"),
                    "phone": carrier_data.get("phone"),
                    "full_verification_data": data  # Include full API response for AI analysis
                },
            )

    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
