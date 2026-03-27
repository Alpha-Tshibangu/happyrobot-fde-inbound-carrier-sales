# HappyRobot Carrier API

Clean, modular FastAPI backend with MCP (Model Context Protocol) support for handling inbound carrier calls, load matching, and price negotiation.

## Features

- **Load Management**: Search and filter available loads
- **Carrier Verification**: FMCSA API integration for carrier eligibility checks
- **Call Recording**: Track call outcomes, sentiment, and negotiation details
- **Dashboard Metrics**: Real-time analytics on call performance
- **MCP Protocol Support**: Native tool integration with HappyRobot platform
- **API Key Authentication**: Secure endpoints with API key validation
- **Modular Architecture**: Service layer separation for clean code

## Setup

### Local Development

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Run the application:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

### Docker Setup

From the project root:

```bash
docker-compose up
```

This will start:
- Backend API on http://localhost:8000
- PostgreSQL database on port 5432
- Dashboard on http://localhost:3000

## API Endpoints

### Authentication
All endpoints require an `X-API-Key` header.

### Endpoints

- `GET /` - API info and available endpoints

**REST API:**
- `GET /api/v1/loads` - Search available loads
- `GET /api/v1/loads/{load_id}` - Get specific load details
- `POST /api/v1/verify-carrier` - Verify carrier eligibility via FMCSA
- `POST /api/v1/calls` - Record call details
- `GET /api/v1/calls` - List all calls
- `GET /api/v1/dashboard` - Get dashboard metrics
- `GET /api/v1/dashboard/summary` - Get detailed dashboard summary

**MCP Tools (HappyRobot Integration):**
- `POST /mcp/verify-carrier` - Verify carrier tool
- `POST /mcp/search-loads` - Search loads tool
- `POST /mcp/record-call` - Record call tool
- `GET /mcp/dashboard-metrics` - Get metrics tool
- `POST /mcp/calculate-negotiation-range` - Calculate pricing tool

## Testing

Run the test script:
```bash
python test_api.py
```

## Database Schema

### Loads Table
- load_id (primary key)
- origin, destination
- pickup_datetime, delivery_datetime
- equipment_type
- loadboard_rate
- weight, commodity_type, miles, etc.

### Calls Table
- id (primary key)
- carrier_mc_number, carrier_name
- load_id
- outcome (booked/rejected/failed_negotiation/ineligible)
- sentiment (positive/neutral/negative)
- initial_offer, final_price
- negotiation_rounds
- extracted_data (JSON)
- created_at

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (defaults to SQLite for dev)
- `API_KEY`: API key for authentication
- `FMCSA_API_KEY`: FMCSA API key for carrier verification
- `ENVIRONMENT`: development/production

## Negotiation Logic

The API provides the data structure for negotiation. The actual negotiation logic should be implemented in the HappyRobot agent prompt:

- Loadboard rate is the ceiling price
- Suggested floor: 85% of loadboard rate
- Track negotiation rounds (max 3)
- Record final agreed price and outcome