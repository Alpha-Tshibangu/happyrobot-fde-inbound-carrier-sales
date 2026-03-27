from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models.load import Load
from app.schemas.load import Load as LoadSchema
from app.api.auth import verify_api_key

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

    loads = query.all()
    return loads


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
