import requests, json

url = "http://127.0.0.1:8000/redesign"
headers = {"Authorization": "Bearer dev-token"}
body = {
    "designId": "t1",
    "imageUrl": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1024",
    "roomType": "living_room",
    "style": "scandinavian",
    "numVariants": 1,
    "seed": 42,
}

r = requests.post(url, json=body, headers=headers, timeout=120)
print("HTTP:", r.status_code)
d = r.json()
print("status:", d.get("status"))
print("palette:", d.get("palette"))
print("recommendations:", d.get("recommendations"))
print("error:", d.get("code"), d.get("message"))

# result image ko file mein save karein
if d.get("results"):
    import base64
    with open("result_mock.jpg", "wb") as f:
        f.write(base64.b64decode(d["results"][0]["imageBase64"]))
    print("Saved result_mock.jpg")