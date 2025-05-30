from pdf2image import convert_from_path
import pytesseract
import re
from datetime import datetime

def extract_merchant_name(text: str) -> str:
    # Clean and split into lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    candidate_lines = lines[:10]  # Only consider top 10 lines

    # Keywords that likely mean it's not the merchant
    skip_keywords = ['DATE', 'INVOICE', 'TOTAL', 'CHARGE', 'FEE', 'BALANCE', 'AMOUNT']

    for line in candidate_lines:
        # Must not contain skip keywords
        if any(skip_word in line.upper() for skip_word in skip_keywords):
            continue

        # Prefer uppercase or title-cased lines that are short
        if line.isupper() or line.istitle():
            if 3 < len(line) < 40:
                return line.replace('*', '').strip()

    # Fallback: take first non-skipped line
    for line in candidate_lines:
        if any(skip_word in line.upper() for skip_word in skip_keywords):
            continue
        return line.strip()

    return "Unknown"


def extract_receipt_details(pdf_path: str) -> dict:
    images = convert_from_path(pdf_path)
    text = ""
    for img in images:
        text += pytesseract.image_to_string(img)

    merchant_name = extract_merchant_name(text)

    # Extract total amount (simple pattern for $ or ₹)
    amounts = re.findall(r'[\$]?\s*([\d,]+\.\d{2})', text)
    amounts = [float(a.replace(',', '')) for a in amounts]
    total_amount = max(amounts) if amounts else 0.0

    # Extract purchase date (flexible formats)
    date_patterns = [
        r'(\d{1,2}/\d{1,2}/\d{2,4})',  # e.g., 12/05/2024
        r'(\d{4}-\d{2}-\d{2})',        # e.g., 2024-05-12
    ]
    purchased_at = None
    for pattern in date_patterns:
        date_match = re.search(pattern, text)
        if date_match:
            try:
                purchased_at = datetime.strptime(date_match.group(1), "%d/%m/%Y")
            except:
                try:
                    purchased_at = datetime.strptime(date_match.group(1), "%Y-%m-%d")
                except:
                    continue
            break

    # If no date matched, use now
    if not purchased_at:
        purchased_at = datetime.now()

    return {
        "merchant_name": merchant_name,
        "total_amount": total_amount,
        "purchased_at": purchased_at
    }