from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from .. import models
from ..database import get_db
from ..models import User
from .dependencies import get_current_user, require_admin

router = APIRouter(prefix="/racks", tags=["racks"])

class RackCreate(BaseModel):
    rack_number: int
    site: str
    total_u: int = 42

class RackUpdate(BaseModel):
    rack_number: int
    site: str
    total_u: int = 42

class RackResponse(BaseModel):
    id: int
    rack_number: int
    site: str
    total_u: int = 42

    class Config:
        from_attributes = True

@router.get("/", response_model=list[RackResponse])
def get_racks(site: Optional[str] = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = db.query(models.Rack)
    if site:
        query = query.filter(models.Rack.site == site)
    return query.all()

@router.post("/")
def create_rack(rack: RackCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    db_rack = models.Rack(
        rack_number=rack.rack_number,
        site=rack.site,
        total_u=rack.total_u,
    )
    db.add(db_rack)
    db.commit()
    db.refresh(db_rack)
    return db_rack

@router.put("/{rack_id}")
def update_rack(rack_id: int, rack: RackUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    db_rack = db.query(models.Rack).filter(models.Rack.id == rack_id).first()
    if not db_rack:
        raise HTTPException(status_code=404, detail="랙을 찾을 수 없습니다")
    for key, value in rack.dict().items():
        setattr(db_rack, key, value)
    db.commit()
    db.refresh(db_rack)
    return db_rack

@router.delete("/{rack_id}")
def delete_rack(rack_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    db_rack = db.query(models.Rack).filter(models.Rack.id == rack_id).first()
    if not db_rack:
        raise HTTPException(status_code=404, detail="랙을 찾을 수 없습니다")
    db.delete(db_rack)
    db.commit()
    return {"message": "삭제 완료"}
