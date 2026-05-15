from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import User, UserSession, LoginHistory
from .dependencies import get_current_user, require_admin, SECRET_KEY, ALGORITHM
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 5

pwd_context = CryptContext(
    schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12, bcrypt__ident="2b"
)


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    username = req.username.strip()

    # 로그인 횟수 제한 (5분 내 5회 실패 시 잠금)
    five_min_ago = datetime.utcnow() - timedelta(minutes=LOCKOUT_MINUTES)
    recent_fails = (
        db.query(LoginHistory)
        .filter(
            LoginHistory.username == username,
            LoginHistory.status == "failed",
            LoginHistory.created_at >= five_min_ago,
        )
        .count()
    )

    if recent_fails >= MAX_LOGIN_ATTEMPTS:
        db.add(LoginHistory(username=username, ip_address=ip, status="locked", fail_reason="rate_limited"))
        db.commit()
        raise HTTPException(
            status_code=429,
            detail=f"로그인 시도가 너무 많습니다. {LOCKOUT_MINUTES}분 후 다시 시도해주세요. (5회 연속 실패)"
        )

    # 사용자 검증
    user = db.query(User).filter(User.username == username).first()
    if not user or not pwd_context.verify(req.password, user.password):
        db.add(LoginHistory(username=username, ip_address=ip, status="failed", fail_reason="wrong_credentials"))
        db.commit()
        remaining = max(0, MAX_LOGIN_ATTEMPTS - recent_fails - 1)
        detail = "아이디 또는 비밀번호가 올바르지 않습니다."
        if remaining > 0:
            detail += f" (남은 시도: {remaining}회)"
        elif remaining == 0:
            detail += f" 다음 실패 시 {LOCKOUT_MINUTES}분 잠금됩니다."
        raise HTTPException(status_code=401, detail=detail)

    # 세션 토큰 생성
    session_token = secrets.token_hex(32)
    expires_at = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # 기존 세션 삭제 (새 로그인이 기존 세션 무효화)
    db.query(UserSession).filter(UserSession.user_id == user.id).delete()

    # 새 세션 등록
    db.add(UserSession(
        user_id=user.id,
        session_token=session_token,
        ip_address=ip,
        expires_at=expires_at,
    ))

    # 로그인 성공 이력 기록
    db.add(LoginHistory(username=username, ip_address=ip, status="success"))
    db.commit()

    token = create_access_token({
        "sub": user.username,
        "role": user.role,
        "id": user.id,
        "session": session_token,
    })

    return {"access_token": token, "role": user.role, "username": user.username}


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(UserSession).filter(UserSession.user_id == current_user.id).delete()
    db.commit()
    return {"message": "로그아웃되었습니다."}


@router.put("/change-password")
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not pwd_context.verify(body.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="비밀번호는 8자 이상이어야 합니다.")
    if body.old_password == body.new_password:
        raise HTTPException(status_code=400, detail="새 비밀번호는 현재 비밀번호와 달라야 합니다.")
    current_user.password = get_password_hash(body.new_password)
    # 비밀번호 변경 시 전체 세션 종료
    db.query(UserSession).filter(UserSession.user_id == current_user.id).delete()
    db.commit()
    return {"message": "비밀번호가 변경되었습니다."}


@router.get("/login-history")
def get_login_history(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = (
        db.query(LoginHistory)
        .order_by(LoginHistory.created_at.desc())
        .limit(300)
        .all()
    )
    return [
        {
            "id": h.id,
            "username": h.username,
            "ip_address": h.ip_address,
            "status": h.status,
            "fail_reason": h.fail_reason,
            "created_at": h.created_at,
        }
        for h in rows
    ]


@router.post("/init")
def init_admin(db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == "admin").first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 초기화되었습니다.")
    db.add(User(username="admin", password=get_password_hash("admin1234"), role="admin"))
    db.commit()
    return {"message": "관리자 계정이 생성되었습니다. (admin / admin1234)"}
