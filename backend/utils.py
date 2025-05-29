import fitz  # PyMuPDF

def is_valid_pdf(filepath: str) -> bool:
    try:
        doc = fitz.open(filepath)
        return True if doc.page_count > 0 else False
    except Exception:
        return False
