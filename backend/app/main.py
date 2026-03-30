from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from scalar_fastapi import get_scalar_api_reference

from app.api import loads, carriers, calls, dashboard
from app.mcp_server import mcp_router
from app.db.database import engine, Base
from app.db.seed import seed_database
from app.db.migrate import migrate_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run migrations to handle schema changes
    migrate_database()
    # Seed initial data if needed
    seed_database()
    yield


app = FastAPI(
    title="HappyRobot Carrier API",
    version="1.0.0",
    description="API for handling inbound carrier calls and load matching",
    lifespan=lifespan,
    docs_url=None,  # Disable default Swagger UI
    redoc_url=None,  # Disable ReDoc
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(loads.router, prefix="/api/v1")
app.include_router(carriers.router, prefix="/api/v1")
app.include_router(calls.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(mcp_router)


@app.get("/")
def read_root():
    return {
        "message": "HappyRobot Carrier API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "/api/v1/loads",
            "/api/v1/verify-carrier",
            "/api/v1/calls",
            "/api/v1/dashboard",
        ],
    }


@app.get("/docs", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=app.title,
    )
