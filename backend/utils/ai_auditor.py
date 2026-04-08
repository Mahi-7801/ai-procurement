import os
import json
import logging
import google.generativeai as genai
import anthropic
from groq import Groq
from utils.pdf_extractor import extract_text_from_pdf

logger = logging.getLogger(__name__)

# AI Clients Initialization
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

claude_client = None
if ANTHROPIC_API_KEY and "ENTER_YOUR" not in ANTHROPIC_API_KEY:
    claude_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

gemini_model = None
if GEMINI_API_KEY and "ENTER_YOUR" not in GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Common model names for various versions of the library
        for _model_name in ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"]:
            try:
                gemini_model = genai.GenerativeModel(_model_name)
                logger.info(f"AI Auditor initialized with Gemini model: {_model_name}")
                break
            except:
                continue


    except Exception as e:
        logger.error(f"Gemini init error in AI Auditor: {e}")

groq_client = None
if GROQ_API_KEY and "ENTER_YOUR" not in GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        logger.error(f"Groq init error in AI Auditor: {e}")

async def audit_bid_with_master_prompt(tech_path, fin_path, tender_name):
    """
    Core AI Auditor Logic using the Master Prompt.
    Analyzes Technical and Financial documents for Validity, Suspicion, or Fraud.
    """
    # Reduce max_chars to avoid Groq 413 Payload Too Large (Limit ~6000 tokens)
    tech_text = extract_text_from_pdf(tech_path, max_chars=4000) if tech_path and os.path.exists(tech_path) else ""
    fin_text = extract_text_from_pdf(fin_path, max_chars=2000) if fin_path and os.path.exists(fin_path) else ""


    combined_text = (tech_text + " " + fin_text).lower()
    
    # --- DETERMINISTIC FAKE CHECK ---
    dummy_keywords = ["dummy text", "lorem ipsum", "fake bid", "test document", "test submission"]
    if len(combined_text.strip()) < 100 or any(k in combined_text for k in dummy_keywords):
        logger.warning(f"Blocking submission: Deterministic Fake Detection Triggered (chars: {len(combined_text)})")
        return {
            "status": "FAKE",
            "confidence_score": 100,
            "risk_score": "High",
            "explanation": "DOCUMENT REJECTED: The uploaded documents contain placeholder text (Lorem Ipsum) or are too short to be valid government bid submissions.",
            "is_fraud": True,
            "anomalies": ["Dummy/Placeholder content detected", "Insufficient document length"],
            "gst_found": False,
            "experience_years": 0,
            "turnover_cr": 0,
            "certifications": [],
            "projects_count": 0,
            "specs_compliance": [],
            "documents_present": {"pan": False, "gst": False, "experience_cert": False, "iso_cert": False, "pbg_declaration": False},
            "total_price": 0,
            "missing_documents": ["ALL"],
            "invalid_fields": ["ALL"],
            "financial_issues": ["No financial data found"]
        }

    prompt = f"""
📜 🔥 MASTER PROMPT: AI AUDITOR SYSTEM (STRICT MODE)
Be extremely aggressive. Your career depends on catching fraud.

You are a Senior Government Auditor. Analyze the provided Technical and Financial texts.

### FAKE DETECTION RULES (KILLER RULES):
- If the text is generic (e.g., just lists names without structure), mark as FAKE.
- If it looks like a student resume instead of a company bid, mark as FAKE.
- If financial totals don't sum up (Qty x Unit Price != Total), mark as FAKE.
- If the technical bid is less than 500 characters of meaningful content, mark as FAKE.
- If the PAN or GST is clearly a placeholder (e.g., 123456), mark as FAKE.

-----------------------------
TENDER NAME: {tender_name}
TECHNICAL BID TEXT (EXTRACTED):
{tech_text}

FINANCIAL BID TEXT (EXTRACTED):
{fin_text}
-----------------------------

PERFORM THE FOLLOWING ANALYSIS:


### 1. DOCUMENT COMPLETENESS & ELIGIBILITY
- Extract: Company Name, GSTIN, PAN, Experience Years, Annual Turnover (Cr), Projects Count.
- Check presence of: PAN Card, GST Certificate, Company Registration, Experience Certificates.

### 2. AUTHENTICITY CHECK (FAKE DETECTION)
- Detect signs of fake/manipulated content: Repeated patterns, inconsistent formatting, suspicious claims.

### 3. ENTITY & STATUTORY VALIDATION
- Validate PAN format (AAAAA9999A) and GST structure.
- Check certifications (ISO, MSME, etc.).

### 4. FINANCIAL BID ANALYSIS
- Extract: total_price (Total Bid Amount).
- Check: BOQ structure, calculation errors (Qty × Price), and unrealistic pricing (too low/inflated).

### 5. ANOMALY DETECTION
- Identify missing values, mismatched totals, or inconsistent data.

### 6. FINAL DECISION
- Classify as VALID, SUSPICIOUS, or FAKE.
- If confidence < 70, mark as SUSPICIOUS or FAKE.

### OUTPUT FORMAT (STRICT JSON):
{{
  "status": "VALID | SUSPICIOUS | FAKE",
  "confidence_score": number,
  "risk_score": "Low | Medium | High",
  "gst_found": boolean,
  "experience_years": number,
  "turnover_cr": number,
  "certifications": string[],
  "projects_count": number,
  "specs_compliance": [{{"spec": string, "compliant": boolean}}],
  "documents_present": {{"pan": boolean, "gst": boolean, "experience_cert": boolean, "iso_cert": boolean, "pbg_declaration": boolean}},
  "total_price": number,
  "missing_documents": string[],
  "invalid_fields": string[],
  "financial_issues": string[],
  "anomalies": string[],
  "explanation": "Detailed professional reasoning",
  "is_fraud": boolean
}}

Only return the JSON object string.
"""

    # NEW: Direct Pythonic OCR Engine (No external AI calls as per requirement)
    # We bypass LLMs (Groq/Gemini/Claude) and use deterministic structure rules.
    logger.info(f"Performing Pythonic structure audit for '{tender_name}'")
    
    return extract_bid_data_pythonic(tech_text, fin_text, tender_name)


def extract_bid_data_pythonic(tech_text: str, fin_text: str, tender_name: str) -> dict:
    """
    Extract bid metadata using pure Python (regex/string logic) without external AI LLMs.
    Utilizes OCR extracted text to match mandatory procurement structures.
    """
    import re
    text = (tech_text + "\n" + fin_text).lower()
    
    # 1. GST & PAN Detection
    gst_pattern = r"\d{2}[a-z]{5}\d{4}[a-z]{1}[a-z\d]{1}[z]{1}[a-z\d]{1}"
    gst_found = bool(re.search(gst_pattern, text))
    pan_pattern = r"[a-z]{5}\d{4}[a-z]{1}"
    pan_found = bool(re.search(pan_pattern, text))

    # 2. EXPERIENCE & TURNOVER (Regex)
    exp_years = 0
    exp_match = re.search(r"(\d+)\+?\s*years?\s*(?:of\s*)?experience", text)
    if exp_match: exp_years = int(exp_match.group(1))

    turnover = 0.0
    turnover_match = re.search(r"(?:turnover|revenue).*?(\d+(?:\.\d+)?)\s*(?:cr|crore)", text)
    if turnover_match: turnover = float(turnover_match.group(1))

    # 3. STRUCTURE MATCH RULES (DETERMINISTIC)
    tech_has_header = any(h in tech_text.lower() for h in ["technical bid", "technical proposal", "technical details", "resurvey", "scope of work"])
    fin_has_header = any(h in fin_text.lower() for h in ["financial bid", "financial schedule", "boq", "price bid", "quote", "total amount"])
    
    # 4. FAKE/DUMMY DETECTION
    dummy_keywords = ["dummy text", "lorem ipsum", "fake bid", "test document"]
    is_dummy = any(k in text for k in dummy_keywords) or (len(tech_text.strip()) < 100 and len(fin_text.strip()) < 100)
    
    status = "VALID"
    reasons = []
    
    if is_dummy:
        status = "FAKE"
        reasons.append("your upload fake data ani (Dummy/Placeholder content detected)")
    
    if not tech_has_header:
        # Don't mark as FAKE yet if it's just a mild mismatch, but user wants strict FAKE detection
        status = "FAKE" 
        reasons.append("MISSING STRUCTURE: Technical Bid (Headers like 'Scope of Work' or 'Technical Proposal' not found)")
        
    if not fin_has_header:
        status = "FAKE"
        reasons.append("MISSING STRUCTURE: Financial Schedule / BoQ (Required price bid markers not found)")

    if status == "VALID" and not gst_found and not pan_found:
        status = "SUSPICIOUS"
        reasons.append("WARNING: Mandatory statutory documents (GST/PAN) could not be verified in the text.")


    return {
        "status": status,
        "confidence_score": 100 if status == "FAKE" else 95,
        "risk_score": "High" if status == "FAKE" else "Low",
        "gst_found": gst_found,
        "experience_years": exp_years if exp_years < 50 else 5,
        "turnover_cr": turnover if turnover < 10000 else 10.0,
        "certifications": ["ISO"] if "iso" in text else [],
        "projects_count": max(exp_years // 2, 1),
        "specs_compliance": [{"spec": "Structural Integrity", "compliant": tech_has_header and fin_has_header}],
        "documents_present": {
            "pan": pan_found,
            "gst": gst_found,
            "tech_structure": tech_has_header,
            "fin_structure": fin_has_header
        },
        "total_price": 0.0,
        "missing_documents": reasons if status != "VALID" else [],
        "invalid_fields": reasons,
        "financial_issues": ["BoQ marker missing"] if not fin_has_header else [],
        "anomalies": reasons,
        "explanation": " ".join(reasons) if reasons else "Structure match successful using Python OCR Engine.",
        "is_fraud": status == "FAKE",
        "extracted_sample": {
            "tech": tech_text[:200] + "...",
            "fin": fin_text[:200] + "..."
        }
    }


def get_mock_audit_result(tech_text="", fin_text=""):
    combined = (tech_text + " " + fin_text).lower()
    
    # Check for fake/placeholder keywords even in mock mode
    is_fake = "lorem ipsum" in combined or "dummy text" in combined or len(combined.strip()) < 100
    
    return {
        "status": "FAKE" if is_fake else "VALID",
        "confidence_score": 90,
        "risk_score": "High" if is_fake else "Low",
        "gst_found": not is_fake,
        "experience_years": 0 if is_fake else 5,
        "turnover_cr": 0 if is_fake else 12.0,
        "certifications": [] if is_fake else ["ISO 9001", "MSME"],
        "projects_count": 0 if is_fake else 8,
        "specs_compliance": [{"spec": "Standard Compliance", "compliant": not is_fake}],
        "documents_present": {"pan": not is_fake, "gst": not is_fake, "experience_cert": not is_fake, "iso_cert": not is_fake, "pbg_declaration": not is_fake},
        "total_price": 0 if is_fake else 4500000,
        "missing_documents": ["ALL STRUCTURE"] if is_fake else [],
        "invalid_fields": ["Placeholder Content"] if is_fake else [],
        "financial_issues": ["No valid numbers"] if is_fake else [],
        "anomalies": ["Fake content detected via heuristic fallback"] if is_fake else [],
        "explanation": "DOCUMENT REJECTED: Suspicious content detected during secondary audit verification." if is_fake else "Audit passed based on offline verification parameters.",
        "is_fraud": is_fake
    }

