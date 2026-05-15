from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import VM, User
from .dependencies import get_current_user, require_admin

router = APIRouter(prefix="/vms", tags=["vms"])

class VMCreate(BaseModel):
    name: str
    ip_address: Optional[str] = None
    host_nm: Optional[str] = None
    os: Optional[str] = None
    cpu: Optional[str] = None
    core: Optional[str] = None
    ram_gb: Optional[str] = None

@router.get("/counts")
def get_vm_counts(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    results = db.query(VM.device_id, func.count(VM.id).label('count')).group_by(VM.device_id).all()
    return {r.device_id: r.count for r in results}

@router.get("/device/{device_id}")
def get_vms(device_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vms = db.query(VM).filter(VM.device_id == device_id).all()
    return [
        {
            "id": v.id,
            "device_id": v.device_id,
            "name": v.name,
            "ip_address": v.ip_address,
            "host_nm": v.host_nm,
            "os": v.os,
            "cpu": v.cpu,
            "core": v.core,
            "ram_gb": v.ram_gb,
            "created_at": v.created_at,
        }
        for v in vms
    ]

@router.post("/device/{device_id}")
def create_vm(device_id: int, vm: VMCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    new_vm = VM(
        device_id=device_id,
        name=vm.name,
        ip_address=vm.ip_address,
        host_nm=vm.host_nm,
        os=vm.os,
        cpu=vm.cpu,
        core=vm.core,
        ram_gb=vm.ram_gb,
    )
    db.add(new_vm)
    db.commit()
    db.refresh(new_vm)
    return {"ok": True, "id": new_vm.id}

@router.put("/{vm_id}")
def update_vm(vm_id: int, vm: VMCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    db_vm = db.query(VM).filter(VM.id == vm_id).first()
    if not db_vm:
        raise HTTPException(status_code=404, detail="VM을 찾을 수 없습니다.")
    db_vm.name = vm.name
    db_vm.ip_address = vm.ip_address
    db_vm.host_nm = vm.host_nm
    db_vm.os = vm.os
    db_vm.cpu = vm.cpu
    db_vm.core = vm.core
    db_vm.ram_gb = vm.ram_gb
    db.commit()
    return {"ok": True}

@router.delete("/{vm_id}")
def delete_vm(vm_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    db_vm = db.query(VM).filter(VM.id == vm_id).first()
    if not db_vm:
        raise HTTPException(status_code=404, detail="VM을 찾을 수 없습니다.")
    db.delete(db_vm)
    db.commit()
    return {"ok": True}
