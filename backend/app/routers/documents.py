from fastapi import APIRouter, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Document
import os, uuid

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/device/{device_id}")
def get_documents(device_id: int, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.device_id == device_id).all()
    return [
        {
            "id": d.id,
            "device_id": d.device_id,
            "filename": d.filename,
            "original_name": d.original_name,
            "file_size": d.file_size,
            "uploaded_at": d.uploaded_at,
            "doc_type": d.doc_type,
        }
        for d in docs
    ]

@router.post("/device/{device_id}")
async def upload_document(
    device_id: int,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    doc = Document(
        device_id=device_id,
        filename=unique_name,
        original_name=file.filename,
        file_path=file_path,
        file_size=len(contents),
        doc_type=doc_type,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"ok": True, "id": doc.id}

@router.get("/download/{document_id}")
def download_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        return {"error": "파일을 찾을 수 없습니다."}
    return FileResponse(
        path=doc.file_path,
        filename=doc.original_name,
        media_type="application/octet-stream",
    )

@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if doc:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
        db.delete(doc)
        db.commit()
    return {"ok": True}