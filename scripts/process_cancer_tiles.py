#!/usr/bin/env python3
"""Process AI-generated cancer tiles: crop bottom 11% (removes watermark), resize to a
uniform thumbnail, and save to public/cancer-<slug>.png.

All inputs are 1024x768; output is 512x352 (same aspect ratio as cropped image).
"""
from PIL import Image, ImageFilter
import os, glob

GENERATED_DIR = "/workspace/trialbeacon/public/generated"
OUT_DIR = "/workspace/trialbeacon/public"

# slug -> source filename (one of the 10 tiles we kept)
TILES = {
    "lung": "A_calm__minimalist_abstract_ed_2026-07-31T04-18-57.png",
    "breast": "A_calm__minimalist_abstract_ed_2026-07-31T04-19-29.png",
    "colorectal": "A_calm__minimalist_abstract_ed_2026-07-31T04-19-58.png",
    "liver": "A_calm__minimalist_abstract_ed_2026-07-31T04-20-26.png",
    "gastric": "A_calm__minimalist_abstract_ed_2026-07-31T04-21-02.png",
    "prostate": "A_calm__minimalist_abstract_ed_2026-07-31T04-23-16.png",
    "pancreatic": "SAFE_pancreatic.png",
    "ovarian": "SAFE_ovarian.png",
    "esophageal": "lymphoma/A_calm__minimalist_abstract_ed_2026-07-31T04-24-20.png",
    "lymphoma": "lymphoma/A_calm__minimalist_abstract_ed_2026-07-31T04-24-10.png",
}

OUT_W, OUT_H = 512, 352  # ~1.455:1, matches 1024x702 (crop bottom 9%)
CROP_BOTTOM_PCT = 11      # crop this percent from the bottom

def process(slug, fname):
    src = os.path.join(GENERATED_DIR, fname)
    dst = os.path.join(OUT_DIR, f"cancer-{slug}.png")
    img = Image.open(src).convert("RGB")
    w, h = img.size
    crop_h = int(h * (1 - CROP_BOTTOM_PCT / 100.0))
    cropped = img.crop((0, 0, w, crop_h))
    thumb = cropped.resize((OUT_W, OUT_H), Image.LANCZOS)
    thumb.save(dst, "PNG", optimize=True)
    print(f"  {slug:11s}  {fname[:50]:50s}  ->  cancer-{slug}.png  ({OUT_W}x{OUT_H})")

print("Processing cancer tiles:")
for slug, fname in TILES.items():
    process(slug, fname)
print("Done.")