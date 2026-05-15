from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import Snapshot, Device, Rack, Document, VM, User
from .dependencies import get_current_user, require_admin
from datetime import datetime
import json

router = APIRouter(prefix="/snapshots", tags=["snapshots"])

class SnapshotCreate(BaseModel):
    memo: str
    saved_by: str = ''

@router.post("/")
def create_snapshot(body: SnapshotCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    racks = db.query(Rack).all()
    devices = db.query(Device).all()
    documents = db.query(Document).all()
    vms = db.query(VM).all()

    def to_dict(obj):
        return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

    data = {
        "racks": [to_dict(r) for r in racks],
        "devices": [to_dict(d) for d in devices],
        "documents": [to_dict(doc) for doc in documents],
        "vms": [to_dict(v) for v in vms],
    }

    snapshot = Snapshot(
        memo=body.memo,
        saved_by=body.saved_by,
        saved_at=datetime.utcnow(),
        data=json.dumps(data, ensure_ascii=False, default=str),
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return {"id": snapshot.id, "saved_at": snapshot.saved_at, "memo": snapshot.memo, "saved_by": snapshot.saved_by}

@router.get("/")
def get_snapshots(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    snapshots = db.query(Snapshot).order_by(Snapshot.saved_at.desc()).all()
    return [
        {"id": s.id, "saved_at": s.saved_at, "memo": s.memo, "saved_by": s.saved_by or ''}
        for s in snapshots
    ]

@router.get("/{snapshot_id}")
def get_snapshot(snapshot_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    s = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not s:
        return {"error": "스냅샷을 찾을 수 없습니다."}
    return {
        "id": s.id,
        "saved_at": s.saved_at,
        "memo": s.memo,
        "saved_by": s.saved_by or '',
        "data": json.loads(s.data),
    }

@router.delete("/{snapshot_id}")
def delete_snapshot(snapshot_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    s = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if s:
        db.delete(s)
        db.commit()
    return {"ok": True}
