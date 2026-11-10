import os

AI_SERVICE_TOKEN = os.getenv("AI_SERVICE_TOKEN", "dev-token")
MODEL_VERSION = "v0.3"
USE_MOCK = os.getenv("USE_MOCK", "1") == "1"   # laptop par 1, Colab par 0
MAX_SIDE = 768                                  # GPU memory ke liye
NEGATIVE_PROMPT = ("blurry, distorted walls, extra windows, warped furniture, "
                   "text, watermark, low quality, people")