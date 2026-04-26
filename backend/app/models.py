from sqlalchemy import Column, Integer, String
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
    serial = Column(String, unique=True)
    u_position = Column(Integer)
    u_size = Column(Integer, default=1)
    introduced_date = Column(String)
    maintenance_company = Column(String)
    rack_id = Column(Integer)
    site = Column(String)