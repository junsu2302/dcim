from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import DeviceHistory, Device
import json

router = APIRouter(prefix="/history", tags=["history"])

FIELD_LABELS = {
    'name': '장비명', 'site': '사이트', 'device_type': '구분',
    'u_position': 'U위치', 'rack_id': '랙', 'ip_address': 'IP',
    'maintenance_company': '유지보수업체', 'maintenance_expiry_date': '만료일',
    'manufacturer': '제조사', 'product_name': '모델명', 'serial': '시리얼',
}

@router.get("/recent")
def get_recent_history(limit: int = 10, db: Session = Depends(get_db)):
    history = db.query(DeviceHistory)\
        .order_by(DeviceHistory.changed_at.desc())\
        .limit(limit)\
        .all()
    result = []
    for h in history:
        device = db.query(Device).filter(Device.id == h.device_id).first()
        snapshot = json.loads(h.snapshot) if h.snapshot else {}

        if h.change_type == 'create':
            parts = []
            if snapshot.get('site'): parts.append(snapshot['site'])
            if snapshot.get('device_type'): parts.append(snapshot['device_type'])
            if snapshot.get('u_position'): parts.append(f"{snapshot['u_position']}U")
            summary = ' · '.join(parts) if parts else None
        elif h.change_type == 'delete':
            parts = []
            if snapshot.get('site'): parts.append(snapshot['site'])
            if snapshot.get('device_type'): parts.append(snapshot['device_type'])
            summary = ' · '.join(parts) if parts else None
        elif h.change_type == 'update' and device:
            device_dict = {c.name: getattr(device, c.name) for c in device.__table__.columns}
            changed = [
                FIELD_LABELS[f] for f in FIELD_LABELS
                if str(snapshot.get(f) or '') != str(device_dict.get(f) or '')
            ]
            summary = ', '.join(changed[:3]) + ' 변경' if changed else '정보 수정'
        else:
            summary = None

        result.append({
            "id": h.id,
            "device_id": h.device_id,
            "device_name": device.name if device else snapshot.get('name', '(삭제된 장비)'),
            "changed_at": h.changed_at,
            "changed_by": h.changed_by,
            "change_type": h.change_type,
            "change_summary": summary,
        })
    return result

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