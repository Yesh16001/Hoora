import re
from datetime import datetime

STOP_WORDS = {
    'a', 'an', 'the', 'in', 'on', 'at', 'with', 'of', 'for', 'to', 'is', 'it', 
    'my', 'me', 'found', 'lost', 'item', 'left', 'near', 'by', 'was', 'and', 'or', 'has', 'small', 'new', 'old'
}

# Sub-Type Taxonomy for Object Disambiguation
OBJECT_GROUPS = {
    'PHONE': {'iphone', 'phone', 'mobile', 'smartphone', 'android', 'samsung', 'pixel', 'oneplus'},
    'LAPTOP': {'laptop', 'macbook', 'notebook', 'computer', 'pc', 'dell', 'hp', 'lenovo', 'thinkpad', 'ipad', 'tablet'},
    'AUDIO': {'airpods', 'headphones', 'earphones', 'headset', 'speaker', 'buds'},
    'WALLET': {'wallet', 'purse', 'cardholder', 'billfold'},
    'BAG': {'backpack', 'bag', 'rucksack', 'duffel', 'briefcase', 'handbag'},
    'WATCH': {'watch', 'smartwatch', 'iwatch', 'rolex', 'casio', 'titan'},
    'JEWELRY': {'gold', 'chain', 'necklace', 'ring', 'pendant', 'bracelet', 'diamond', 'silver'},
    'CALCULATOR': {'calculator', 'scientific', 'fx991ex', 'casio'}
}

def tokenize_text(text):
    if not text:
        return set()
    words = re.findall(r'\b[a-z0-9]+\b', text.lower())
    return {w for w in words if w not in STOP_WORDS and len(w) > 1}

def identify_object_groups(tokens):
    found_groups = set()
    for group_name, group_tokens in OBJECT_GROUPS.items():
        if tokens.intersection(group_tokens):
            found_groups.add(group_name)
    return found_groups

def calculate_match(item1, item2):
    """
    Compares two items (one LOST, one FOUND) using transparent rule-based logic
    with Object Sub-Type Disambiguation to prevent false positives (e.g. Phone vs Laptop).
    """
    reasons = []
    
    # 1. Category match (25 pts)
    cat1 = (item1.get('category') or '').strip().lower()
    cat2 = (item2.get('category') or '').strip().lower()
    cat_score = 0
    if cat1 and cat2 and cat1 == cat2:
        cat_score = 25
        reasons.append(f"✓ Same parent category ({item1.get('category')})")

    # 2. Location match (25 pts)
    loc1 = (item1.get('location') or '').strip().lower()
    loc2 = (item2.get('location') or '').strip().lower()
    loc_score = 0
    if loc1 and loc2:
        if loc1 == loc2:
            loc_score = 25
            reasons.append(f"✓ Same campus location ({item1.get('location')})")
        elif loc1 in loc2 or loc2 in loc1:
            loc_score = 15
            reasons.append(f"✓ Matching campus area ({item1.get('location')} / {item2.get('location')})")

    # 3. Date proximity (20 pts)
    date_score = 0
    try:
        d1 = datetime.strptime(item1.get('item_date', ''), '%Y-%m-%d')
        d2 = datetime.strptime(item2.get('item_date', ''), '%Y-%m-%d')
        diff_days = abs((d1 - d2).days)
        
        if diff_days == 0:
            date_score = 20
            reasons.append("✓ Reported on the exact same date")
        elif diff_days == 1:
            date_score = 15
            reasons.append("✓ Reported within 1 day of each other")
        elif diff_days == 2:
            date_score = 10
            reasons.append("✓ Reported within 2 days of each other")
        elif diff_days <= 4:
            date_score = 5
            reasons.append(f"✓ Reported within {diff_days} days of each other")
    except Exception:
        pass

    # 4. Keyword / Text similarity (30 pts)
    text1 = f"{item1.get('title', '')} {item1.get('description', '')}"
    text2 = f"{item2.get('title', '')} {item2.get('description', '')}"
    tokens1 = tokenize_text(text1)
    tokens2 = tokenize_text(text2)
    
    text_score = 0
    common_tokens = tokens1.intersection(tokens2)
    if tokens1 and tokens2 and common_tokens:
        overlap_ratio = len(common_tokens) / min(len(tokens1), len(tokens2))
        text_score = min(30, round(overlap_ratio * 30))
        keywords_str = ", ".join(sorted(list(common_tokens))[:5])
        reasons.append(f"✓ Similar keywords: {keywords_str}")

    # 5. Object Sub-Type Disambiguation (Crucial Fix for iPhone vs Laptop)
    groups1 = identify_object_groups(tokens1)
    groups2 = identify_object_groups(tokens2)
    
    object_penalty = 0
    sub_type_boost = 0
    
    if groups1 and groups2:
        # Check if they share any object group
        common_groups = groups1.intersection(groups2)
        if common_groups:
            sub_type_boost = 15
            group_names = ", ".join(list(common_groups)).capitalize()
            reasons.append(f"✓ Matching item sub-type ({group_names})")
        else:
            # Conflicting object types (e.g. PHONE vs LAPTOP)
            object_penalty = 35
            g1_str = "/".join(list(groups1))
            g2_str = "/".join(list(groups2))
            reasons.append(f"⚠️ Object mismatch penalty ({g1_str} vs {g2_str})")

    raw_score = cat_score + loc_score + date_score + text_score + sub_type_boost - object_penalty
    total_score = max(0, min(100, raw_score))
    
    return {
        'match_score': total_score,
        'breakdown': {
            'category_score': cat_score,
            'location_score': loc_score,
            'date_score': date_score,
            'keyword_score': text_score,
            'sub_type_boost': sub_type_boost,
            'object_penalty': object_penalty
        },
        'reasons': reasons
    }

def find_potential_matches(target_item, candidate_items, min_threshold=45):
    """
    Takes a target item (dict) and candidate items list (opposite type).
    Returns candidates ordered by match_score descending.
    """
    matches = []
    for cand in candidate_items:
        if cand['id'] == target_item['id']:
            continue
        
        if cand['item_type'].upper() == target_item['item_type'].upper():
            continue
            
        result = calculate_match(target_item, cand)
        if result['match_score'] >= min_threshold:
            matches.append({
                'item': cand,
                'match_score': result['match_score'],
                'breakdown': result['breakdown'],
                'reasons': result['reasons']
            })
            
    matches.sort(key=lambda x: x['match_score'], reverse=True)
    return matches
