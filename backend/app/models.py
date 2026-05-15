from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from .database import Base

class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    session_token = Column(String(64), unique=True, nullable=False)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

class LoginHistory(Base):
    __tablename__ = "login_history"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), nullable=False)
    ip_address = Column(String(64), nullable=True)
    status = Column(String(16), nullable=False)   # success / failed / locked
    fail_reason = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Rack(Base):
    __tablename__ = "racks"

    id = Column(Integer, primary_key=True, index=True)
    rack_number = Column(Integer, nullable=False)
    site = Column(String, nullable=False)
    total_u = Column(Integer, default=42)

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    manufacturer = Column(String)
    product_name = Column(String)
    ip_address = Column(String)
    serial = Column(String, nullable=True)
    u_position = Column(Integer)
    u_size = Column(Integer, default=1)
    introduced_date = Column(String)
    maintenance_company = Column(String)
    maintenance_expiry_date = Column(String, nullable=True)
    rack_id = Column(Integer)
    site = Column(String)
    device_type = Column(String, default='기타')

class DeviceHistory(Base):
    __tablename__ = "device_history"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    changed_by = Column(String, default='system')
    change_type = Column(String, nullable=False)  # 'create', 'update', 'delete'
    snapshot = Column(Text, nullable=False)  # JSON 문자열로 변경 전 데이터 저장

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, nullable=False)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    doc_type = Column(String)  # '품의서', '납품확인서' 등


class Snapshot(Base):
    __tablename__ = "snapshots"

    id = Column(Integer, primary_key=True, index=True)
    saved_at = Column(DateTime, default=datetime.utcnow)
    memo = Column(String, default='')
    saved_by = Column(String, default='')
    data = Column(Text, nullable=False)  # 전체 랙+장비+문서 JSON


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default='viewer')  # 'admin' or 'viewer'
    created_at = Column(DateTime, default=datetime.utcnow)

class VM(Base):
    __tablename__ = "vms"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    ip_address = Column(String)
    os = Column(String)
    host_nm = Column(String)
    cpu = Column(String)
    core = Column(String)
    ram_gb = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)
    site = Column(String, nullable=True)
    category = Column(String, nullable=True)       # 구분
    item_name = Column(String, nullable=False)     # 품목
    system_name = Column(String, nullable=True)    # 시스템명
    contract_start = Column(String, nullable=True) # 계약 시작일
    contract_end = Column(String, nullable=True)   # 계약 종료일
    months = Column(Integer, nullable=True)        # 계약 개월 수
    quantity = Column(Integer, nullable=True)      # 수량
    inspection_count = Column(String, nullable=True)   # 점검 주기 (텍스트, 예: 월/분기/반기)
    company = Column(String, nullable=True)        # 유지보수 업체
    manager_name = Column(String, nullable=True)   # 담당자명
    manager_phone = Column(String, nullable=True)  # 담당자 연락처
    inspection_schedule = Column(Text, nullable=True)  # JSON: {"1":"15","3":"15",...}
    notes = Column(String, nullable=True)          # 비고
    created_at = Column(DateTime, default=datetime.utcnow)