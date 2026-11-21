"""Optimize deck images for the Node.js app.

The Streamlit app embedded card art as data URIs resized to max width
384 px (detail view).  This script downscales every deck image to the
same 400 px cap, keeps PNG when real transparency exists, converts
fully-opaque images to quality-85 JPEG, and copies results to
public/decks/<DeckName>/ keeping the original filename stems.
"""
import os
from PIL import Image

SRC = "/home/z/my-project/repo_source/tarot_dcm/streamlit/decks"
DST = "/home/z/my-project/public/decks"
MAX_W = 400

total_in = total_out = 0

for deck in sorted(os.listdir(SRC)):
    src_dir = os.path.join(SRC, deck)
    if not os.path.isdir(src_dir):
        continue
    dst_dir = os.path.join(DST, deck)
    os.makedirs(dst_dir, exist_ok=True)
    for name in sorted(os.listdir(src_dir)):
        path = os.path.join(src_dir, name)
        if not os.path.isfile(path):
            continue
        ext = os.path.splitext(name)[1].lower()
        if ext not in (".png", ".jpg", ".jpeg", ".webp"):
            continue
        total_in += os.path.getsize(path)
        stem = os.path.splitext(name)[0]
        img = Image.open(path)
        if img.width > MAX_W:
            ratio = MAX_W / img.width
            img = img.resize((MAX_W, round(img.height * ratio)), Image.LANCZOS)

        # real alpha? sample: fully-opaque RGBA -> JPEG
        has_alpha = False
        if img.mode in ("RGBA", "LA", "PA"):
            alpha = img.convert("RGBA").getchannel("A")
            has_alpha = alpha.getextrema()[0] < 250

        if has_alpha:
            out_name = stem + ".png"
            img.save(os.path.join(dst_dir, out_name), "PNG", optimize=True)
        else:
            out_name = stem + ".jpg"
            rgb = img.convert("RGB") if img.mode != "RGB" else img
            rgb.save(os.path.join(dst_dir, out_name), "JPEG", quality=86, optimize=True)
        total_out += os.path.getsize(os.path.join(dst_dir, out_name))
    n = len(os.listdir(dst_dir))
    print(f"{deck}: {n} files -> {sum(os.path.getsize(os.path.join(dst_dir,f)) for f in os.listdir(dst_dir))//1024} KB")

print(f"total: {total_in//1024//1024} MB -> {total_out//1024//1024} MB")
