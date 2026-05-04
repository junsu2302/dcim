from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import User
from .auth import get_password_hash, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/users", tags=["users"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=401, detail="인증이 필요합니다.")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="토큰이 유효하지 않습니다.")

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    return current_user

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = 'viewer'

class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[str] = None

@router.get("/")
def get_users(db: Session = Depends(get_db), admin = Depends(require_admin)):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "role": u.role, "created_at": u.created_at} for u in users]

@router.post("/")
def create_user(user: UserCreate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다.")
    new_user = User(
        username=user.username,
        password=get_password_hash(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    return {"message": "사용자가 생성되었습니다."}

@router.put("/{user_id}")
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if user.password:
        db_user.password = get_password_hash(user.password)
    if user.role:
        db_user.role = user.role
    db.commit()
    return {"message": "사용자 정보가 수정되었습니다."}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin = Depends(require_admin)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if db_user.username == "admin":
        raise HTTPException(status_code=400, detail="기본 관리자는 삭제할 수 없습니다.")
    db.delete(db_user)
    db.commit()
    return {"message": "사용자가 삭제되었습니다."}