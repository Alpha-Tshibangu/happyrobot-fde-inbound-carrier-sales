from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models.load import Load
from app.schemas.load import Load as LoadSchema, LoadStatusUpdate, LoadMetrics
from app.api.auth import verify_api_key
from app.services.load_management_service import LoadManagementService

router = APIRouter(tags=["loads"])


@router.get(
    "/loads", response_model=List[LoadSchema], dependencies=[Depends(verify_api_key)]
)
def get_loads(
    origin: Optional[str] = Query(None, description="Filter by origin"),
    destination: Optional[str] = Query(None, description="Filter by destination"),
    equipment_type: Optional[str] = Query(None, description="Filter by equipment type"),
    pickup_date_from: Optional[datetime] = Query(
        None, description="Filter by pickup date from"
    ),
    pickup_date_to: Optional[datetime] = Query(
        None, description="Filter by pickup date to"
    ),
    status: Optional[str] = Query(None, description="Filter by status"),
    urgency_level: Optional[str] = Query(None, description="Filter by urgency level"),
    db: Session = Depends(get_db),
):
    query = db.query(Load)

    if origin:
        query = query.filter(Load.origin.ilike(f"%{origin}%"))
    if destination:
        query = query.filter(Load.destination.ilike(f"%{destination}%"))
    if equipment_type:
        query = query.filter(Load.equipment_type == equipment_type)
    if pickup_date_from:
        query = query.filter(Load.pickup_datetime >= pickup_date_from)
    if pickup_date_to:
        query = query.filter(Load.pickup_datetime <= pickup_date_to)
    if status:
        query = query.filter(Load.status == status)
    if urgency_level:
        query = query.filter(Load.urgency_level == urgency_level)

    loads = query.all()
    return loads


@router.get(
    "/loads/available",
    response_model=List[LoadSchema],
    dependencies=[Depends(verify_api_key)]
)
def get_available_loads(
    limit: int = Query(100, description="Maximum number of loads to return"),
    db: Session = Depends(get_db)
):
    """Get loads that need coverage, prioritized by urgency."""
    return LoadManagementService.get_available_loads(db, limit)


@router.get(
    "/loads/booked",
    response_model=List[LoadSchema],
    dependencies=[Depends(verify_api_key)]
)
def get_booked_loads(
    limit: int = Query(100, description="Maximum number of loads to return"),
    db: Session = Depends(get_db)
):
    """Get loads with assigned carriers."""
    return LoadManagementService.get_booked_loads(db, limit)


@router.get(
    "/loads/metrics",
    response_model=LoadMetrics,
    dependencies=[Depends(verify_api_key)]
)
def get_load_metrics():
    """Get load management metrics."""
    return LoadManagementService.get_load_metrics()


@router.get(
    "/loads/{load_id}",
    response_model=LoadSchema,
    dependencies=[Depends(verify_api_key)],
)
def get_load(load_id: str, db: Session = Depends(get_db)):
    load = db.query(Load).filter(Load.load_id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    return load


@router.put(
    "/loads/{load_id}/status",
    response_model=LoadSchema,
    dependencies=[Depends(verify_api_key)]
)
def update_load_status(
    load_id: str,
    status_update: LoadStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update load status and related fields."""
    load = LoadManagementService.update_load_status(db, load_id, status_update)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    return load


@router.get(
    "/loads/{load_id}/calls",
    dependencies=[Depends(verify_api_key)]
)
def get_load_call_history(load_id: str, db: Session = Depends(get_db)):
    """Get call history for a specific load."""
    # Verify load exists
    load = db.query(Load).filter(Load.load_id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    calls = LoadManagementService.get_load_call_history(db, load_id)
    return [
        {
            "id": call.id,
            "carrier_mc_number": call.carrier_mc_number,
            "carrier_name": call.carrier_name,
            "outcome": call.outcome,
            "sentiment": call.sentiment,
            "initial_offer": call.initial_offer,
            "final_price": call.final_price,
            "negotiation_rounds": call.negotiation_rounds,
            "duration_seconds": call.duration_seconds,
            "created_at": call.created_at.isoformat() if call.created_at else None,
            "notes": call.notes
        }
        for call in calls
    ]


@router.post(
    "/loads/{load_id}/book",
    response_model=LoadSchema,
    dependencies=[Depends(verify_api_key)]
)
def book_load_manually(
    load_id: str,
    carrier_mc: str,
    carrier_name: str,
    booked_rate: float,
    db: Session = Depends(get_db)
):
    """Manually book a load to a carrier."""
    load = LoadManagementService.book_load_from_call(
        db, load_id, carrier_mc, carrier_name, booked_rate
    )
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    return load
