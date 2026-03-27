# HappyRobot Inbound Carrier Sales Automation

## 📋 Project Overview

This project is a complete solution for the **FDE Technical Challenge: Inbound Carrier Sales**, implementing an automated freight brokerage system that handles inbound carrier calls using the HappyRobot platform. The solution automates carrier vetting, load matching, pricing negotiation, and provides comprehensive analytics through a custom-built dashboard.

## 🎯 Challenge Requirements

This implementation addresses the three core objectives outlined in the technical challenge:

### 🤖 Objective 1: Implement Inbound Use Case
- **Automated Carrier Calls**: AI assistant receives calls from carriers looking to book loads
- **Carrier Verification**: MC number validation using FMCSA API
- **Load Matching**: Intelligent search and matching of available loads based on carrier requirements
- **Automated Negotiation**: Handles up to 3 rounds of pricing negotiation
- **Call Classification**: Automatically extracts relevant data, classifies outcomes, and analyzes sentiment

### 📊 Objective 2: Custom Metrics Dashboard
- **Real-time Analytics**: Custom-built dashboard (not using platform analytics)
- **Call Performance Metrics**: Conversion rates, negotiation efficiency, sentiment analysis
- **Load Analytics**: Load matching success, pricing trends, carrier performance
- **Interactive Visualizations**: Charts, graphs, and detailed call breakdowns

### ⚙️ Objective 3: Deployment and Infrastructure
- **Containerized Solution**: Full Docker containerization
- **Cloud Deployment**: Scalable cloud infrastructure
- **Security Features**: HTTPS, API key authentication
- **MCP Server Integration**: Model Context Protocol for external integrations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HappyRobot Platform                     │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │  Inbound Voice  │    │     AI Agent Workflow       │   │
│  │     Agent       │◄──►│  • Carrier Verification     │   │
│  │  (Web Calls)    │    │  • Load Search & Matching   │   │
│  └─────────────────┘    │  • Negotiation Logic        │   │
│                         │  • Data Extraction          │   │
│                         └──────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API Server                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   FastAPI       │    │   MCP Server    │                │
│  │   • REST API    │◄──►│   • Tools API   │                │
│  │   • Auth        │    │   • FMCSA       │                │
│  │   • CRUD Ops    │    │   • Load Search │                │
│  └─────────────────┘    └─────────────────┘                │
│             │                      │                       │
│             ▼                      ▼                       │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   SQLite DB     │    │  External APIs  │                │
│  │   • Calls       │    │   • FMCSA API   │                │
│  │   • Loads       │    │   • Carrier DB  │                │
│  │   • Carriers    │    └─────────────────┘                │
│  └─────────────────┘                                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend Dashboard (Next.js)                  │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  Call Overview  │    │  Carrier Sales  │                │
│  │  • Metrics      │    │  • Recent Calls │                │
│  │  • KPIs         │    │  • Analytics    │                │
│  │  • AI Insights  │    │  • Load Details │                │
│  └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLite**: Lightweight database for development/demo
- **SQLAlchemy**: ORM for database operations
- **Pydantic**: Data validation and serialization
- **MCP Server**: Model Context Protocol implementation

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Interactive data visualizations
- **Shadcn/UI**: Modern component library

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-service orchestration
- **HTTPS**: SSL/TLS security
- **API Authentication**: Key-based security

## 📦 Project Structure

```
/happyrobot/
├── backend/                    # FastAPI backend server
│   ├── app/
│   │   ├── api/               # REST API endpoints
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic
│   │   ├── db/                # Database configuration
│   │   └── mcp_server.py      # MCP protocol server
│   ├── Dockerfile             # Backend containerization
│   └── requirements.txt       # Python dependencies
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/              # App router pages
│   │   ├── components/       # Reusable components
│   │   ├── features/         # Feature-specific modules
│   │   └── lib/              # Utilities and API client
│   ├── Dockerfile            # Frontend containerization
│   └── package.json          # Node.js dependencies
├── docker-compose.yml        # Multi-service orchestration
└── README.md                 # This file
```

## 🔧 Installation & Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd happyrobot
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the applications**
   - Frontend Dashboard: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=sqlite:///./happyrobot.db
API_KEY=hr_9b477b80e2674d708437db35753e3207
FMCSA_API_KEY=your_fmcsa_api_key
ENVIRONMENT=development
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=hr_9b477b80e2674d708437db35753e3207
OPENAI_API_KEY=your_openai_api_key_for_ai_insights
```

## 📊 Features

### HappyRobot Platform Integration
- **Inbound Voice Agent**: Configured for web call triggers
- **Carrier Verification Tool**: FMCSA API integration via MCP
- **Load Search Tool**: Database query tool for load matching
- **Call Recording Tool**: Automated data extraction and classification
- **Negotiation Logic**: Multi-round pricing negotiation workflow

### Custom Analytics Dashboard
- **Call Overview**: Real-time metrics, KPIs, and performance indicators
- **Carrier Sales**: Recent calls with expandable detail views
- **Interactive Charts**: Bar charts, line graphs, sentiment analysis
- **AI Insights**: Conversation memory and intelligent recommendations
- **Load Analytics**: Route optimization, pricing trends, equipment utilization

### API Features
- **RESTful Endpoints**: Full CRUD operations for calls, loads, carriers
- **Authentication**: API key-based security for all endpoints
- **MCP Protocol**: Model Context Protocol server for HappyRobot integration
- **FMCSA Integration**: Real-time carrier verification
- **Data Export**: JSON/CSV export capabilities

## 🛠️ API Endpoints

### Core Endpoints
- `GET /api/v1/dashboard` - Dashboard metrics and KPIs
- `GET /api/v1/calls` - List all calls with filtering
- `POST /api/v1/calls` - Create new call record
- `GET /api/v1/loads` - Search available loads
- `POST /api/v1/verify-carrier` - Verify carrier MC number

### MCP Endpoints
- `POST /mcp/verify-carrier` - Carrier verification via MCP
- `POST /mcp/search-loads` - Load search via MCP
- `POST /mcp/record-call` - Call recording via MCP

## 📈 Load Data Schema

The system manages freight loads with the following data structure:

| Field | Description |
|-------|-------------|
| load_id | Unique identifier for the load |
| origin | Starting location |
| destination | Delivery location |
| pickup_datetime | Date and time for pickup |
| delivery_datetime | Date and time for delivery |
| equipment_type | Type of equipment needed |
| loadboard_rate | Listed rate for the load |
| notes | Additional information |
| weight | Load weight |
| commodity_type | Type of goods |
| num_of_pieces | Number of items |
| miles | Distance to travel |
| dimensions | Size measurements |

## 🤖 AI Agent Workflow

The HappyRobot inbound agent follows this conversation flow:

1. **Greeting & MC Collection**: Welcomes carrier and collects MC number
2. **Carrier Verification**: Validates MC number against FMCSA database
3. **Load Requirements**: Gathers equipment type, location preferences
4. **Load Matching**: Searches and presents matching loads
5. **Load Presentation**: Details load specifications and initial pricing
6. **Negotiation**: Handles up to 3 rounds of counter-offers
7. **Agreement**: Confirms terms and initiates transfer to sales rep
8. **Data Extraction**: Records call outcome, sentiment, and key data points

## 🔍 Dashboard Analytics

### Key Metrics
- **Total Calls**: Volume tracking with trend analysis
- **Conversion Rate**: Percentage of calls resulting in bookings
- **Sentiment Distribution**: Positive/Neutral/Negative sentiment analysis
- **Average Negotiation Rounds**: Efficiency metrics
- **Discount Percentage**: Pricing negotiation insights

### Visualizations
- **Call Volume Trends**: Time-series analysis
- **Outcome Distribution**: Success rate breakdowns
- **Carrier Performance**: Top performing carriers
- **Load Analytics**: Route and equipment popularity
- **Price Negotiation**: Deal progression tracking

## 🐳 Docker Deployment

### Build and Run
```bash
# Build all services
docker-compose build

# Start in production mode
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up --scale backend=2 --scale frontend=2
```

### Production Configuration
- Multi-stage builds for optimized images
- Health checks for service monitoring
- Volume mounts for persistent data
- Network isolation for security

## 🔒 Security Features

- **HTTPS**: SSL/TLS encryption for all communications
- **API Authentication**: Required API keys for all endpoints
- **Input Validation**: Comprehensive data validation and sanitization
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Rate Limiting**: Protection against abuse and DoS attacks

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests
```bash
cd observability-dashboard
npm test
npm run test:e2e
```

## 📝 Development Notes

### Database Seeding
The application includes comprehensive seed data:
- 15 sample loads covering various equipment types and routes
- 100+ call records with realistic negotiation data
- Carrier information with MC numbers and verification status

### MCP Integration
The Model Context Protocol server enables seamless integration with the HappyRobot platform:
- Tool registration for carrier verification
- Load search capabilities
- Call data recording
- Real-time metrics collection

## 🚀 Deployment Instructions

### Cloud Deployment (AWS/GCP/Azure)
1. Configure cloud provider credentials
2. Set up container registry
3. Deploy using Docker containers
4. Configure load balancer and SSL certificates
5. Set up monitoring and logging

### Environment Setup
- Production environment variables
- Database migration scripts
- SSL certificate configuration
- Monitoring and alerting setup

## 👥 Team & Contact

**Developer**: Alpha Tshibangu
**Email**: alphatshibangu01@gmail.com
**Challenge**: FDE Technical Challenge - Inbound Carrier Sales
**Platform**: HappyRobot AI Automation

## 📚 Additional Resources

- [HappyRobot Platform Documentation](https://docs.happyrobot.ai)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com)

## 🔄 CI/CD Pipeline

The project includes GitHub Actions workflows for:
- Automated testing on push/PR
- Docker image building and publishing
- Deployment to staging/production environments
- Code quality checks and security scanning

---

*This project demonstrates a complete freight brokerage automation solution built with modern technologies and best practices, showcasing both technical expertise and product vision for the freight industry.*