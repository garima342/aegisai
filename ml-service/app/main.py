from fastapi import FastAPI

from app.m2.router import router as m2_router
from app.routers import health

app = FastAPI(title="AegisAI ML Service", version="1.0.0")

app.include_router(health.router)
app.include_router(m2_router)

@app.get("/")
def read_root():
    return {"message": "AegisAI ML Service API"}
