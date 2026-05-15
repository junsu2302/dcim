from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime
from ..database import get_db
from ..models import User, UserSession
import os

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dcim-ibk-secret-key-2026")
ALGORITHM = "HS256"

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        session_token: str = payload.get("session")
    except JWTError:
        raise HTTPException(status_code=401, detail="토큰이 유효하지 않습니다.")

    if not username:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")

    # 세션 검증 (중복 로그인 차단 & 로그아웃 즉시 처리)
    if session_token:
        session = db.query(UserSession).filter(
            UserSession.user_id == user.id,
            UserSession.session_token == session_token,
        ).first()
        if not session:
            raise HTTPException(
                status_code=401,
                detail="세션이 만료되었거나 다른 기기에서 로그인되었습니다. 다시 로그인해주세요."
            )
        if session.expires_at < datetime.utcnow():
            db.delete(session)
            db.commit()
            raise HTTPException(status_code=401, detail="세션이 만료되었습니다. 다시 로그인해주세요.")

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    return current_user
