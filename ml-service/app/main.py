from fastapi import FastAPI

from app.routers import health

app = FastAPI(title="AegisAI ML Service", version="1.0.0")

app.include_router(health.router)

@app.get("/")
def read_root():
    return {"message": "AegisAI ML Service API"}
