import json, pathlib

_RULES = json.loads((pathlib.Path(__file__).parent / "styles.json").read_text())

def recommend(style):
    rule = _RULES.get(style)
    if not rule:
        return []
    return [{"category": c, "styleTags": [style], "colorHint": rule["palette"][0]}
            for c in rule["categories"]]