import io, base64, random
from PIL import Image, ImageEnhance
from .config import USE_MOCK, MAX_SIDE

_pipe = None
_mlsd = None

def _fit(img):
    img = img.convert("RGB")
    w, h = img.size
    s = MAX_SIDE / max(w, h)
    if s < 1:
        w, h = int(w * s), int(h * s)
    w = max(64, (w // 64) * 64)
    h = max(64, (h // 64) * 64)
    return img.resize((w, h))

def load_model():
    """Server start par ek baar call hota hai."""
    global _pipe, _mlsd
    if USE_MOCK or _pipe is not None:
        return
    import torch
    from controlnet_aux import MLSDdetector
    from diffusers import (StableDiffusionControlNetImg2ImgPipeline,
                           ControlNetModel, UniPCMultistepScheduler)
    cn = ControlNetModel.from_pretrained(
        "lllyasviel/control_v11p_sd15_mlsd", torch_dtype=torch.float16)
    _pipe = StableDiffusionControlNetImg2ImgPipeline.from_pretrained(
        "stable-diffusion-v1-5/stable-diffusion-v1-5",
        controlnet=cn, torch_dtype=torch.float16).to("cuda")
    _pipe.scheduler = UniPCMultistepScheduler.from_config(_pipe.scheduler.config)
    _pipe.enable_attention_slicing()
    _mlsd = MLSDdetector.from_pretrained("lllyasviel/Annotators")

def run_redesign(image, prompt, negative, seed):
    image = _fit(image)
    if USE_MOCK:
        random.seed(seed)
        return ImageEnhance.Color(image).enhance(1.0 + random.random())
    import torch
    control = _mlsd(image)
    gen = torch.Generator("cuda").manual_seed(seed)
    return _pipe(prompt=prompt, negative_prompt=negative,
                 image=image, control_image=control,
                 strength=0.85, controlnet_conditioning_scale=0.9,
                 guidance_scale=7.5, num_inference_steps=30,
                 generator=gen).images[0]

def to_base64(img):
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode()