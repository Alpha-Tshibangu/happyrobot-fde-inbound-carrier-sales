"""Carrier verification service using VerifyCarrier API."""

import httpx
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

            if not data.get("success"):
                return CarrierVerificationResponse(
                    is_eligible=False,
                    mc_number=mc_number,
                    error="Carrier verification failed",
                )

            carrier_data = data.get("data", {})
            safety_data = carrier_data.get("safety", {})
            authority_data = carrier_data.get("authority", {})
            risk_data = carrier_data.get("risk", {})

            # Check eligibility criteria
            out_of_service = safety_data.get("out_of_service", True)
            safety_rating = safety_data.get(
                "rating", "U"
            )  # S=Satisfactory, U=Unsatisfactory
            has_authority = (
                authority_data.get("common") == "A"
                or authority_data.get("contract") == "A"
            )
            risk_tier = risk_data.get("tier", "High")

            # Determine eligibility based on comprehensive criteria
            is_eligible = (
                not out_of_service
                and safety_rating == "S"  # Satisfactory rating
                and has_authority
                and risk_tier in ["Low", "Moderate"]  # Exclude High risk carriers
            )

            return CarrierVerificationResponse(
                is_eligible=is_eligible,
                mc_number=mc_number,
                carrier_name=carrier_data.get("legal_name"),
                status="ACTIVE" if not out_of_service else "OUT_OF_SERVICE",
                safety_rating=safety_rating,
                insurance_on_file=has_authority,  # Authority implies insurance
                additional_info={
                    "dba_name": carrier_data.get("dba_name"),
                    "dot_number": carrier_data.get("dot_number"),
                    "fleet_size": carrier_data.get("fleet", {}).get("power_units"),
                    "driver_count": carrier_data.get("fleet", {}).get("drivers"),
                    "risk_score": risk_data.get("score"),
                    "risk_tier": risk_tier,
                    "risk_description": risk_data.get("description"),
                    "cargo_carried": carrier_data.get("cargo_carried", []),
                    "address": carrier_data.get("address", {}),
                },
            )

    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
