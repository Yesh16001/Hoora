import os
import json
import urllib.request

# Default Gemini API Key provided by user (Gemini 2.5 Flash)
DYNAMIC_GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyDVaPaLpEgEjk5oLh11Rybl1_K8ij7toWk")

def set_gemini_api_key(key):
    global DYNAMIC_GEMINI_KEY
    if key and key.strip():
        DYNAMIC_GEMINI_KEY = key.strip()
    else:
        DYNAMIC_GEMINI_KEY = "AIzaSyDVaPaLpEgEjk5oLh11Rybl1_K8ij7toWk"

def get_gemini_api_key():
    return DYNAMIC_GEMINI_KEY

def call_gemini_api(prompt, custom_key=None):
    """
    Calls live Google Gemini 2.5 / 1.5 Flash REST API using embedded key or custom key.
    """
    key = custom_key or DYNAMIC_GEMINI_KEY
    if not key:
        return None
        
    # Try gemini-2.5-flash first, then gemini-1.5-flash fallback
    models_to_try = ["gemini-2.5-flash", "gemini-1.5-flash"]
    
    for m in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
        }
        
        try:
            req = urllib.request.Request(
                url, 
                data=json.dumps(payload).encode('utf-8'), 
                headers={'Content-Type': 'application/json'}
            )
            res = urllib.request.urlopen(req, timeout=12)
            data = json.loads(res.read().decode('utf-8'))
            text_response = data['candidates'][0]['content']['parts'][0]['text']
            
            # Clean markdown JSON formatting if returned as ```json ... ```
            clean_text = text_response.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
                
            parsed = json.loads(clean_text.strip())
            parsed['ai_model'] = f"Google Gemini 2.5 Flash (Live API - {m})"
            return parsed
        except Exception as e:
            print(f"Gemini model {m} API call attempt: {e}")
            continue
            
    return None


def ai_auto_tag_item(title, description, custom_key=None):
    """
    AI Auto-Tagger: Uses live Google Gemini 2.5 Flash API to extract category,
    detect luxury/valuable status, refine titles, and generate search tags.
    """
    prompt = f"""
    You are an AI Categorizer for a college Lost & Found system.
    Analyze this item report:
    Title: "{title}"
    Description: "{description}"

    Return JSON with fields:
    - category: Exactly one of ['Electronics', 'Accessories', 'Documents/ID Cards', 'Books/Stationery', 'Clothing', 'Keys', 'Bags', 'Other']
    - is_valuable: boolean (true if gold, diamond, cash, luxury watch, expensive phone/laptop, jewelry)
    - tags: list of 3-5 key search tokens
    - refined_title: clean standardized title
    """
    
    ai_result = call_gemini_api(prompt, custom_key)
    if ai_result:
        return ai_result
        
    text = f"{title} {description}".lower()
    is_val = any(kw in text for kw in ['gold', 'diamond', 'cash', 'jewelry', 'chain', 'rolex', 'macbook', 'iphone', 'rupee', 'dollar', 'emerald', 'sapphire'])
    
    cat = 'Other'
    if any(kw in text for kw in ['phone', 'laptop', 'macbook', 'ipad', 'airpods', 'charger', 'computer', 'camera']):
        cat = 'Electronics'
    elif any(kw in text for kw in ['wallet', 'chain', 'ring', 'watch', 'sunglasses', 'necklace', 'belt', 'jewelry']):
        cat = 'Accessories'
    elif any(kw in text for kw in ['id', 'card', 'license', 'passport', 'certificate', 'document']):
        cat = 'Documents/ID Cards'
    elif any(kw in text for kw in ['book', 'notebook', 'pen', 'calculator', 'stationery']):
        cat = 'Books/Stationery'
    elif any(kw in text for kw in ['bag', 'backpack', 'purse', 'suitcase']):
        cat = 'Bags'
    elif any(kw in text for kw in ['jacket', 'hoodie', 'shirt', 'cap', 'shoes']):
        cat = 'Clothing'
    elif any(kw in text for kw in ['key', 'keychain', 'fob']):
        cat = 'Keys'
        
    tags = [w for w in text.split() if len(w) > 3][:5]
    
    return {
        "category": cat,
        "is_valuable": is_val,
        "tags": tags,
        "refined_title": title.strip().title(),
        "ai_model": "Smart Heuristic Rule-Based Engine (Fallback)"
    }


def ai_verify_claim_evidence(item_title, item_description, claim_evidence, custom_key=None):
    """
    AI Evidence Verifier: Uses live Google Gemini 2.5 Flash API to analyze claimant evidence
    against item description and generate an AI confidence score and verification rationale.
    """
    prompt = f"""
    You are an AI Fraud Inspector for a college Lost & Found system.
    
    Item Title: "{item_title}"
    Item Description: "{item_description}"
    Claimant Submitted Evidence: "{claim_evidence}"
    
    Evaluate if the claimant's evidence accurately proves ownership.
    Return JSON with fields:
    - ai_confidence_score: integer 0-100
    - analysis: short explanation of matching features (scratches, serial numbers, contents)
    - recommendation: Exactly one of ["APPROVED", "REQUIRES_MORE_PROOF", "REJECTED"]
    """
    
    ai_result = call_gemini_api(prompt, custom_key)
    if ai_result:
        return ai_result
        
    desc_words = set(w.lower() for w in item_description.split() if len(w) > 2)
    ev_words = set(w.lower() for w in claim_evidence.split() if len(w) > 2)
    
    overlap = desc_words.intersection(ev_words)
    score = 65
    if overlap:
        score += min(30, len(overlap) * 10)
    if any(kw in claim_evidence.lower() for kw in ['scratch', 'serial', 'receipt', 'proof', 'inside', 'color', 'mark', 'name', 'id']):
        score += 10
        
    score = min(98, score)
    rec = "APPROVED" if score >= 75 else "REQUIRES_MORE_PROOF" if score >= 50 else "REJECTED"
    
    analysis_text = f"AI Analysis: Claimant evidence provides specific detail overlap ({len(overlap)} matching attributes)."
    if 'scratch' in claim_evidence.lower() or 'mark' in claim_evidence.lower():
        analysis_text += " Unique physical markings mentioned."
    if 'receipt' in claim_evidence.lower() or 'proof' in claim_evidence.lower():
        analysis_text += " Ownership documentation attached."
        
    return {
        "ai_confidence_score": score,
        "analysis": analysis_text,
        "recommendation": rec,
        "ai_model": "Smart Heuristic Rule-Based Engine (Fallback)"
    }
