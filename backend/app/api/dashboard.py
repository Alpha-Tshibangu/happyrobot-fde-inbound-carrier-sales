from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.db.database import get_db
from app.models.call import Call
from app.schemas.call import CallStats
from app.services.dashboard_service import get_dashboard_metrics_service
from app.api.auth import verify_api_key

router = APIRouter(tags=["dashboard"])


@router.get(
    "/dashboard", response_model=CallStats, dependencies=[Depends(verify_api_key)]
)
def get_dashboard_metrics():
    """
    Get dashboard metrics for calls
    """
    return get_dashboard_metrics_service()


@router.get("/dashboard/summary", dependencies=[Depends(verify_api_key)])
def get_dashboard_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get a more detailed dashboard summary including recent calls
    """
    metrics = get_dashboard_metrics_service()

    # Get recent calls
    recent_calls = db.query(Call).order_by(Call.created_at.desc()).all()

    # Get top carriers by volume
    top_carriers = (
        db.query(Call.carrier_name, func.count(Call.id).label("call_count"))
        .group_by(Call.carrier_name)
        .order_by(func.count(Call.id).desc())
        .all()
    )

    return {
        "metrics": metrics.dict(),
        "recent_calls": [
            {
                "id": c.id,
                "carrier_name": c.carrier_name,
                "carrier_mc_number": c.carrier_mc_number,
                "load_id": c.load_id,
                "outcome": c.outcome,
                "sentiment": c.sentiment,
                "duration_seconds": c.duration_seconds,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in recent_calls
        ],
        "top_carriers": [
            {"name": name, "call_count": count} for name, count in top_carriers
        ],
    }
