"""Dashboard metrics service."""

from sqlalchemy import func

from app.db.database import SessionLocal
from app.models.call import Call
from app.schemas.call import CallStats


def get_dashboard_metrics_service() -> CallStats:
    """
    Calculate and return dashboard metrics for calls.

    Returns:
        CallStats with comprehensive metrics
    """
    db = SessionLocal()
    try:
        # Get total calls
        total_calls = db.query(Call).count()

        # Get calls by outcome
        booked_calls = db.query(Call).filter(Call.outcome == "booked").count()
        rejected_calls = db.query(Call).filter(Call.outcome == "rejected").count()
        failed_negotiations = (
            db.query(Call).filter(Call.outcome == "failed_negotiation").count()
        )
        ineligible_carriers = (
            db.query(Call).filter(Call.outcome == "ineligible").count()
        )

        # Average negotiation rounds (for calls that had negotiations)
        avg_negotiation = (
            db.query(func.avg(Call.negotiation_rounds))
            .filter(Call.negotiation_rounds > 0)
            .scalar()
            or 0
        )

        # Average discount percentage (for booked calls with prices)
        booked_with_prices = (
            db.query(Call)
            .filter(
                Call.outcome == "booked",
                Call.initial_offer.isnot(None),
                Call.final_price.isnot(None),
            )
            .all()
        )

        avg_discount = 0
        if booked_with_prices:
            discounts = [
                (c.initial_offer - c.final_price) / c.initial_offer * 100
                for c in booked_with_prices
                if c.initial_offer > 0
            ]
            avg_discount = sum(discounts) / len(discounts) if discounts else 0

        # Sentiment distribution
        sentiment_dist = {
            "positive": db.query(Call).filter(Call.sentiment == "positive").count(),
            "neutral": db.query(Call).filter(Call.sentiment == "neutral").count(),
            "negative": db.query(Call).filter(Call.sentiment == "negative").count(),
        }

        # Conversion rate
        conversion_rate = (booked_calls / total_calls * 100) if total_calls > 0 else 0

        return CallStats(
            total_calls=total_calls,
            booked_calls=booked_calls,
            rejected_calls=rejected_calls,
            failed_negotiations=failed_negotiations,
            ineligible_carriers=ineligible_carriers,
            average_negotiation_rounds=round(avg_negotiation, 2),
            average_discount_percentage=round(avg_discount, 2),
            sentiment_distribution=sentiment_dist,
            conversion_rate=round(conversion_rate, 2),
        )
    finally:
        db.close()
