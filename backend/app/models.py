from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from .database import Base

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
    data = Column(Text, nullable=False)  # 전체 랙+장비+문서 JSON


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default='viewer')  # 'admin' or 'viewer'
    created_at = Column(DateTime, default=datetime.utcnow)