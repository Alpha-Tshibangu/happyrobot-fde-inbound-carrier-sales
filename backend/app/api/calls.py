from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.call import Call
from app.schemas.call import Call as CallSchema, CallCreate
from app.api.auth import verify_api_key

router = APIRouter(tags=["calls"])


@router.post(
    "/calls", response_model=CallSchema, dependencies=[Depends(verify_api_key)]
)
def create_call(call: CallCreate, db: Session = Depends(get_db)):
    """
    Record a new call with carrier interaction details
    """
    db_call = Call(**call.dict())
    db.add(db_call)
    db.commit()
    db.refresh(db_call)
    return db_call


@router.get(
    "/calls", response_model=List[CallSchema], dependencies=[Depends(verify_api_key)]
)
def get_calls(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    """
    Get all recorded calls
    """
    calls = db.query(Call).offset(offset).limit(limit).all()
    return calls


@router.get(
    "/calls/{call_id}",
    response_model=CallSchema,
    dependencies=[Depends(verify_api_key)],
)
def get_call(call_id: int, db: Session = Depends(get_db)):
    """
    Get a specific call by ID
    """
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call
