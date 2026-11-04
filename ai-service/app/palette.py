import numpy as np
from PIL import Image
from sklearn.cluster import KMeans

def extract_palette(img, k=5):
    small = img.convert("RGB").resize((200, 200))
    px = np.array(small).reshape(-1, 3)
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(px)
    order = np.bincount(km.labels_).argsort()[::-1]
    return ["#%02x%02x%02x" % tuple(km.cluster_centers_[i].astype(int)) for i in order]