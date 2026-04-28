from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import devices, racks, history, documents, snapshots

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(devices.router)
app.include_router(racks.router)
app.include_router(history.router)
app.include_router(documents.router)
app.include_router(snapshots.router)

@app.get("/")
def read_root():
    return {"message": "DCIM API 서버 정상 작동 중"}