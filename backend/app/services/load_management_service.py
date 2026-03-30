"""Load management service for handling load operations and business logic."""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import and_, case
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.load import Load
from app.models.call import Call
from app.schemas.load import LoadMetrics, LoadStatusUpdate


class LoadManagementService:
    """Service for managing load operations and status updates."""

    @staticmethod
    def calculate_urgency_level(pickup_datetime: datetime) -> str:
        """Calculate urgency level based on pickup time."""
        now = datetime.now()
        time_diff = pickup_datetime - now
        hours_until_pickup = time_diff.total_seconds() / 3600

        if hours_until_pickup < 24:
            return "high"
        elif hours_until_pickup < 72:
            return "medium"
        else:
            return "low"

    @staticmethod
    def calculate_margin(booked_rate: float, loadboard_rate: float) -> float:
        """Calculate margin dollars: revenue (loadboard_rate) - cost (booked_rate)."""
        return loadboard_rate - booked_rate

    @staticmethod
    def get_load_metrics() -> LoadMetrics:
        """Get comprehensive load metrics for dashboard."""
        db = SessionLocal()
        try:
            total_loads = db.query(Load).count()
            available_loads = db.query(Load).filter(Load.status == "available").count()
            booked_loads = db.query(Load).filter(Load.status == "booked").count()
            in_transit_loads = db.query(Load).filter(Load.status == "in_transit").count()
            delivered_loads = db.query(Load).filter(Load.status == "delivered").count()
            cancelled_loads = db.query(Load).filter(Load.status == "cancelled").count()
            urgent_loads = db.query(Load).filter(
                and_(Load.status == "available", Load.urgency_level == "high")
            ).count()

            # Calculate coverage rate (booked + in_transit + delivered vs total)
            covered_loads = booked_loads + in_transit_loads + delivered_loads
            coverage_rate = (covered_loads / total_loads * 100) if total_loads > 0 else 0

            # Calculate average margin for booked loads
            booked_loads_with_margin = db.query(Load).filter(
                and_(Load.status.in_(["booked", "in_transit", "delivered"]),
                     Load.margin_dollars.isnot(None))
            ).all()

            total_margin = sum(load.margin_dollars for load in booked_loads_with_margin if load.margin_dollars)
            average_margin = (total_margin / len(booked_loads_with_margin)) if booked_loads_with_margin else 0

            return LoadMetrics(
                total_loads=total_loads,
                available_loads=available_loads,
                booked_loads=booked_loads,
                in_transit_loads=in_transit_loads,
                delivered_loads=delivered_loads,
                cancelled_loads=cancelled_loads,
                coverage_rate=round(coverage_rate, 2),
                average_margin=round(average_margin, 2),
                total_margin=round(total_margin, 2),
                urgent_loads=urgent_loads
            )
        finally:
            db.close()

    @staticmethod
    def get_available_loads(db: Session, limit: int = None) -> List[Load]:
        """Get loads that need coverage, prioritized by urgency."""
        query = db.query(Load)\
            .filter(Load.status == "available")\
            .order_by(
                case(
                    (Load.urgency_level == "high", 1),
                    (Load.urgency_level == "medium", 2),
                    else_=3
                ),
                Load.pickup_datetime
            )
        if limit:
            query = query.limit(limit)
        return query.all()

    @staticmethod
    def get_booked_loads(db: Session, limit: int = None) -> List[Load]:
        """Get loads with assigned carriers."""
        query = db.query(Load)\
            .filter(Load.status.in_(["booked", "in_transit"]))\
            .order_by(Load.pickup_datetime)
        if limit:
            query = query.limit(limit)
        return query.all()

    @staticmethod
    def update_load_status(
        db: Session,
        load_id: str,
        status_update: LoadStatusUpdate
    ) -> Optional[Load]:
        """Update load status and related fields."""
        load = db.query(Load).filter(Load.load_id == load_id).first()
        if not load:
            return None

        # Update status
        load.status = status_update.status
        load.updated_at = datetime.now()

        # Update carrier information if provided
        if status_update.booked_carrier_mc:
            load.booked_carrier_mc = status_update.booked_carrier_mc
        if status_update.booked_carrier_name:
            load.booked_carrier_name = status_update.booked_carrier_name

        # Update rate and calculate margin
        if status_update.booked_rate:
            load.booked_rate = status_update.booked_rate
            load.margin_dollars = LoadManagementService.calculate_margin(
                status_update.booked_rate, load.loadboard_rate
            )

        # Update other fields
        if status_update.customer_confirmed is not None:
            load.customer_confirmed = status_update.customer_confirmed
        if status_update.urgency_level:
            load.urgency_level = status_update.urgency_level

        db.commit()
        db.refresh(load)
        return load

    @staticmethod
    def book_load_from_call(
        db: Session,
        load_id: str,
        carrier_mc: str,
        carrier_name: str,
        final_price: float
    ) -> Optional[Load]:
        """Book a load based on successful call outcome."""
        load = db.query(Load).filter(Load.load_id == load_id).first()
        if not load:
            return None

        load.status = "booked"
        load.booked_carrier_mc = carrier_mc
        load.booked_carrier_name = carrier_name
        load.booked_rate = final_price
        load.margin_dollars = LoadManagementService.calculate_margin(final_price, load.loadboard_rate)
        load.updated_at = datetime.now()

        db.commit()
        db.refresh(load)
        return load

    @staticmethod
    def update_urgency_levels(db: Session) -> int:
        """Update urgency levels for all available loads based on pickup time."""
        loads = db.query(Load).filter(Load.status == "available").all()
        updated_count = 0

        for load in loads:
            new_urgency = LoadManagementService.calculate_urgency_level(load.pickup_datetime)
            if load.urgency_level != new_urgency:
                load.urgency_level = new_urgency
                updated_count += 1

        db.commit()
        return updated_count

    @staticmethod
    def get_load_call_history(db: Session, load_id: str) -> List[Call]:
        """Get call history for a specific load."""
        return db.query(Call)\
            .filter(Call.load_id == load_id)\
            .order_by(Call.created_at.desc())\
            .all()

    @staticmethod
    def get_loads_by_status(db: Session, status: str, limit: int = None) -> List[Load]:
        """Get loads filtered by status."""
        query = db.query(Load)\
            .filter(Load.status == status)\
            .order_by(Load.pickup_datetime)
        if limit:
            query = query.limit(limit)
        return query.all()