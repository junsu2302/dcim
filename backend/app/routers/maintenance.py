from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from .. import models
from ..database import get_db

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

class MaintenanceCreate(BaseModel):
    site: Optional[str] = None
    category: Optional[str] = None
    item_name: str
    system_name: Optional[str] = None
    contract_start: Optional[str] = None
    contract_end: Optional[str] = None
    months: Optional[int] = None
    quantity: Optional[int] = None
    inspection_count: Optional[str] = None
    company: Optional[str] = None
    manager_name: Optional[str] = None
    manager_phone: Optional[str] = None
    inspection_schedule: Optional[str] = None
    notes: Optional[str] = None

@router.get("/")
def get_maintenance(db: Session = Depends(get_db)):
    return db.query(models.Maintenance).order_by(models.Maintenance.site, models.Maintenance.category, models.Maintenance.item_name).all()

@router.get("/{item_id}")
def get_maintenance_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Maintenance).filter(models.Maintenance.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="항목을 찾을 수 없습니다")
    return item

@router.post("/")
def create_maintenance(item: MaintenanceCreate, db: Session = Depends(get_db)):
    db_item = models.Maintenance(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{item_id}")
def update_maintenance(item_id: int, item: MaintenanceCreate, db: Session = Depends(get_db)):
    db_item = db.query(models.Maintenance).filter(models.Maintenance.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="항목을 찾을 수 없습니다")
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_maintenance(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.Maintenance).filter(models.Maintenance.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="항목을 찾을 수 없습니다")
    db.delete(db_item)
    db.commit()
    return {"message": "삭제 완료"}
