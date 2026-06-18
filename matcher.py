"""
CertiGuard Fuzzy Matching Engine
=================================
Ported from FakeCertificateDetector with enhancements.
Provides intelligent text matching for certificate verification,
handling OCR inaccuracies and formatting variations.
"""

import re

def normalize_text(text):
    """Normalize text for comparison: lowercase, strip special chars, collapse whitespace."""
    if not text:
        return ""
    text = re.sub(r'[^a-z0-9\s]', ' ', text.lower())
    return re.sub(r'\s+', ' ', text).strip()


def is_text_in_document(official_text, norm_doc):
    """
    Check if all significant words from official_text exist in norm_doc.
    Works on normalized text (run normalize_text on both first).
    """
    if not official_text:
        return False

    exact_clean = normalize_text(official_text)
    if exact_clean in norm_doc:
        return True

    words = exact_clean.split()
    clean_words = [w for w in words if len(w) > 2]
    if not clean_words:
        return False

    doc_words = norm_doc.split()
    for word in clean_words:
        if word not in doc_words:
            return False
    return True


def fuzzy_matcher(official_text, document_text, threshold=80):
    """
    Use thefuzz partial_ratio for flexible string matching.
    Ideal for OCR-extracted text with minor errors.
    """
    if not official_text:
        return False
    try:
        from thefuzz import fuzz
    except ImportError:
        # Fallback to basic matching if thefuzz not installed
        return normalize_text(official_text) in normalize_text(document_text)

    clean_official = re.sub(r'[^a-z0-9\s]', ' ', official_text.lower()).strip()
    clean_doc = re.sub(r'[^a-z0-9\s]', ' ', document_text.lower()).strip()
    match_score = fuzz.partial_ratio(clean_official, clean_doc)
    print(f"[MATCHER] Fuzzy score for '{official_text[:50]}': {match_score}%")
    return match_score >= threshold


def smart_match(official_text, document_text, is_ocr_used, threshold=80):
    """
    Intelligent matching that adapts strategy based on extraction method.
    - OCR text: uses fuzzy matching (more tolerant)
    - Native PDF text: uses strict word-by-word matching
    """
    if not official_text:
        return False

    if is_ocr_used:
        print(f"[MATCHER] Fuzzy mode (OCR) for: {official_text[:50]}")
        return fuzzy_matcher(official_text, document_text, threshold)
    else:
        print(f"[MATCHER] Strict mode (native PDF) for: {official_text[:50]}")
        norm_doc = normalize_text(document_text)
        return is_text_in_document(official_text, norm_doc)


def check_date_match(official_date_str, document_text):
    """
    Check if an official date appears in the document in any common format.
    Handles ±1 day tolerance for timezone edge cases.
    """
    try:
        from datetime import datetime, timedelta

        dt = datetime.strptime(official_date_str, "%B %d, %Y")
        dates_to_check = [dt, dt - timedelta(days=1), dt + timedelta(days=1)]
        doc_norm = document_text.lower()

        for d in dates_to_check:
            m_pad = f"{d.month:02d}"
            m_nopad = str(d.month)
            d_pad = f"{d.day:02d}"
            d_nopad = str(d.day)
            y = str(d.year)

            formats = [
                f"{m_pad}/{d_pad}/{y}",
                f"{m_nopad}/{d_nopad}/{y}",
                f"{d_pad}/{m_pad}/{y}",
                f"{d_nopad}/{m_nopad}/{y}",
                f"{y}-{m_pad}-{d_pad}",
                d.strftime("%B %d, %Y").lower(),
                d.strftime("%b %d, %Y").lower(),
                d.strftime("%B %d %Y").lower(),
                d.strftime("%d %B %Y").lower(),
            ]

            for f in formats:
                if f in doc_norm:
                    print(f"[MATCHER] Date match confirmed via format: {f}")
                    return True

        # Final fallback: normalized exact string
        if normalize_text(official_date_str) in normalize_text(document_text):
            print("[MATCHER] Date match confirmed via normalized string")
            return True

    except Exception as e:
        print(f"[MATCHER] Date processing error: {e}")

    print("[MATCHER] Date check FAILED - no format matched")
    return False
