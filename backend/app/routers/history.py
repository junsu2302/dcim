from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import DeviceHistory
import json

router = APIRouter(prefix="/history", tags=["history"])

@router.get("/device/{device_id}")
def get_device_history(device_id: int, db: Session = Depends(get_db)):
    history = db.query(DeviceHistory)\
        .filter(DeviceHistory.device_id == device_id)\
        .order_by(DeviceHistory.changed_at.desc())\
        .all()
    return [
        {
            "id": h.id,
            "device_id": h.device_id,
            "changed_at": h.changed_at,
            "changed_by": h.changed_by,
            "change_type": h.change_type,
            "snapshot": json.loads(h.snapshot),
        }
        for h in history
    ]

@router.delete("/{history_id}")
def delete_history(history_id: int, db: Session = Depends(get_db)):
    h = db.query(DeviceHistory).filter(DeviceHistory.id == history_id).first()
    if h:
        db.delete(h)
        db.commit()
    return {"ok": True}