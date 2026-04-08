"""
Lightweight document text extractor for bid document analysis.
Supports: PDF (via pypdf), Excel (via openpyxl/csv), and plain-text files.
Falls back gracefully so the caller always receives a string.
"""

import os
import re
import json


def _extract_xlsx(file_path: str, max_chars: int) -> str:
    """Extract text from an Excel .xlsx or .xls file."""
    try:
        import openpyxl  # type: ignore
        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
        rows = []
        for sheet in wb.worksheets:
            rows.append(f"[Sheet: {sheet.title}]")
            for row in sheet.iter_rows(values_only=True):
                # Skip completely empty rows
                if any(cell is not None for cell in row):
                    rows.append("\t".join(str(c) if c is not None else "" for c in row))
                if sum(len(r) for r in rows) >= max_chars:
                    break
        wb.close()
        return "\n".join(rows)[:max_chars]
    except ImportError:
        pass
    except Exception as e:
        print(f"[pdf_extractor] openpyxl failed for '{os.path.basename(file_path)}': {e}")

    # Fallback: try xlrd for .xls
    try:
        import xlrd  # type: ignore
        wb = xlrd.open_workbook(file_path)
        rows = []
        for sheet in wb.sheets():
            rows.append(f"[Sheet: {sheet.name}]")
            for rx in range(sheet.nrows):
                rows.append("\t".join(str(sheet.cell_value(rx, cx)) for cx in range(sheet.ncols)))
                if sum(len(r) for r in rows) >= max_chars:
                    break
        return "\n".join(rows)[:max_chars]
    except ImportError:
        pass
    except Exception as e:
        print(f"[pdf_extractor] xlrd failed for '{os.path.basename(file_path)}': {e}")

    return ""


def _extract_csv(file_path: str, max_chars: int) -> str:
    """Extract text from a CSV file."""
    try:
        import csv
        rows = []
        with open(file_path, newline="", encoding="utf-8", errors="ignore") as f:
            reader = csv.reader(f)
            for row in reader:
                rows.append(", ".join(row))
                if sum(len(r) for r in rows) >= max_chars:
                    break
        return "\n".join(rows)[:max_chars]
    except Exception as e:
        print(f"[pdf_extractor] CSV read failed for '{os.path.basename(file_path)}': {e}")
    return ""


def _extract_docx(file_path: str, max_chars: int) -> str:
    """Extract text from a Word .docx file."""
    try:
        from docx import Document  # type: ignore
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text[:max_chars]
    except ImportError:
        pass
    except Exception as e:
        print(f"[pdf_extractor] python-docx failed for '{os.path.basename(file_path)}': {e}")
    return ""


def extract_text_from_pdf(file_path: str, max_chars: int = 8000) -> str:
    """
    Extract plain text from a document (PDF, Excel, CSV, or plain text).

    Args:
        file_path: Absolute or relative path to the file.
        max_chars:  Maximum characters to return (keeps AI prompt size small).

    Returns:
        Extracted text string, or empty string on failure.
    """
    if not file_path or not os.path.exists(file_path):
        return ""

    fname = os.path.basename(file_path)
    ext = os.path.splitext(fname)[1].lower()

    # ── Excel files ──────────────────────────────────────────────────────────
    if ext in (".xlsx", ".xls", ".xlsm", ".xlsb"):
        text = _extract_xlsx(file_path, max_chars)
        if text.strip():
            print(f"[pdf_extractor] Extracted Excel: '{fname}' ({len(text)} chars)")
            return text
        print(f"[pdf_extractor] ⚠ Could not extract text from Excel '{fname}'.")
        return ""

    # ── Word files ───────────────────────────────────────────────────────────
    if ext in (".docx", ".doc"):
        text = _extract_docx(file_path, max_chars)
        if text.strip():
            print(f"[pdf_extractor] Extracted Word: '{fname}' ({len(text)} chars)")
            return text

    # ── CSV files ─────────────────────────────────────────────────────────────
    if ext in (".csv", ".tsv"):
        text = _extract_csv(file_path, max_chars)
        if text.strip():
            print(f"[pdf_extractor] Extracted CSV: '{fname}' ({len(text)} chars)")
            return text
        print(f"[pdf_extractor] ⚠ Could not extract text from CSV '{fname}'.")
        return ""

    # ── PDF files ─────────────────────────────────────────────────────────────
    text = ""

    # PRIMARY: pypdf (pure Python, lightweight)
    try:
        from pypdf import PdfReader  # type: ignore
        reader = PdfReader(file_path)
        for page in reader.pages:
            page_text = page.extract_text() or ""
            text += page_text
            if len(text) >= max_chars:
                break
        if text.strip():
            return text[:max_chars]
    except ImportError:
        pass
    except Exception as e:
        print(f"[pdf_extractor] pypdf failed for '{fname}': {e}")

    # FALLBACK 1: PyPDF2
    if not text.strip():
        try:
            import PyPDF2  # type: ignore
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() or ""
                    if len(text) >= max_chars:
                        break
            if text.strip():
                return text[:max_chars]
        except ImportError:
            pass
        except Exception as e:
            print(f"[pdf_extractor] PyPDF2 failed for '{fname}': {e}")

    # FALLBACK 3: OCR (for scanned documents)
    if not text.strip():
        try:
            import pdfplumber
            import pytesseract
            from PIL import Image
            
            # Point to Tesseract binary
            pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
            
            print(f"[pdf_extractor] ℹ Scanned PDF detected. Attempting OCR on '{fname}'...")
            ocr_text = ""
            with pdfplumber.open(file_path) as pdf:
                # Limit to first 3 pages for speed/tokens
                pages_to_ocr = pdf.pages[:3]
                for i, page in enumerate(pages_to_ocr):
                    # Convert page to image
                    im = page.to_image(resolution=150).original
                    # Run OCR
                    page_ocr = pytesseract.image_to_string(im)
                    ocr_text += f"\n[OCR Page {i+1}]\n" + page_ocr
                    if len(ocr_text) >= max_chars:
                        break
            
            if ocr_text.strip():
                print(f"[pdf_extractor] OCR Success: Extracted {len(ocr_text)} chars from {len(pages_to_ocr)} pages.")
                return ocr_text[:max_chars]
        except Exception as e:
            print(f"[pdf_extractor] OCR failed for '{fname}': {e}")

    print(f"[pdf_extractor] ⚠ Could not extract text from '{fname}'. AI will use defaults.")
    return ""



def extract_bid_data_pythonic(tech_text: str, fin_text: str, tender_name: str) -> dict:
    """
    Extract bid metadata using pure Python (regex/string logic) without AI.
    Used as an efficient, deterministic alternative to LLM extraction.
    """
    text = (tech_text + "\n" + fin_text).lower()
    
    # 1. GST Detection
    gst_pattern = r"\d{2}[a-z]{5}\d{4}[a-z]{1}[a-z\d]{1}[z]{1}[a-z\d]{1}"
    gst_found = bool(re.search(gst_pattern, text))
    
    # 2. PAN Detection
    pan_pattern = r"[a-z]{5}\d{4}[a-z]{1}"
    pan_found = bool(re.search(pan_pattern, text))

    # 3. Experience Years
    # Look for "X years", "experience of X", etc.
    exp_years = 0
    exp_match = re.search(r"(\d+)\+?\s*years?\s*(?:of\s*)?experience", text)
    if exp_match:
        exp_years = int(exp_match.group(1))
    else:
        # Fallback: look for just a number near "experience"
        exp_match = re.search(r"experience.*?(\d+)", text)
        if exp_match:
            exp_years = int(exp_match.group(1))

    # 4. Turnover (in Crores)
    # Look for "turnover", "cr", "crore"
    turnover = 0.0
    turnover_match = re.search(r"(?:turnover|revenue).*?(\d+(?:\.\d+)?)\s*(?:cr|crore)", text)
    if turnover_match:
        turnover = float(turnover_match.group(1))
    else:
        # Try generic number search near turnover
        turnover_match = re.search(r"turnover.*?(\d+(?:\.\d+)?)", text)
        if turnover_match:
            turnover = float(turnover_match.group(1))

    # 5. Financial Bid (Total Price)
    # Look for the financial bid in the fin_text specifically
    total_price = 0.0
    fin_text_low = fin_text.lower()
    # Patterns for price: "total: 500", "price is 500", "amount 500"
    price_match = re.search(r"(?:total|amount|price|quote|rate).*?(\d+(?:,\d+)*(?:\.\d+)?)", fin_text_low)
    if price_match:
        # Clean commas/formatting
        price_str = price_match.group(1).replace(",", "")
        try:
            total_price = float(price_str)
        except ValueError:
            pass

    # 6. Certifications
    certs = []
    if "iso" in text: certs.append("ISO")
    if "msme" in text: certs.append("MSME")
    if "nsic" in text: certs.append("NSIC")
    if "start-up" in text or "startup" in text: certs.append("Startup")

    # 7. Document Presence
    docs = {
        "pan": pan_found,
        "gst": gst_found,
        "experience_cert": exp_years > 0,
        "iso_cert": "ISO" in certs,
        "pbg_declaration": "pbg" in text or "performance bank guarantee" in text
    }

    # 8. Specs Compliance (Simplified logic: look for "comply" or "compliant")
    # For a real implementation, you'd match tender specs against text.
    # Here we assume a high default if keywords are found.
    specs_compliance = [{"spec": "General Technical Requirements", "compliant": True}]
    if "non-compliant" in text or "deviation" in text:
        specs_compliance.append({"spec": "Deviations Noted", "compliant": False})

    return {
        "gst_found": gst_found,
        "experience_years": exp_years if exp_years < 50 else 5, # Sanity check
        "turnover_cr": turnover if turnover < 10000 else 10.0,
        "certifications": certs,
        "projects_count": max(exp_years // 2, 1), # Heuristic
        "specs_compliance": specs_compliance,
        "documents_present": docs,
        "total_price": total_price,
        "missing_docs": [k for k, v in docs.items() if not v],
        "risk_flags": ["Low turnover"] if turnover < 1.0 and turnover > 0 else [],
        "is_fraud": False, # Deterministic check: fraud usually requires AI logic
        "confidence_score": 92.5 if total_price > 0 and gst_found else 75.0,
        "justification": "Evaluation based on automated document regex matching for GST and financial values."
    }

