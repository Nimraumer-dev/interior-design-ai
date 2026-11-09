from .config import NEGATIVE_PROMPT

STYLE_KEYWORDS = {
    "scandinavian": "light wood, white walls, cozy textiles, minimal decor, natural light",
    "industrial": "exposed brick, metal fixtures, dark tones, concrete, leather",
    "bohemian": "layered textiles, plants, rattan, warm colors, eclectic art",
    "minimalist": "clean lines, neutral palette, uncluttered surfaces",
    "modern": "glass, steel, smooth fabric, gray and white, bold accent",
    "traditional": "classic wooden furniture, warm tones, elegant details",
        "contemporary": "sleek lines, neutral tones, statement lighting, mixed materials, open space",
    "coastal": "white and sky blue palette, driftwood, linen, rattan, airy natural light",
}

def build_prompt(room_type, style, colors):
    room = room_type.replace("_", " ")
    kw = STYLE_KEYWORDS.get(style, "")
    color_part = f"Use {', '.join(colors)} color palette. " if colors else ""
    prompt = (f"Redesign this {room} in {style} interior design style. "
              f"Keep the room layout, walls, windows, doors and camera perspective unchanged. "
              f"{color_part}{kw}. "
              f"Photorealistic, professional interior photography, natural lighting, high detail.")
    return prompt, NEGATIVE_PROMPT