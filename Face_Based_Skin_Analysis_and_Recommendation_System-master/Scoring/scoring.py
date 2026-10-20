def normalize(value, min_v, max_v):
    value = max(min(value, max_v), min_v)
    return int((value - min_v) / (max_v - min_v) * 10)


def calculate_scores(brightness, redness, texture):
    return {
        "brightness": normalize(brightness, 50, 200),
        "redness": normalize(redness, 100, 200),
        "texture": normalize(texture, 50, 500)
    }
