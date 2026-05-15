from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from .. import models
from ..database import get_db
from ..models import DeviceHistory, User
from .dependencies import get_current_user, require_admin
import json
from datetime import datetime

router = APIRouter(prefix="/devices", tags=["devices"])

class DeviceCreate(BaseModel):
    name: str
    manufacturer: Optional[str] = None
    serial: Optional[str] = None
    u_position: Optional[int] = None
    u_size: Optional[int] = 1
    introduced_date: Optional[str] = None
    maintenance_company: Optional[str] = None
    maintenance_expiry_date: Optional[str] = None
    rack_id: Optional[int] = None
    site: Optional[str] = None
    device_type: Optional[str] = '기타'
    product_name: Optional[str] = None
    ip_address: Optional[str] = None

@router.get("/check-ip")
def check_ip(ip: str, exclude_id: Optional[int] = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = db.query(models.Device).filter(models.Device.ip_address == ip)
    if exclude_id:
        query = query.filter(models.Device.id != exclude_id)
    existing = query.first()
    if existing:
        return {"duplicate": True, "device_name": existing.name, "device_id": existing.id}
    return {"duplicate": False}

@router.get("/")
def get_devices(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(models.Device).all()

@router.get("/{device_id}")
def get_device(device_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")
    return device

@router.post("/")
def create_device(device: DeviceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    if device.serial:
        existing = db.query(models.Device).filter(models.Device.serial == device.serial).first()
        if existing:
            rack = db.query(models.Rack).filter(models.Rack.id == existing.rack_id).first()
            rack_info = f"{rack.site} RACK #{rack.rack_number}" if rack else f"랙 ID {existing.rack_id}"
            raise HTTPException(
                status_code=400,
                detail=f"이미 존재하는 시리얼 번호입니다.\n장비명: {existing.name}\n위치: {rack_info} {existing.u_position}U"
            )
    db_device = models.Device(**device.dict())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)

    history = DeviceHistory(
        device_id=db_device.id,
        change_type='create',
        snapshot=json.dumps(device.dict(), ensure_ascii=False),
        changed_at=datetime.utcnow(),
        changed_by=current_user.username,
    )
    db.add(history)
    db.commit()
    return db_device

@router.put("/{device_id}")
def update_device(device_id: int, device: DeviceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    db_device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")

    snapshot = {c.name: getattr(db_device, c.name) for c in db_device.__table__.columns}
    history = DeviceHistory(
        device_id=device_id,
        change_type='update',
        snapshot=json.dumps(snapshot, ensure_ascii=False, default=str),
        changed_at=datetime.utcnow(),
        changed_by=current_user.username,
    )
    db.add(history)

    for key, value in device.dict().items():
        setattr(db_device, key, value)
    db.commit()
    db.refresh(db_device)
    return db_device

@router.delete("/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    db_device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")

    snapshot = {c.name: getattr(db_device, c.name) for c in db_device.__table__.columns}
    history = DeviceHistory(
        device_id=device_id,
        change_type='delete',
        snapshot=json.dumps(snapshot, ensure_ascii=False, default=str),
        changed_at=datetime.utcnow(),
        changed_by=current_user.username,
    )
    db.add(history)
    db.commit()

    db.delete(db_device)
    db.commit()
    return {"message": "삭제 완료"}
