from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import os
from datetime import datetime
import models
import schemas
import database
import ocr
import utils
import io
from fastapi.responses import JSONResponse
import json
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=database.engine)


app = FastAPI(
    title="Pytesseract OCR API",
    description="A simple API to perform OCR on uploaded images using pytesseract.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:3000"],           # ✅ Allow all origins
    allow_credentials=True,
    allow_methods=["*"],           # ✅ Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],           # ✅ Allow all headers (e.g., Content-Type)
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/upload")
def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed.")

    filepath = os.path.join("uploads", file.filename)

    # Check for existing file in the database
    existing = db.query(models.ReceiptFile).filter_by(file_name=file.filename).first()

    # Save or overwrite the file
    with open(filepath, "wb") as f:
        f.write(file.file.read())

    if existing:
        # Update existing record
        existing.file_path = filepath
        existing.updated_at = datetime.now()
        existing.is_valid = True
        existing.invalid_reason = None
        existing.is_processed = False
        db.commit()
        db.refresh(existing)
        return {"message": "File re-uploaded and record updated", "id": existing.id}
    else:
        # Create new record
        new_file = models.ReceiptFile(
            file_name=file.filename,
            file_path=filepath,
            is_valid=True,
            is_processed=False,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        db.add(new_file)
        db.commit()
        db.refresh(new_file)
        return {"message": "File uploaded successfully", "id": new_file.id}

@app.get("/validate")
def validate_file(id: int, db: Session = Depends(get_db)):
    receipt = db.query(models.ReceiptFile).get(id)
    if not receipt:
        raise HTTPException(status_code=404, detail="File not found")
    valid = utils.is_valid_pdf(receipt.file_path)
    receipt.is_valid = valid
    receipt.invalid_reason = None if valid else "Corrupted or invalid PDF"
    receipt.updated_at = datetime.now()
    db.commit()
    return {"isValid": valid}

@app.post("/process")
def process_receipt(id: int, db: Session = Depends(get_db)):
    file = db.query(models.ReceiptFile).get(id)
    if not file or not file.is_valid:
        raise HTTPException(status_code=400, detail="File invalid or not found.")
    if file.is_processed:
        return {"message": "Processing Complete"}
    data = ocr.extract_receipt_details(file.file_path)
    receipt = models.Receipt(
        purchased_at=data["purchased_at"],
        merchant_name=data["merchant_name"],
        total_amount=data["total_amount"],
        file_path=file.file_path,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    file.is_processed = True
    db.add(receipt)
    db.commit()
    return {"message": "Processing complete", "receipt_id": id}

@app.get("/receipts")
def list_receipts(db: Session = Depends(get_db)):
    return db.query(models.Receipt).all()

@app.get("/receipt-files")
def list_receipts(db: Session = Depends(get_db)):
    return db.query(models.ReceiptFile).all()

@app.get("/receipts/{id}")
def get_receipt(id: int, db: Session = Depends(get_db)):
    receipt = db.query(models.Receipt).get(id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt
