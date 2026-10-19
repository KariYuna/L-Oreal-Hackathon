PRODUCT_DB = {
    0: ["Maintain routine"],
    3: ["Gentle cleanser", "Hydrating gel"],
    5: ["Anti-acne facewash", "Niacinamide serum"],
    7: ["Dermatologist consultation", "Prescription care"]
}

def recommend_products(redness_score):
    for threshold in sorted(PRODUCT_DB.keys(), reverse=True):
        if redness_score >= threshold:
            return PRODUCT_DB[threshold]
    return ["Basic skincare"]
