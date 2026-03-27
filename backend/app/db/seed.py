from datetime import datetime, timedelta
import random
from app.db.database import SessionLocal
from app.models.load import Load
from app.models.call import Call


def seed_database():
    db = SessionLocal()

    # Check if call data already exists (loads might exist but we need calls for the dashboard)
    if db.query(Call).first():
        print("Call data already seeded. Skipping...")
        db.close()
        return

    # Check if loads exist, if not create them
    load_exists = db.query(Load).first() is not None

    # Seed data for loads
    loads_data = [
        {
            "load_id": "LD001",
            "origin": "Los Angeles, CA",
            "destination": "Phoenix, AZ",
            "pickup_datetime": datetime.now() + timedelta(days=2),
            "delivery_datetime": datetime.now() + timedelta(days=3),
            "equipment_type": "Dry Van",
            "loadboard_rate": 2500.00,
            "weight": 35000,
            "commodity_type": "Electronics",
            "miles": 372,
            "notes": "Fragile cargo, handle with care",
        },
        {
            "load_id": "LD002",
            "origin": "Houston, TX",
            "destination": "Atlanta, GA",
            "pickup_datetime": datetime.now() + timedelta(days=1),
            "delivery_datetime": datetime.now() + timedelta(days=2, hours=12),
            "equipment_type": "Reefer",
            "loadboard_rate": 3200.00,
            "weight": 40000,
            "commodity_type": "Frozen Food",
            "miles": 793,
            "notes": "Temperature: -10°F",
        },
        {
            "load_id": "LD003",
            "origin": "Chicago, IL",
            "destination": "Detroit, MI",
            "pickup_datetime": datetime.now() + timedelta(days=3),
            "delivery_datetime": datetime.now() + timedelta(days=3, hours=8),
            "equipment_type": "Flatbed",
            "loadboard_rate": 1800.00,
            "weight": 45000,
            "commodity_type": "Steel Coils",
            "miles": 283,
            "notes": "Tarps required",
        },
        {
            "load_id": "LD004",
            "origin": "Seattle, WA",
            "destination": "Portland, OR",
            "pickup_datetime": datetime.now() + timedelta(hours=12),
            "delivery_datetime": datetime.now() + timedelta(days=1),
            "equipment_type": "Dry Van",
            "loadboard_rate": 850.00,
            "weight": 28000,
            "commodity_type": "Paper Products",
            "miles": 173,
            "notes": "Standard delivery",
        },
        {
            "load_id": "LD005",
            "origin": "Miami, FL",
            "destination": "Orlando, FL",
            "pickup_datetime": datetime.now() + timedelta(days=1, hours=6),
            "delivery_datetime": datetime.now() + timedelta(days=1, hours=12),
            "equipment_type": "Dry Van",
            "loadboard_rate": 950.00,
            "weight": 32000,
            "commodity_type": "Consumer Goods",
            "miles": 235,
            "notes": "Multiple stops",
        },
        {
            "load_id": "LD006",
            "origin": "Dallas, TX",
            "destination": "San Antonio, TX",
            "pickup_datetime": datetime.now() + timedelta(days=2),
            "delivery_datetime": datetime.now() + timedelta(days=2, hours=6),
            "equipment_type": "Flatbed",
            "loadboard_rate": 1100.00,
            "weight": 38000,
            "commodity_type": "Construction Materials",
            "miles": 274,
            "notes": "Forklift available at delivery",
        },
        {
            "load_id": "LD007",
            "origin": "Denver, CO",
            "destination": "Salt Lake City, UT",
            "pickup_datetime": datetime.now() + timedelta(days=4),
            "delivery_datetime": datetime.now() + timedelta(days=5),
            "equipment_type": "Reefer",
            "loadboard_rate": 2100.00,
            "weight": 36000,
            "commodity_type": "Produce",
            "miles": 521,
            "notes": "Temperature: 35°F",
        },
        {
            "load_id": "LD008",
            "origin": "New York, NY",
            "destination": "Boston, MA",
            "pickup_datetime": datetime.now() + timedelta(days=1),
            "delivery_datetime": datetime.now() + timedelta(days=1, hours=8),
            "equipment_type": "Dry Van",
            "loadboard_rate": 1400.00,
            "weight": 30000,
            "commodity_type": "Textiles",
            "miles": 216,
            "notes": "Dock appointment required",
        },
        {
            "load_id": "LD009",
            "origin": "Nashville, TN",
            "destination": "Memphis, TN",
            "pickup_datetime": datetime.now() + timedelta(days=2, hours=12),
            "delivery_datetime": datetime.now() + timedelta(days=3),
            "equipment_type": "Dry Van",
            "loadboard_rate": 900.00,
            "weight": 33000,
            "commodity_type": "Auto Parts",
            "miles": 212,
            "notes": "Lumper service needed",
        },
        {
            "load_id": "LD010",
            "origin": "Kansas City, MO",
            "destination": "St. Louis, MO",
            "pickup_datetime": datetime.now() + timedelta(days=3),
            "delivery_datetime": datetime.now() + timedelta(days=3, hours=8),
            "equipment_type": "Flatbed",
            "loadboard_rate": 1050.00,
            "weight": 42000,
            "commodity_type": "Machinery",
            "miles": 248,
            "notes": "Chains and binders required",
        },
        {
            "load_id": "LD011",
            "origin": "San Francisco, CA",
            "destination": "Sacramento, CA",
            "pickup_datetime": datetime.now() + timedelta(hours=18),
            "delivery_datetime": datetime.now() + timedelta(days=1, hours=2),
            "equipment_type": "Dry Van",
            "loadboard_rate": 650.00,
            "weight": 25000,
            "commodity_type": "Wine",
            "miles": 88,
            "notes": "Handle with care",
        },
        {
            "load_id": "LD012",
            "origin": "Minneapolis, MN",
            "destination": "Milwaukee, WI",
            "pickup_datetime": datetime.now() + timedelta(days=4),
            "delivery_datetime": datetime.now() + timedelta(days=4, hours=10),
            "equipment_type": "Reefer",
            "loadboard_rate": 1600.00,
            "weight": 37000,
            "commodity_type": "Dairy Products",
            "miles": 337,
            "notes": "Temperature: 38°F",
        },
        {
            "load_id": "LD013",
            "origin": "Phoenix, AZ",
            "destination": "Las Vegas, NV",
            "pickup_datetime": datetime.now() + timedelta(days=1, hours=12),
            "delivery_datetime": datetime.now() + timedelta(days=2),
            "equipment_type": "Dry Van",
            "loadboard_rate": 1200.00,
            "weight": 31000,
            "commodity_type": "Furniture",
            "miles": 297,
            "notes": "Residential delivery",
        },
        {
            "load_id": "LD014",
            "origin": "Charlotte, NC",
            "destination": "Raleigh, NC",
            "pickup_datetime": datetime.now() + timedelta(days=2, hours=6),
            "delivery_datetime": datetime.now() + timedelta(days=2, hours=12),
            "equipment_type": "Flatbed",
            "loadboard_rate": 750.00,
            "weight": 39000,
            "commodity_type": "Lumber",
            "miles": 165,
            "notes": "Straps required",
        },
        {
            "load_id": "LD015",
            "origin": "Indianapolis, IN",
            "destination": "Columbus, OH",
            "pickup_datetime": datetime.now() + timedelta(days=3, hours=8),
            "delivery_datetime": datetime.now() + timedelta(days=3, hours=14),
            "equipment_type": "Dry Van",
            "loadboard_rate": 980.00,
            "weight": 34000,
            "commodity_type": "Pharmaceuticals",
            "miles": 176,
            "notes": "High value cargo",
        },
    ]

    # Only add loads if they don't exist
    if not load_exists:
        for load_data in loads_data:
            load = Load(**load_data)
            db.add(load)
        print(f"Added {len(loads_data)} loads to database")
    else:
        # Get existing loads for call generation
        existing_loads = db.query(Load).all()
        loads_data = [
            {
                "load_id": load.load_id,
                "loadboard_rate": load.loadboard_rate,
                "origin": load.origin,
                "destination": load.destination,
            }
            for load in existing_loads
        ]
        print(f"Using {len(loads_data)} existing loads for call generation")

    # Seed data for calls
    carriers = [
        "ABC Trucking",
        "Delta Logistics",
        "Prime Transport",
        "Swift Carriers",
        "Elite Freight",
        "Global Haulers",
        "Metro Transport",
        "Advanced Logistics",
        "Coast to Coast",
        "Highway Express",
        "National Freight",
        "Velocity Logistics",
        "Interstate Transport",
        "Reliable Carriers",
        "Express Delivery Co",
    ]

    outcomes = ["booked", "rejected", "failed_negotiation", "ineligible"]

    calls_data = []

    # Generate calls for each load
    for load_data in loads_data:
        # Generate 2-5 calls per load
        num_calls = random.randint(2, 5)
        for i in range(num_calls):
            carrier = random.choice(carriers)
            outcome = random.choice(outcomes)

            # Set sentiment based on outcome
            if outcome == "booked":
                sentiment = random.choice(["positive", "neutral"])
            elif outcome == "rejected":
                sentiment = random.choice(["neutral", "negative"])
            else:  # failed_negotiation or ineligible
                sentiment = random.choice(["neutral", "negative"])

            # Generate pricing data
            base_rate = load_data["loadboard_rate"]
            initial_offer = round(base_rate * random.uniform(0.75, 0.95), 2)

            if outcome == "booked":
                final_price = round(base_rate * random.uniform(0.85, 1.0), 2)
                negotiation_rounds = random.randint(1, 4)
            else:
                final_price = None
                negotiation_rounds = random.randint(0, 3)

            call_data = {
                "carrier_mc_number": f"MC{random.randint(100000, 999999)}",
                "carrier_name": carrier,
                "load_id": load_data["load_id"],
                "outcome": outcome,
                "sentiment": sentiment,
                "initial_offer": initial_offer,
                "final_price": final_price,
                "negotiation_rounds": negotiation_rounds,
                "duration_seconds": random.randint(120, 900),  # 2-15 minutes
                "notes": f"Call regarding {load_data['load_id']} - {load_data['origin']} to {load_data['destination']}",
                "created_at": datetime.now() - timedelta(days=random.randint(0, 7)),
            }
            calls_data.append(call_data)

    # Add calls to database
    for call_data in calls_data:
        call = Call(**call_data)
        db.add(call)

    try:
        db.commit()
        print(
            f"Seeded {len(loads_data)} loads and {len(calls_data)} calls successfully"
        )
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
