#!/usr/bin/env python3
"""
Test script for the HappyRobot Carrier API
"""

import httpx
import json

API_URL = "http://localhost:8000"
API_KEY = "your-secure-api-key-here"

headers = {"X-API-Key": API_KEY}


def test_root():
    """Test root endpoint"""
    response = httpx.get(f"{API_URL}/")
    print("Root endpoint:")
    print(json.dumps(response.json(), indent=2))
    print()


def test_loads():
    """Test loads endpoint"""
    response = httpx.get(f"{API_URL}/api/v1/loads", headers=headers)
    print("Loads endpoint:")
    loads = response.json()
    print(f"Found {len(loads)} loads")
    if loads:
        print("First load:")
        print(json.dumps(loads[0], indent=2))
    print()


def test_load_search():
    """Test load search with filters"""
    params = {"equipment_type": "Dry Van"}
    response = httpx.get(f"{API_URL}/api/v1/loads", headers=headers, params=params)
    print("Load search (Dry Van only):")
    loads = response.json()
    print(f"Found {len(loads)} Dry Van loads")
    print()


def test_verify_carrier():
    """Test carrier verification"""
    data = {"mc_number": "123456"}
    response = httpx.post(
        f"{API_URL}/api/v1/verify-carrier", headers=headers, json=data
    )
    print("Carrier verification:")
    print(json.dumps(response.json(), indent=2))
    print()


def test_create_call():
    """Test creating a call record"""
    data = {
        "carrier_mc_number": "123456",
        "carrier_name": "Test Carrier Inc",
        "load_id": "LD001",
        "outcome": "booked",
        "sentiment": "positive",
        "initial_offer": 2500,
        "final_price": 2300,
        "negotiation_rounds": 2,
        "extracted_data": {"driver_name": "John Doe", "truck_number": "TRK-123"},
        "notes": "Smooth negotiation, carrier was professional",
        "duration_seconds": 180,
    }
    response = httpx.post(f"{API_URL}/api/v1/calls", headers=headers, json=data)
    print("Create call:")
    print(json.dumps(response.json(), indent=2, default=str))
    print()
    return response.json()


def test_dashboard():
    """Test dashboard metrics"""
    response = httpx.get(f"{API_URL}/api/v1/dashboard", headers=headers)
    print("Dashboard metrics:")
    print(json.dumps(response.json(), indent=2))
    print()


if __name__ == "__main__":
    print("Testing HappyRobot Carrier API")
    print("=" * 40)
    print()

    try:
        test_root()
        test_loads()
        test_load_search()
        test_verify_carrier()
        call = test_create_call()
        test_dashboard()

        print("All tests completed successfully!")
    except httpx.RequestError as e:
        print(f"Error connecting to API: {e}")
        print("Make sure the API is running on http://localhost:8000")
    except Exception as e:
        print(f"Test failed: {e}")
