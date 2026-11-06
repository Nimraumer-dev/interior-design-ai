def _fit(img):
    img = img.convert("RGB")
    w, h = img.size
    s = MAX_SIDE / max(w, h)
    if s < 1:
        w, h = int(w * s), int(h * s)
    w = max(64, (w // 64) * 64)
    h = max(64, (h // 64) * 64)
    return img.resize((w, h))