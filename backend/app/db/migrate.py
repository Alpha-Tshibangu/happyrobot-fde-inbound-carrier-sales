from sqlalchemy import inspect, text
from app.db.database import engine, Base
from app.models import load, call
import logging

logger = logging.getLogger(__name__)


def migrate_database():
    """
    Handle database schema migrations.
    This function checks for missing columns and adds them if needed.
    """
    inspector = inspect(engine)

    # Create all tables that don't exist
    Base.metadata.create_all(bind=engine)

    # Check and add missing columns for loads table
    if inspector.has_table("loads"):
        columns = {col['name'] for col in inspector.get_columns("loads")}

        # Add status column if missing
        if 'status' not in columns:
            logger.info("Adding 'status' column to loads table")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE loads ADD COLUMN status VARCHAR DEFAULT 'available'"))
                conn.commit()

        # Add booked_by_carrier_id if missing
        if 'booked_by_carrier_id' not in columns:
            logger.info("Adding 'booked_by_carrier_id' column to loads table")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE loads ADD COLUMN booked_by_carrier_id INTEGER"))
                conn.commit()

        # Add booked_at if missing
        if 'booked_at' not in columns:
            logger.info("Adding 'booked_at' column to loads table")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE loads ADD COLUMN booked_at DATETIME"))
                conn.commit()

    # Check and add missing columns for calls table
    if inspector.has_table("calls"):
        columns = {col['name'] for col in inspector.get_columns("calls")}

        # Add happyrobot_session_id if missing
        if 'happyrobot_session_id' not in columns:
            logger.info("Adding 'happyrobot_session_id' column to calls table")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE calls ADD COLUMN happyrobot_session_id VARCHAR"))
                conn.commit()

        # Add load_id if missing
        if 'load_id' not in columns:
            logger.info("Adding 'load_id' column to calls table")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE calls ADD COLUMN load_id INTEGER"))
                conn.commit()

    logger.info("Database migration completed")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_database()