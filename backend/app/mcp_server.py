#!/usr/bin/env python3
"""
MCP Server for HappyRobot Carrier API

Implements proper MCP (Model Context Protocol) server with Streamable HTTP transport.
Provides tools for:
- Carrier verification via FMCSA
- Load search and matching
- Call recording and metrics

Maintains 100% code reusability by importing existing service layer.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
import json

from app.api.auth import verify_api_key

from app.db.database import SessionLocal
from app.models.call import Call
from app.models.load import Load
from app.services.carrier_service import verify_carrier_service
from app.services.dashboard_service import get_dashboard_metrics_service
from app.services.load_management_service import LoadManagementService

mcp_router = APIRouter(prefix="/mcp", tags=["MCP Tools"])


class MCPRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: str | int
    method: str
    params: Optional[Dict[str, Any]] = None


class MCPResponse(BaseModel):
    jsonrpc: str = "2.0"
    id: str | int
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None


class CarrierVerificationInput(BaseModel):
    mc_number: str


class LoadSearchInput(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    equipment_type: Optional[str] = None
    pickup_date_from: Optional[str] = None
    pickup_date_to: Optional[str] = None


class CallRecordInput(BaseModel):
    carrier_mc_number: str
    carrier_name: Optional[str] = None
    load_id: Optional[str] = None
    outcome: str  # booked, rejected, failed_negotiation, ineligible
    sentiment: str  # positive, neutral, negative
    initial_offer: Optional[float] = None
    final_price: Optional[float] = None
    negotiation_rounds: int = 0
    notes: Optional[str] = None
    duration_seconds: Optional[int] = None


class MCPCarrierService:
    """MCP wrapper for carrier services maintaining 100% code reusability."""

    @staticmethod
    async def verify_carrier(mc_number: str) -> Dict[str, Any]:
        """Verify carrier eligibility using FMCSA database."""
        try:
            result = await verify_carrier_service(mc_number)
            return result.dict()
        except Exception as e:
            return {"error": str(e), "is_eligible": False}

    @staticmethod
    def search_loads(filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search available freight loads with optional filters."""
        db = SessionLocal()
        try:
            query = db.query(Load)

            if filters.get("origin"):
                # Extract city name from either "Birmingham Alabama" or "Birmingham, AL" format
                origin = filters['origin']
                if ',' in origin:
                    # Format is "City, ST" - just get the city part
                    city = origin.split(',')[0].strip()
                else:
                    # Format is likely "City State" - split from right to separate state
                    parts = origin.rsplit(' ', 1)
                    city = parts[0] if len(parts) > 1 else origin
                print(f"DEBUG - Searching origin with city: '{city}' from input: '{origin}'")
                query = query.filter(Load.origin.ilike(f"%{city}%"))

            if filters.get("destination"):
                # Extract city name from either "Atlanta Georgia" or "Atlanta, GA" format
                destination = filters['destination']
                if ',' in destination:
                    # Format is "City, ST" - just get the city part
                    city = destination.split(',')[0].strip()
                else:
                    # Format is likely "City State" - split from right to separate state
                    parts = destination.rsplit(' ', 1)
                    city = parts[0] if len(parts) > 1 else destination
                print(f"DEBUG - Searching destination with city: '{city}' from input: '{destination}'")
                query = query.filter(
                    Load.destination.ilike(f"%{city}%")
                )
            if filters.get("equipment_type"):
                query = query.filter(Load.equipment_type == filters["equipment_type"])
            if filters.get("pickup_date_from"):
                pickup_from = datetime.fromisoformat(
                    filters["pickup_date_from"].replace("Z", "+00:00")
                )
                query = query.filter(Load.pickup_datetime >= pickup_from)
            if filters.get("pickup_date_to"):
                pickup_to = datetime.fromisoformat(
                    filters["pickup_date_to"].replace("Z", "+00:00")
                )
                query = query.filter(Load.pickup_datetime <= pickup_to)

            loads = query.all()
            return [
                {
                    "load_id": load.load_id,
                    "origin": load.origin,
                    "destination": load.destination,
                    "pickup_datetime": load.pickup_datetime.isoformat(),
                    "delivery_datetime": load.delivery_datetime.isoformat(),
                    "equipment_type": load.equipment_type,
                    "loadboard_rate": load.loadboard_rate,
                    "weight": load.weight,
                    "commodity_type": load.commodity_type,
                    "miles": load.miles,
                    "notes": load.notes,
                }
                for load in loads
            ]
        finally:
            db.close()

    @staticmethod
    def record_call(call_data: Dict[str, Any]) -> Dict[str, Any]:
        """Record call details and outcome for tracking."""
        db = SessionLocal()
        try:
            # Handle string price formats like "$410" -> 410.0
            def parse_price(price_value):
                if price_value is None:
                    return None
                if isinstance(price_value, str):
                    # Remove dollar sign and convert to float
                    return float(price_value.replace('$', '').replace(',', ''))
                return float(price_value)

            print(f"DEBUG - Recording call with data: {call_data}")

            call = Call(
                carrier_mc_number=call_data["carrier_mc_number"],
                carrier_name=call_data.get("carrier_name"),
                load_id=call_data.get("load_id"),
                outcome=call_data["outcome"],
                sentiment=call_data["sentiment"],
                initial_offer=parse_price(call_data.get("initial_offer")),
                final_price=parse_price(call_data.get("final_price")),
                negotiation_rounds=call_data.get("negotiation_rounds", 0),
                notes=call_data.get("notes"),
                duration_seconds=call_data.get("duration_seconds"),
            )

            db.add(call)
            db.commit()
            db.refresh(call)

            # Automatically update load status if call was successful and load_id provided
            load_updated = False
            if (call_data["outcome"] == "booked" and
                call_data.get("load_id") and
                call_data.get("final_price") and
                call_data.get("carrier_name")):

                try:
                    updated_load = LoadManagementService.book_load_from_call(
                        db=db,
                        load_id=call_data["load_id"],
                        carrier_mc=call_data["carrier_mc_number"],
                        carrier_name=call_data["carrier_name"],
                        final_price=call_data["final_price"]
                    )
                    load_updated = bool(updated_load)
                except Exception as e:
                    print(f"Failed to update load status: {e}")

            return {
                "id": call.id,
                "created_at": call.created_at.isoformat() if call.created_at else None,
                "load_updated": load_updated,
                "success": True,
            }
        except Exception as e:
            db.rollback()
            return {"error": str(e), "success": False}
        finally:
            db.close()

    @staticmethod
    def get_dashboard_metrics() -> Dict[str, Any]:
        """Get comprehensive dashboard metrics for call performance."""
        try:
            return get_dashboard_metrics_service().dict()
        except Exception as e:
            return {"error": str(e)}


class MCPServer:
    """MCP Server implementing Streamable HTTP transport protocol."""

    def __init__(self):
        self.tools = {
            "verify-carrier": {
                "name": "verify-carrier",
                "description": "Verify carrier eligibility using FMCSA database",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "mc_number": {
                            "type": "string",
                            "description": "The carrier's MC (Motor Carrier) number",
                        }
                    },
                    "required": ["mc_number"],
                },
            },
            "search-loads": {
                "name": "search-loads",
                "description": "Search available freight loads with optional filters",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "origin": {
                            "type": "string",
                            "description": "Starting location",
                        },
                        "destination": {
                            "type": "string",
                            "description": "Delivery location",
                        },
                        "equipment_type": {
                            "type": "string",
                            "description": "Equipment type (dry van, flatbed, reefer)",
                        },
                        "pickup_date_from": {
                            "type": "string",
                            "description": "Earliest pickup date (ISO format)",
                        },
                        "pickup_date_to": {
                            "type": "string",
                            "description": "Latest pickup date (ISO format)",
                        },
                    },
                },
            },
            "record-call": {
                "name": "record-call",
                "description": "Record call details and outcome for tracking",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "carrier_mc_number": {
                            "type": "string",
                            "description": "Carrier's MC number",
                        },
                        "carrier_name": {
                            "type": "string",
                            "description": "Carrier company name",
                        },
                        "load_id": {
                            "type": "string",
                            "description": "Load ID discussed",
                        },
                        "outcome": {
                            "type": "string",
                            "description": "Call outcome (booked/rejected/failed_negotiation/ineligible)",
                        },
                        "sentiment": {
                            "type": "string",
                            "description": "Carrier sentiment (positive/neutral/negative)",
                        },
                        "initial_offer": {
                            "type": "number",
                            "description": "Carrier's initial price offer",
                        },
                        "final_price": {
                            "type": "number",
                            "description": "Final agreed price",
                        },
                        "negotiation_rounds": {
                            "type": "integer",
                            "description": "Number of negotiation rounds",
                        },
                    },
                    "required": ["carrier_mc_number", "outcome", "sentiment"],
                },
            },
        }

    async def handle_request(self, request) -> MCPResponse:
        """Handle MCP protocol requests with proper response formatting."""
        try:
            if request.method == "initialize":
                return MCPResponse(
                    id=request.id,
                    result={
                        "protocolVersion": "2024-11-05",
                        "capabilities": {"tools": {}},
                        "serverInfo": {
                            "name": "HappyRobot Carrier API",
                            "version": "1.0.0",
                        },
                    },
                )

            elif request.method == "tools/list":
                return MCPResponse(
                    id=request.id, result={"tools": list(self.tools.values())}
                )

            elif request.method == "tools/call":
                tool_name = request.params.get("name")
                arguments = request.params.get("arguments", {})

                print(f"DEBUG - MCP tool call: {tool_name} with arguments: {arguments}")

                if tool_name == "verify-carrier":
                    result = await MCPCarrierService.verify_carrier(
                        arguments["mc_number"]
                    )
                elif tool_name == "search-loads":
                    print(f"DEBUG - Calling search_loads with filters: {arguments}")
                    result = MCPCarrierService.search_loads(arguments)
                    print(f"DEBUG - search_loads returned {len(result) if isinstance(result, list) else 'error'} results")
                elif tool_name == "record-call":
                    result = MCPCarrierService.record_call(arguments)
                else:
                    return MCPResponse(
                        id=request.id,
                        error={"code": -32601, "message": f"Unknown tool: {tool_name}"},
                    )

                return MCPResponse(
                    id=request.id,
                    result={"content": [{"type": "text", "text": json.dumps(result)}]},
                )

            else:
                return MCPResponse(
                    id=request.id,
                    error={
                        "code": -32601,
                        "message": f"Unknown method: {request.method}",
                    },
                )

        except Exception as e:
            return MCPResponse(id=request.id, error={"code": -32603, "message": str(e)})


mcp_server = MCPServer()


@mcp_router.post("/")
async def mcp_streamable_http(request: Request, api_key: str = Depends(verify_api_key)):
    """MCP Streamable HTTP transport endpoint for HappyRobot integration."""
    try:
        body = await request.json()

        # Handle MCP request directly without strict Pydantic validation
        request_id = body.get("id", "unknown")
        method = body.get("method")
        params = body.get("params", {})

        # Create a simple request object
        simple_request = type(
            "MCPRequest", (), {"id": request_id, "method": method, "params": params}
        )()

        mcp_response = await mcp_server.handle_request(simple_request)

        # Return raw dict instead of using Pydantic model
        response_dict = {"jsonrpc": "2.0", "id": request_id}

        if mcp_response.result is not None:
            response_dict["result"] = mcp_response.result
        if mcp_response.error is not None:
            response_dict["error"] = mcp_response.error

        return response_dict

    except Exception as e:
        return {
            "jsonrpc": "2.0",
            "id": "error",
            "error": {"code": -32700, "message": f"Parse error: {str(e)}"},
        }


@mcp_router.post("/verify-carrier")
async def mcp_verify_carrier(input_data: CarrierVerificationInput, api_key: str = Depends(verify_api_key)) -> Dict[str, Any]:
    """Verify carrier eligibility using FMCSA database."""
    try:
        result = await verify_carrier_service(input_data.mc_number)
        return result.dict()
    except Exception as e:
        return {"error": str(e), "is_eligible": False}


@mcp_router.post("/search-loads")
def mcp_search_loads(input_data: LoadSearchInput, api_key: str = Depends(verify_api_key)) -> List[Dict[str, Any]]:
    """Search available freight loads with optional filters."""
    db = SessionLocal()
    try:
        query = db.query(Load)

        if input_data.origin:
            # Extract city name from either "Birmingham Alabama" or "Birmingham, AL" format
            origin = input_data.origin
            if ',' in origin:
                city = origin.split(',')[0].strip()
            else:
                parts = origin.rsplit(' ', 1)
                city = parts[0] if len(parts) > 1 else origin
            query = query.filter(Load.origin.ilike(f"%{city}%"))
        if input_data.destination:
            # Extract city name from either "Atlanta Georgia" or "Atlanta, GA" format
            destination = input_data.destination
            if ',' in destination:
                city = destination.split(',')[0].strip()
            else:
                parts = destination.rsplit(' ', 1)
                city = parts[0] if len(parts) > 1 else destination
            query = query.filter(Load.destination.ilike(f"%{city}%"))
        if input_data.equipment_type:
            query = query.filter(Load.equipment_type == input_data.equipment_type)
        if input_data.pickup_date_from:
            pickup_from = datetime.fromisoformat(
                input_data.pickup_date_from.replace("Z", "+00:00")
            )
            query = query.filter(Load.pickup_datetime >= pickup_from)
        if input_data.pickup_date_to:
            pickup_to = datetime.fromisoformat(
                input_data.pickup_date_to.replace("Z", "+00:00")
            )
            query = query.filter(Load.pickup_datetime <= pickup_to)

        loads = query.all()
        return [
            {
                "load_id": load.load_id,
                "origin": load.origin,
                "destination": load.destination,
                "pickup_datetime": load.pickup_datetime.isoformat(),
                "delivery_datetime": load.delivery_datetime.isoformat(),
                "equipment_type": load.equipment_type,
                "loadboard_rate": load.loadboard_rate,
                "weight": load.weight,
                "commodity_type": load.commodity_type,
                "miles": load.miles,
                "notes": load.notes,
            }
            for load in loads
        ]
    finally:
        db.close()


@mcp_router.post("/record-call")
def mcp_record_call(input_data: CallRecordInput, api_key: str = Depends(verify_api_key)) -> Dict[str, Any]:
    """Record details from a carrier call interaction."""
    db = SessionLocal()
    try:
        # Handle string price formats like "$410" -> 410.0
        def parse_price(price_value):
            if price_value is None:
                return None
            if isinstance(price_value, str):
                # Remove dollar sign and convert to float
                return float(price_value.replace('$', '').replace(',', ''))
            return float(price_value)

        print(f"DEBUG - Recording call via HTTP with data: {input_data}")

        call = Call(
            carrier_mc_number=input_data.carrier_mc_number,
            carrier_name=input_data.carrier_name,
            load_id=input_data.load_id,
            outcome=input_data.outcome,
            sentiment=input_data.sentiment,
            initial_offer=parse_price(input_data.initial_offer),
            final_price=parse_price(input_data.final_price),
            negotiation_rounds=input_data.negotiation_rounds,
            notes=input_data.notes,
            duration_seconds=input_data.duration_seconds,
        )

        db.add(call)
        db.commit()
        db.refresh(call)

        return {
            "id": call.id,
            "created_at": call.created_at.isoformat() if call.created_at else None,
            "success": True,
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e), "success": False}
    finally:
        db.close()


@mcp_router.get("/dashboard-metrics")
def mcp_get_dashboard_metrics(api_key: str = Depends(verify_api_key)) -> Dict[str, Any]:
    """Get comprehensive dashboard metrics for call performance."""
    try:
        return get_dashboard_metrics_service().dict()
    except Exception as e:
        return {"error": str(e)}


class NegotiationRangeInput(BaseModel):
    loadboard_rate: float
    floor_percentage: float = 85.0


@mcp_router.post("/calculate-negotiation-range")
def mcp_calculate_negotiation_range(
    input_data: NegotiationRangeInput, api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """Calculate negotiation range for a given loadboard rate."""
    floor_price = input_data.loadboard_rate * (input_data.floor_percentage / 100)
    return {
        "loadboard_rate": input_data.loadboard_rate,
        "floor_price": round(floor_price, 2),
        "ceiling_price": input_data.loadboard_rate,
        "floor_percentage": input_data.floor_percentage,
        "negotiation_range": round(input_data.loadboard_rate - floor_price, 2),
    }
