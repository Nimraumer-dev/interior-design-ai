import io, time, requests
from fastapi import FastAPI, Header
from fastapi.responses import JSONResponse
from PIL import Image

from .config import AI_SERVICE_TOKEN, MODEL_VERSION
from .schemas import RedesignRequest
from .prompts import build_prompt
from .palette import extract_palette
from .recommender import recommend
from .moderation import is_safe
from . import pipeline

app = FastAPI(title="Interior AI Service")

def err(code, msg, http):
    return JSONResponse(status_code=http,
                        content={"status": "error", "code": code, "message": msg})

@app.on_event("startup")
def startup():
    pipeline.load_model()

@app.get("/health")
def health():
    return {"status": "ok", "modelVersion": MODEL_VERSION}

@app.post("/redesign")
def redesign(req: RedesignRequest, authorization: str = Header(None)):
    if authorization != f"Bearer {AI_SERVICE_TOKEN}":
        return err("UNAUTHORIZED", "Invalid token", 401)

    t0 = time.time()
    try:
        r = requests.get(req.imageUrl, timeout=30)
        r.raise_for_status()
        image = Image.open(io.BytesIO(r.content)).convert("RGB")
    except Exception:
        return err("BAD_INPUT", "Could not download or read image", 400)

    if not is_safe(image):
        return err("UNSAFE_IMAGE", "Image rejected by moderation", 400)

    prompt, negative = build_prompt(req.roomType, req.style, req.colors)
    n = max(1, min(req.numVariants, 4))

    try:
        results, first = [], None
        for i in range(n):
            out = pipeline.run_redesign(image, prompt, negative,(req.seed if req.seed is not None else 42) + i)
            first = first or out
            results.append({"variant": i + 1, "imageBase64": pipeline.to_base64(out)})
    except Exception as e:
        return err("INTERNAL", str(e), 500)

    return {
        "status": "ok",
        "modelVersion": MODEL_VERSION,
        "durationMs": int((time.time() - t0) * 1000),
        "results": results,
        "palette": extract_palette(first),
        "roomAnalysis": {"description": f"{req.roomType.replace('_', ' ')} redesigned in {req.style} style"},
        "recommendations": recommend(req.style),
    }