from pydantic import BaseModel

class ReceiptFileCreate(BaseModel):
    file_name: str
    file_path: str

class ReceiptCreate(BaseModel):
    purchased_at: str
    merchant_name: str
    total_amount: float
    file_path: str


class ProcessRequest(BaseModel):
    id: int
