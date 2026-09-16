#!/usr/bin/env python3
"""Render the engraved hero artwork for the solution sub-pages.

The four hub pages use hand-made halftone illustrations. Each service page
beneath them gets its own scene, drawn here as a greyscale value study and
then printed through a line-screen so it matches the hub art: navy ground,
cobalt engraving lines that thicken with brightness.

    python3 tools/make-hero-art.py            # all scenes
    python3 tools/make-hero-art.py trading    # one scene

Output: assets/img/hero/<slug>.jpg (1536 × 1024).
"""
import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img", "hero")
W, H = 1536, 1024
SS = 2  # supersampling for the value study

FONT_DIR = "/System/Library/Fonts/Supplemental"


def font(name, size):
    paths = {
        "serif": os.path.join(FONT_DIR, "Georgia.ttf"),
        "serif-b": os.path.join(FONT_DIR, "Georgia Bold.ttf"),
        "mono": os.path.join(FONT_DIR, "Courier New.ttf"),
        "mono-b": os.path.join(FONT_DIR, "Courier New Bold.ttf"),
        "times": os.path.join(FONT_DIR, "Times New Roman.ttf"),
    }
    try:
        return ImageFont.truetype(paths[name], int(size))
    except OSError:
        return ImageFont.load_default()


def v(x):
    return int(max(0, min(1, x)) * 255)


# --------------------------------------------------------------- canvas ----


class Scene:
    def __init__(self, seed):
        random.seed(seed)
        np.random.seed(seed)
        self.img = Image.new("L", (W * SS, H * SS), 0)
        self.d = ImageDraw.Draw(self.img)
        self.glow = Image.new("L", (W * SS, H * SS), 0)
        self.gd = ImageDraw.Draw(self.glow)
        self.lights = []

    # coordinates are authored in 1536×1024 space
    def P(self, pts):
        return [(x * SS, y * SS) for x, y in pts]

    def poly(self, pts, val, outline=None, width=1):
        self.d.polygon(self.P(pts), fill=v(val), outline=None if outline is None else v(outline), width=width * SS)

    def line(self, pts, val, width=2, glow=0):
        self.d.line(self.P(pts), fill=v(val), width=max(1, int(width * SS)), joint="curve")
        if glow:
            self.gd.line(self.P(pts), fill=v(glow), width=max(1, int(width * SS * 5)))

    def ellipse(self, box, val=None, outline=None, width=1):
        x0, y0, x1, y1 = box
        self.d.ellipse(
            [x0 * SS, y0 * SS, x1 * SS, y1 * SS],
            fill=None if val is None else v(val),
            outline=None if outline is None else v(outline),
            width=int(width * SS),
        )

    def rect(self, box, val, outline=None, width=1, radius=0):
        x0, y0, x1, y1 = box
        self.d.rounded_rectangle(
            [x0 * SS, y0 * SS, x1 * SS, y1 * SS],
            radius=radius * SS,
            fill=None if val is None else v(val),
            outline=None if outline is None else v(outline),
            width=int(width * SS),
        )

    def text(self, xy, s, size, val, face="serif", anchor="la"):
        self.d.text((xy[0] * SS, xy[1] * SS), s, font=font(face, size * SS), fill=v(val), anchor=anchor)

    def light(self, cx, cy, r, amt):
        """Soft radial light: glows the ground and shapes the lighting pass."""
        self.lights.append((cx, cy, r))
        yy, xx = np.mgrid[0 : H * SS : SS * 4, 0 : W * SS : SS * 4]
        g = np.exp(-(((xx / SS - cx) ** 2 + (yy / SS - cy) ** 2) / (2 * r * r))) * amt
        layer = Image.fromarray((g * 255).clip(0, 255).astype("uint8")).resize(self.img.size, Image.BILINEAR)
        self.glow = Image.fromarray(np.maximum(np.asarray(self.glow), np.asarray(layer)))
        self.gd = ImageDraw.Draw(self.glow)

    def paste_quad(self, tex, quad, opacity=1.0):
        """Warp a flat texture (L image) onto a quadrilateral: TL, TR, BR, BL."""
        tw, th = tex.size
        dst = [(x * SS, y * SS) for x, y in quad]
        src = [(0, 0), (tw, 0), (tw, th), (0, th)]
        coeffs = perspective_coeffs(dst, src)
        warped = tex.transform(self.img.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)
        mask = Image.new("L", tex.size, int(255 * opacity)).transform(self.img.size, Image.PERSPECTIVE, coeffs, Image.BILINEAR)
        self.img.paste(warped, (0, 0), mask)

    def value(self):
        base = self.img.filter(ImageFilter.GaussianBlur(0.6 * SS)).resize((W, H), Image.LANCZOS)
        glow = self.glow.resize((W, H), Image.BILINEAR).filter(ImageFilter.GaussianBlur(20))
        a = np.asarray(base, dtype=np.float32) / 255
        g = np.asarray(glow, dtype=np.float32) / 255
        # lighting pass: surfaces fall off away from the light, corners sink
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        lm = np.zeros((H, W), dtype=np.float32)
        for cx, cy, r in self.lights or [(W * 0.7, H * 0.4, 500)]:
            lm = np.maximum(lm, np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * (r * 1.35) ** 2)))
        vignette = 1 - 0.55 * (((xx - W * 0.66) / (W * 0.8)) ** 2 + ((yy - H * 0.45) / (H * 0.9)) ** 2)
        a = a * (0.28 + 0.9 * lm) * np.clip(vignette, 0.25, 1)
        a = np.clip(a + g * 0.6 * (1 - a), 0, 1)
        return a


def perspective_coeffs(dst, src):
    """Coefficients mapping output (dst) points back to texture (src) points."""
    m = []
    for (x, y), (u, w) in zip(dst, src):
        m.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        m.append([0, 0, 0, x, y, 1, -w * x, -w * y])
    A = np.array(m, dtype=np.float64)
    B = np.array(src, dtype=np.float64).reshape(8)
    return np.linalg.solve(A, B).tolist()


def tex(w, h, val=0.0):
    im = Image.new("L", (int(w), int(h)), v(val))
    return im, ImageDraw.Draw(im)


def lerp(a, b, t):
    return a + (b - a) * t


def quad_point(q, u, t):
    (ax, ay), (bx, by), (cx, cy), (dx, dy) = q
    top = (lerp(ax, bx, u), lerp(ay, by, u))
    bot = (lerp(dx, cx, u), lerp(dy, cy, u))
    return (lerp(top[0], bot[0], t), lerp(top[1], bot[1], t))


def iso_box(s, x, y, w, d, h, top=0.62, left=0.34, right=0.2, edge=None):
    """Isometric box whose bottom-front corner sits at (x, y)."""
    c, sn = math.cos(math.radians(30)), math.sin(math.radians(30))
    fl = (x - w * c, y - w * sn)
    fr = (x + d * c, y - d * sn)
    back = (fl[0] + d * c, fl[1] - d * sn)
    up = lambda p: (p[0], p[1] - h)
    s.poly([fl, (x, y), up((x, y)), up(fl)], left)
    s.poly([(x, y), fr, up(fr), up((x, y))], right)
    s.poly([up(fl), up((x, y)), up(fr), up(back)], top)
    if edge is not None:
        s.line([up(fl), up((x, y)), up(fr)], edge, 1.5)
        s.line([(x, y), up((x, y))], edge, 1.5)
    return {"fl": fl, "fr": fr, "front": (x, y), "back": back, "top": [up(fl), up((x, y)), up(fr), up(back)]}


def ground(s, horizon=700, near=0.16, far=0.04):
    for i in range(H - horizon):
        t = i / (H - horizon)
        s.line([(0, horizon + i), (W, horizon + i)], lerp(far, near, t), 1)


# -------------------------------------------------------------- textures ---


def chart_tex(seed, w=640, h=400, candles=34):
    rnd = random.Random(seed)
    im, d = tex(w, h, 0.2)
    for gx in range(0, w, 80):
        d.line([(gx, 0), (gx, h)], fill=v(0.32), width=2)
    for gy in range(0, h, 64):
        d.line([(0, gy), (w, gy)], fill=v(0.32), width=2)
    px = h * 0.55
    step = (w - 60) / candles
    closes = []
    for i in range(candles):
        o = px
        px += rnd.uniform(-22, 20) - (i / candles) * 3
        px = min(h - 60, max(70, px))
        c = px
        hi, lo = min(o, c) - rnd.uniform(4, 20), max(o, c) + rnd.uniform(4, 20)
        x = 30 + i * step
        d.line([(x + step * 0.3, hi), (x + step * 0.3, lo)], fill=v(0.95), width=3)
        box = [x + step * 0.05, min(o, c), x + step * 0.55, max(o, c) + 2]
        if c < o:
            d.rectangle(box, outline=v(1), width=3)
        else:
            d.rectangle(box, fill=v(0.92))
        closes.append((x + step * 0.3, c))
    d.line([(x, y - 34) for x, y in closes], fill=v(0.7), width=4)
    d.text((18, 12), rnd.choice(["NVDA  131.42", "SPX  5,412.8", "EURUSD 1.0873", "US10Y 4.21%", "BTC  64,120"]), font=font("mono-b", 26), fill=v(0.9))
    for i in range(5):
        d.rectangle([w - 120, 60 + i * 26, w - 20, 72 + i * 26], fill=v(rnd.uniform(0.3, 0.7)))
    return im


def page_tex(seed, w=600, h=780, title=None, seal=False, sign=False, highlight=0, base=0.62, cols=1):
    rnd = random.Random(seed)
    im, d = tex(w, h, base)
    y = 70
    if title:
        d.text((w / 2, 60), title, font=font("serif-b", 42), fill=v(0.18), anchor="mt")
        d.line([(60, 120), (w - 60, 120)], fill=v(0.25), width=3)
        y = 160
    hl = set(rnd.sample(range(6, 30), highlight)) if highlight else set()
    row = 0
    colw = (w - 120 - (cols - 1) * 30) / cols
    while y < h - (180 if sign else 70):
        for ci in range(cols):
            x0 = 60 + ci * (colw + 30)
            lw = colw * (rnd.uniform(0.55, 0.98) if rnd.random() < 0.2 else 1)
            if row in hl:
                d.rectangle([x0 - 8, y - 8, x0 + lw + 8, y + 16], fill=v(0.9))
            d.rectangle([x0, y, x0 + lw, y + 8], fill=v(0.3))
        y += 30 if rnd.random() > 0.12 else 56
        row += 1
    if seal:
        cx, cy = w - 140, h - 120
        for r, val in ((66, 0.3), (58, base), (50, 0.35), (36, base)):
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=v(val))
    if sign:
        d.line([(60, h - 110), (w * 0.55, h - 110)], fill=v(0.25), width=2)
        pts = [(80 + i * 7, h - 140 + math.sin(i * 0.7) * 16 - i * 0.6) for i in range(38)]
        d.line(pts, fill=v(0.15), width=4, joint="curve")
    return im


def ledger_tex(seed, w=700, h=860):
    rnd = random.Random(seed)
    im, d = tex(w, h, 0.64)
    for y in range(120, h - 40, 34):
        d.line([(30, y), (w - 30, y)], fill=v(0.4), width=1)
    for x in (120, 420, 560):
        d.line([(x, 80), (x, h - 40)], fill=v(0.3), width=2)
    d.text((40, 36), "GENERAL LEDGER", font=font("serif-b", 32), fill=v(0.2))
    mono = font("mono", 24)
    for i, y in enumerate(range(128, h - 70, 34)):
        d.text((36, y), f"06/{(i % 28) + 1:02d}", font=mono, fill=v(0.22))
        d.rectangle([140, y + 8, 140 + rnd.uniform(90, 260), y + 16], fill=v(0.35))
        amt = f"{rnd.uniform(200, 98000):,.2f}"
        d.text((550, y), amt, font=mono, fill=v(0.18), anchor="ra")
        if rnd.random() < 0.7:
            d.line([(598, y + 12), (608, y + 22), (626, y - 2)], fill=v(0.12), width=4)
    return im


def facade_tex(seed, w=260, h=900, lit=0.3, cols=5):
    rnd = random.Random(seed)
    im, d = tex(w, h, 0.22)
    gw = w / cols
    for r in range(int(h / 34)):
        for c in range(cols):
            val = rnd.uniform(0.55, 0.9) if rnd.random() < lit else rnd.uniform(0.08, 0.16)
            d.rectangle([c * gw + 6, r * 34 + 8, (c + 1) * gw - 6, r * 34 + 28], fill=v(val))
    return im


def spines_tex(seed, w=900, h=300, labels=()):
    rnd = random.Random(seed)
    im, d = tex(w, h, 0.05)
    x = 0
    li = 0
    while x < w:
        bw = rnd.uniform(26, 58)
        bh = rnd.uniform(0.72, 0.98) * h
        val = rnd.uniform(0.28, 0.55)
        d.rectangle([x + 2, h - bh, x + bw, h], fill=v(val))
        for by in (h - bh + 18, h - 28):
            d.rectangle([x + 6, by, x + bw - 4, by + 5], fill=v(val + 0.25))
        x += bw + 2
        li += 1
    return im


def rack_tex(seed, w=300, h=620):
    rnd = random.Random(seed)
    im, d = tex(w, h, 0.18)
    for y in range(20, h - 20, 44):
        d.rectangle([18, y, w - 18, y + 34], fill=v(0.3))
        for k in range(6):
            d.rectangle([34 + k * 22, y + 12, 46 + k * 22, y + 22], fill=v(0.12))
        d.ellipse([w - 60, y + 11, w - 48, y + 23], fill=v(0.95 if rnd.random() < 0.6 else 0.4))
        d.ellipse([w - 40, y + 11, w - 28, y + 23], fill=v(0.9 if rnd.random() < 0.4 else 0.35))
    return im


def gear_points(cx, cy, r, teeth, depth=0.14, rot=0.0):
    pts = []
    n = teeth * 4
    for i in range(n):
        a = rot + i / n * math.tau
        phase = i % 4
        rr = r * (1 + depth) if phase in (1, 2) else r
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    return pts


# ---------------------------------------------------------------- scenes ---


def scene_trading(s):
    s.light(1060, 330, 470, 0.6)
    # a wall of screens, the nearest on the right
    cols = [(470, 0.7), (760, 0.9), (1090, 1.1), (1460, 1.3)]
    for ci, (cx, sc) in enumerate(cols):
        for row in range(2):
            mw, mh = 290 * sc, 190 * sc
            top = 110 + row * (mh + 22 * sc) - (sc - 1) * 120
            skew = (1.3 - sc) * 34
            q = [(cx - mw / 2, top + skew), (cx + mw / 2, top), (cx + mw / 2, top + mh), (cx - mw / 2, top + mh - skew)]
            bez = [(q[0][0] - 12, q[0][1] - 12), (q[1][0] + 12, q[1][1] - 12), (q[2][0] + 12, q[2][1] + 12), (q[3][0] - 12, q[3][1] + 12)]
            s.poly(bez, 0.05)
            s.paste_quad(chart_tex(ci * 7 + row), q)
            s.gd.polygon(s.P(q), fill=v(0.55))
    # desk
    s.poly([(300, 700), (1536, 650), (1536, 1024), (180, 1024)], 0.14)
    s.line([(300, 700), (1536, 650)], 0.7, 4, glow=0.4)
    for x, y in [(640, 770), (980, 752)]:
        s.poly([(x, y), (x + 300, y - 12), (x + 330, y + 40), (x + 20, y + 52)], 0.26)
        for k in range(12):
            s.line([(x + 30 + k * 24, y + 8 - k * 0.4), (x + 40 + k * 24, y + 40 - k * 0.4)], 0.45, 2)
    # trader, seen from behind, lit by the screens
    bust(s, 1150, 360, 1.25, 0.03, 0.5)


def scene_risk(s):
    s.light(1080, 420, 460, 0.45)
    # loss distribution with the tail beyond VaR shaded
    base_y, x0, x1 = 470, 640, 1500
    mu, sig = 960, 150
    curve = []
    for k in range(121):
        x = lerp(x0, x1, k / 120)
        z = (x - mu) / sig
        y = base_y - 330 * math.exp(-z * z / 2) * (1 + 0.25 * max(0, z) ** 1.2)
        curve.append((x, y))
    var_x = 1250
    tail = [p for p in curve if p[0] >= var_x]
    s.poly([(var_x, base_y)] + tail + [(x1, base_y)], 0.45)
    s.gd.polygon(s.P([(var_x, base_y)] + tail + [(x1, base_y)]), fill=v(0.6))
    s.line(curve, 0.75, 5, glow=0.35)
    s.line([(x0, base_y), (x1, base_y)], 0.35, 2)
    s.line([(var_x, base_y + 10), (var_x, 150)], 0.85, 3)
    s.text((var_x + 16, 150), "VaR 95%", 34, 0.85, "mono-b")
    for k in range(9):
        x = lerp(x0, x1, k / 8)
        s.line([(x, base_y), (x, base_y + 12)], 0.35, 2)
    # isometric exposure towers
    rnd = random.Random(4)
    for gy in range(6, -1, -1):
        for gx in range(7):
            x = 760 + gx * 70 - gy * 70
            y = 990 - gx * 40 - gy * 40
            hot = math.exp(-(((gx - 4.5) ** 2 + (gy - 2) ** 2) / 5))
            h = 24 + hot * 250 + rnd.uniform(0, 30)
            b = iso_box(s, x + 400, y, 54, 54, h, top=0.3 + hot * 0.6, left=0.14 + hot * 0.3, right=0.08 + hot * 0.2)
            if hot > 0.7:
                s.gd.polygon(s.P(b["top"]), fill=v(0.9))


def scene_compliance(s):
    s.light(1080, 480, 460, 0.45)
    ground(s, 620, 0.1, 0.03)
    for i, (dx, dy, rot) in enumerate([(0, 40, -8), (60, 10, 4), (20, -20, -2)]):
        base = [(620 + dx, 560 + dy), (1180 + dx, 480 + dy + rot), (1420 + dx, 900 + dy), (800 + dx, 1010 + dy)]
        s.paste_quad(page_tex(i + 11, title="DISCLOSURE" if i == 2 else None, seal=i == 2, base=0.5 + i * 0.07), base)
    # magnifier
    cx, cy, r = 1090, 520, 210
    lens = Image.new("L", (W * SS, H * SS), 0)
    ld = ImageDraw.Draw(lens)
    ld.ellipse([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS], fill=255)
    zoom = page_tex(99, 700, 700, highlight=3, base=0.78).resize((int(2 * r * SS), int(2 * r * SS)))
    layer = Image.new("L", (W * SS, H * SS), 0)
    layer.paste(zoom, (int((cx - r) * SS), int((cy - r) * SS)))
    s.img.paste(layer, (0, 0), lens)
    s.ellipse((cx - r, cy - r, cx + r, cy + r), outline=0.85, width=26)
    s.ellipse((cx - r + 18, cy - r + 18, cx + r - 18, cy + r - 18), outline=0.35, width=6)
    s.gd.ellipse([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS], outline=v(0.9), width=40 * SS)
    a = math.radians(40)
    hx, hy = cx + math.cos(a) * (r + 10), cy + math.sin(a) * (r + 10)
    L, T = 300, 36
    nx, ny = -math.sin(a) * T, math.cos(a) * T
    s.poly([(hx + nx, hy + ny), (hx + math.cos(a) * L + nx, hy + math.sin(a) * L + ny), (hx + math.cos(a) * L - nx, hy + math.sin(a) * L - ny), (hx - nx, hy - ny)], 0.3)
    s.line([(hx + nx * 0.5, hy + ny * 0.5), (hx + math.cos(a) * L + nx * 0.5, hy + math.sin(a) * L + ny * 0.5)], 0.6, 5)


def scene_wealth(s):
    s.light(1120, 380, 480, 0.5)
    ground(s, 760, 0.12, 0.04)
    # rising line
    pts = [(560 + i * 50, 640 - (i ** 1.35) * 14 + math.sin(i * 1.3) * 20) for i in range(20)]
    s.line(pts, 0.8, 5, glow=0.6)
    s.poly([pts[-1], (pts[-1][0] - 40, pts[-1][1] + 6), (pts[-1][0] - 12, pts[-1][1] + 36)], 0.85)
    # coin stacks
    for k, (x, n) in enumerate([(700, 5), (860, 9), (1030, 14), (1210, 20), (1400, 27)]):
        rx, ry, th = 70, 24, 13
        base_y = 930 - k * 6
        for i in range(n):
            y = base_y - i * th
            s.poly([(x - rx, y), (x + rx, y), (x + rx, y + th), (x - rx, y + th)], 0.3 if i % 2 else 0.24)
            s.ellipse((x - rx, y + th - ry, x + rx, y + th + ry), 0.28)
        y = base_y - n * th
        s.ellipse((x - rx, y + th - ry, x + rx, y + th + ry), 0.68, outline=0.9, width=3)
        s.ellipse((x - rx + 18, y + th - ry + 7, x + rx - 18, y + th + ry - 7), outline=0.45, width=3)
        for i in range(n):
            yy = base_y - i * th + th
            s.line([(x - rx, yy), (x + rx, yy)], 0.5, 1)
    # statement card
    s.paste_quad(page_tex(51, title="PORTFOLIO", base=0.55, cols=2), [(1180, 120), (1480, 170), (1440, 520), (1130, 470)], 0.9)


def scene_accounting(s):
    s.light(1060, 520, 480, 0.45)
    ground(s, 520, 0.1, 0.03)
    spine_top, spine_bot = (1010, 330), (960, 980)
    left_page = [(560, 420), spine_top, spine_bot, (430, 1024)]
    right_page = [spine_top, (1480, 300), (1536, 1024), spine_bot]
    s.poly([(540, 440), (1500, 320), (1536, 1024), (410, 1024)], 0.08)
    s.paste_quad(ledger_tex(3), left_page)
    s.paste_quad(ledger_tex(8), right_page)
    s.line([spine_top, spine_bot], 0.08, 10)
    # pencil
    a = math.radians(-24)
    x0, y0, L, T = 620, 360, 520, 14
    nx, ny = -math.sin(a) * T, math.cos(a) * T
    ex, ey = x0 + math.cos(a) * L, y0 + math.sin(a) * L
    s.poly([(x0 + nx, y0 + ny), (ex + nx, ey + ny), (ex - nx, ey - ny), (x0 - nx, y0 - ny)], 0.55)
    s.poly([(x0 + nx, y0 + ny), (x0 - nx, y0 - ny), (x0 - math.cos(a) * 60, y0 - math.sin(a) * 60)], 0.8)
    # calculator
    q = [(1210, 520), (1470, 470), (1520, 820), (1250, 880)]
    calc, cd = tex(260, 360, 0.2)
    cd.rectangle([20, 20, 240, 90], fill=v(0.55))
    cd.text((226, 30), "412,806.55", font=font("mono-b", 30), fill=v(0.12), anchor="ra")
    for r in range(5):
        for c in range(4):
            cd.rounded_rectangle([20 + c * 56, 110 + r * 48, 64 + c * 56, 146 + r * 48], 6, fill=v(0.45 if c < 3 else 0.7))
    s.paste_quad(calc, q)


def scene_lms(s):
    s.light(1080, 420, 460, 0.5)
    # transit lines behind
    for k, off in enumerate((0, 70, 140)):
        pts = [(520, 260 + off), (820, 260 + off), (900, 180 + off), (1240, 180 + off), (1320, 260 + off), (1536, 260 + off)]
        s.line(pts, 0.28 + k * 0.08, 14)
        for p in pts[1:-1]:
            s.ellipse((p[0] - 16, p[1] - 16, p[0] + 16, p[1] + 16), 0.1, outline=0.6, width=6)
    ground(s, 800, 0.12, 0.05)
    # books
    y = 960
    for i, (w, h, val) in enumerate([(560, 70, 0.3), (520, 64, 0.4), (540, 72, 0.34)]):
        b = iso_box(s, 1080 + i * 10, y - i * 72, w * 0.5, w * 0.62, h, top=0.62, left=val, right=val - 0.12)
        s.line([b["front"], (b["front"][0], b["front"][1] - h)], 0.6, 2)
        s.text((b["fl"][0] + 40, b["fl"][1] - h * 0.62 - 20), ["CURRICULUM", "PEDAGOGY", "ASSESSMENT"][i], 26, 0.75, "serif")
    top_y = y - 3 * 72 - 24
    cx = 1110
    board = [(cx - 300, top_y - 40), (cx, top_y - 190), (cx + 320, top_y - 40), (cx, top_y + 110)]
    s.poly([(cx - 150, top_y), (cx + 150, top_y), (cx + 150, top_y + 90), (cx - 150, top_y + 90)], 0.2)
    s.ellipse((cx - 150, top_y + 50, cx + 150, top_y + 130), 0.22)
    s.poly(board, 0.5, outline=0.85, width=3)
    s.gd.polygon(s.P(board), fill=v(0.5))
    s.ellipse((cx - 16, top_y - 56, cx + 16, top_y - 24), 0.85)
    s.line([(cx, top_y - 40), (cx + 250, top_y - 20), (cx + 262, top_y + 150)], 0.75, 5)
    s.poly([(cx + 248, top_y + 140), (cx + 278, top_y + 140), (cx + 290, top_y + 230), (cx + 236, top_y + 230)], 0.7)


def scene_api(s):
    s.light(1100, 440, 460, 0.5)
    ground(s, 760, 0.12, 0.04)
    racks = []
    for i, x in enumerate((760, 980, 1200)):
        b = iso_box(s, x, 900 - i * 30, 90, 150, 520, top=0.45, left=0.12, right=0.08)
        fl, front = b["fl"], b["front"]
        q = [(fl[0], fl[1] - 520), (front[0], front[1] - 520), front, fl]
        s.paste_quad(rack_tex(i), q)
        racks.append(b)
    nodes = [(640, 250), (1000, 150), (1380, 230), (1470, 560)]
    for i, (nx, ny) in enumerate(nodes):
        hexp = [(nx + math.cos(a) * 60, ny + math.sin(a) * 60) for a in [math.radians(30 + 60 * k) for k in range(6)]]
        start = racks[min(i, 2)]["top"][2]
        mid = ((start[0] + nx) / 2, min(start[1], ny) - 80)
        curve = [(lerp(lerp(start[0], mid[0], t), lerp(mid[0], nx, t), t), lerp(lerp(start[1], mid[1], t), lerp(mid[1], ny, t), t)) for t in [k / 30 for k in range(31)]]
        s.line(curve, 0.55, 5, glow=0.35)
        s.poly(hexp, 0.2, outline=0.9, width=5)
        s.gd.polygon(s.P(hexp), fill=v(0.6))
        s.text((nx, ny), ["{ }", "</>", "API", "⇄"][i], 38, 0.9, "mono-b", anchor="mm")


def envelope(s, cx, cy, w, rot, val):
    h = w * 0.62
    a = math.radians(rot)
    def R(x, y):
        return (cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a))
    body = [R(-w / 2, -h / 2), R(w / 2, -h / 2), R(w / 2, h / 2), R(-w / 2, h / 2)]
    s.poly(body, val)
    s.line([R(-w / 2, -h / 2), R(0, h * 0.1), R(w / 2, -h / 2)], min(1, val + 0.3), max(2, w / 90))
    s.line([R(-w / 2, h / 2), R(-w * 0.1, 0), ], val - 0.1, max(1, w / 160))
    s.line([R(w / 2, h / 2), R(w * 0.1, 0)], val - 0.1, max(1, w / 160))
    return body


def scene_email(s):
    s.light(1100, 420, 480, 0.5)
    rnd = random.Random(21)
    for i in range(16):
        t = i / 15
        x = lerp(520, 1380, t) + rnd.uniform(-40, 40)
        y = lerp(620, 330, t) + math.sin(i * 1.7) * 120
        w = lerp(60, 280, t ** 1.4)
        s.line([(x - w * 1.6, y + w * 0.3), (x - w * 0.6, y + w * 0.05)], 0.25 + t * 0.2, max(1, w / 60))
        body = envelope(s, x, y, w, rnd.uniform(-18, 12), 0.25 + t * 0.45)
        if t > 0.75:
            s.gd.polygon(s.P(body), fill=v(0.4))
    # open letter in the foreground
    s.poly([(1080, 760), (1480, 700), (1536, 1024), (1120, 1024)], 0.3)
    s.paste_quad(page_tex(5, 520, 420, base=0.7), [(1130, 600), (1450, 560), (1490, 860), (1150, 900)])
    s.poly([(1080, 760), (1300, 880), (1480, 700), (1536, 1024), (1120, 1024)], 0.36)


def scene_docauto(s):
    s.light(1080, 420, 480, 0.5)
    ground(s, 820, 0.1, 0.04)
    cx, cy = 1120, 560
    for i, rot in enumerate((-26, -14, -3, 8)):
        a = math.radians(rot)
        w, h = 430, 560
        def R(x, y):
            return (cx + 120 * i - 180 + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a))
        q = [R(-w / 2, -h / 2), R(w / 2, -h / 2), R(w / 2, h / 2), R(-w / 2, h / 2)]
        s.poly([(x + 14, y + 18) for x, y in q], 0.04)
        s.paste_quad(page_tex(30 + i, title="AGREEMENT" if i == 3 else None, highlight=3 if i == 3 else 0, base=0.42 + i * 0.1, sign=i == 3), q)
    rnd = random.Random(9)
    for k in range(14):
        t = k / 13
        x, y = lerp(520, 980, t), 380 + math.sin(k * 1.1) * 150
        bw = rnd.uniform(40, 120)
        s.rect((x, y, x + bw, y + 16), 0.35 + t * 0.5, radius=4)
        s.gd.rectangle([x * SS, y * SS, (x + bw) * SS, (y + 16) * SS], fill=v(0.5 * t))


def scene_kb(s):
    s.light(1120, 360, 460, 0.55)
    ground(s, 800, 0.1, 0.03)
    spine = (1080, 760)
    lp = [(640, 700), (1060, 640), spine, (600, 900)]
    rp = [(1100, 640), (1500, 690), (1540, 900), spine]
    s.poly([(580, 930), (1080, 790), (1536, 930), (1536, 1000), (1080, 850), (560, 1000)], 0.2)
    s.paste_quad(page_tex(71, 500, 360, base=0.62), lp)
    s.paste_quad(page_tex(72, 500, 360, base=0.66), rp)
    rnd = random.Random(33)
    pts = []
    for i in range(70):
        r = rnd.uniform(40, 330) ** 1.0
        a = rnd.uniform(0, math.tau)
        x = 1080 + math.cos(a) * r * 1.25
        y = 330 + math.sin(a) * r * 0.75 - (330 - r) * 0.2
        pts.append((x, y, rnd.random()))
    for i, (x, y, z) in enumerate(pts):
        for j in range(i + 1, len(pts)):
            x2, y2, _ = pts[j]
            if math.hypot(x - x2, y - y2) < 95:
                s.line([(x, y), (x2, y2)], 0.25 + 0.2 * z, 1.4)
    for x, y, z in pts:
        r = 5 + z * 9
        s.ellipse((x - r, y - r, x + r, y + r), 0.5 + z * 0.45)
        s.gd.ellipse([(x - r * 3) * SS, (y - r * 3) * SS, (x + r * 3) * SS, (y + r * 3) * SS], fill=v(0.6 * z))
    for k in range(9):
        x = lerp(760, 1400, k / 8)
        s.line([(x, 700 - abs(k - 4) * 8), (lerp(x, 1080, 0.3), 560)], 0.3, 2)


def scene_realestate(s):
    s.light(1100, 300, 440, 0.55)
    ground(s, 900, 0.14, 0.06)
    # back row, darker and shorter
    for i, (x, w, h) in enumerate([(520, 150, 360), (700, 120, 470), (1330, 160, 420), (1480, 120, 520)]):
        s.poly([(x, 910 - h), (x + w, 910 - h), (x + w, 910), (x, 910)], 0.1)
        s.paste_quad(facade_tex(40 + i, int(w), int(h), lit=0.12, cols=4), [(x + 8, 918 - h), (x + w - 8, 918 - h), (x + w - 8, 910), (x + 8, 910)], 0.55)
    # front row with a side face for depth
    towers = [(600, 200, 520, 0.22, 5), (840, 230, 700, 0.3, 6), (1090, 250, 740, 0.5, 6), (1370, 210, 600, 0.28, 5)]
    for i, (x, w, h, lit, cols) in enumerate(towers):
        top = 930 - h
        side_w = 46
        s.poly([(x + w, top), (x + w + side_w, top + 22), (x + w + side_w, 930), (x + w, 930)], 0.07)
        s.poly([(x, top), (x + side_w, top - 22), (x + w + side_w, top - 22), (x + w, top)], 0.3)
        s.paste_quad(facade_tex(i, int(w), int(h), lit=lit, cols=cols), [(x, top), (x + w, top), (x + w, 930), (x, 930)])
        s.line([(x, top), (x + w, top)], 0.7, 3)
        if i == 2:
            mid = x + w / 2
            s.poly([(x + 24, top - 10), (mid + 23, top - 170), (x + w - 2, top - 10)], 0.55)
            s.line([(mid + 23, top - 170), (mid + 23, top - 270)], 0.85, 5, glow=0.9)
            s.gd.rectangle([x * SS, top * SS, (x + w) * SS, 930 * SS], fill=v(0.3))
    s.poly([(0, 930), (W, 930), (W, H), (0, H)], 0.12)
    for k in range(14):
        x = 480 + k * 80
        s.line([(x, 975), (x + 44, 975)], 0.45, 3)


def scene_legaldoc(s):
    s.light(1060, 520, 460, 0.45)
    ground(s, 560, 0.1, 0.03)
    q = [(700, 300), (1320, 220), (1500, 1024), (760, 1024)]
    s.poly([(x + 30, y + 30) for x, y in q], 0.04)
    s.paste_quad(page_tex(41, 620, 900, title="CONTRACT", seal=True, sign=True, base=0.6), q)
    # fountain pen, diagonal
    a = math.radians(-38)
    tipx, tipy = 1010, 830
    L = 760
    def along(d, off):
        return (tipx + math.cos(a) * d - math.sin(a) * off, tipy + math.sin(a) * d + math.cos(a) * off)
    s.poly([along(0, 0), along(90, -26), along(150, -30), along(150, 30), along(90, 26)], 0.78)
    s.line([along(8, 0), along(100, 0)], 0.2, 3)
    s.ellipse((along(96, 0)[0] - 7, along(96, 0)[1] - 7, along(96, 0)[0] + 7, along(96, 0)[1] + 7), 0.2)
    s.poly([along(150, -36), along(L, -44), along(L + 30, 0), along(L, 44), along(150, 36)], 0.2)
    s.line([along(170, -30), along(L - 10, -38)], 0.55, 4)
    for d in (260, 280, 620):
        s.poly([along(d, -40), along(d + 14, -41), along(d + 14, 41), along(d, 40)], 0.7)
    s.gd.line(s.P([along(0, 0), along(150, 0)]), fill=v(0.9), width=60 * SS)


def scene_workflow(s):
    s.light(1080, 440, 460, 0.5)
    gears = [(1000, 520, 190, 18, 0.0, 0.5), (1300, 330, 130, 12, 0.13, 0.38), (1290, 760, 150, 14, 0.1, 0.44), (780, 260, 90, 9, 0.2, 0.3)]
    for cx, cy, r, teeth, rot, val in gears:
        s.poly(gear_points(cx, cy, r, teeth, rot=rot), val, outline=min(1, val + 0.35), width=3)
        s.ellipse((cx - r * 0.72, cy - r * 0.72, cx + r * 0.72, cy + r * 0.72), val - 0.2)
        for k in range(6):
            ang = rot + k * math.tau / 6
            s.line([(cx, cy), (cx + math.cos(ang) * r * 0.72, cy + math.sin(ang) * r * 0.72)], val + 0.1, r * 0.1)
        s.ellipse((cx - r * 0.2, cy - r * 0.2, cx + r * 0.2, cy + r * 0.2), val + 0.3)
        s.gd.polygon(s.P(gear_points(cx, cy, r, teeth, rot=rot)), fill=v(val))
    # flow ribbon with checkpoints
    pts = [(520, 860), (700, 820), (860, 900), (1060, 860), (1480, 940)]
    curve = []
    for i in range(len(pts) - 1):
        for t in [k / 20 for k in range(20)]:
            curve.append((lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t) + math.sin(t * math.pi) * -20))
    s.line(curve, 0.55, 8, glow=0.4)
    for x, y in pts[1:-1]:
        s.ellipse((x - 26, y - 26, x + 26, y + 26), 0.1, outline=0.85, width=5)
        s.line([(x - 10, y), (x - 2, y + 9), (x + 12, y - 9)], 0.9, 5)


def bust_outline(cx, cy, sc):
    """Head-and-shoulders silhouette; (cx, cy) is the top of the head."""
    pts = []
    hw, hh = 62 * sc, 84 * sc
    hc = (cx, cy + hh)
    for k in range(0, 181, 6):  # crown, from right ear over to left ear
        a = math.radians(k)
        pts.append((hc[0] + math.cos(a) * hw, hc[1] - math.sin(a) * hh))
    # left jaw, neck, shoulder
    pts += [
        (cx - hw * 0.92, cy + hh * 1.35),
        (cx - hw * 0.55, cy + hh * 1.85),
        (cx - hw * 0.62, cy + hh * 2.2),
    ]
    for k in range(0, 11):
        t = k / 10
        pts.append((lerp(cx - hw * 0.62, cx - 270 * sc, t ** 0.7), lerp(cy + hh * 2.2, cy + hh * 2.2 + 120 * sc, t ** 1.6)))
    pts += [(cx - 300 * sc, cy + 900 * sc), (cx + 300 * sc, cy + 900 * sc)]
    for k in range(10, -1, -1):
        t = k / 10
        pts.append((lerp(cx + hw * 0.62, cx + 270 * sc, t ** 0.7), lerp(cy + hh * 2.2, cy + hh * 2.2 + 120 * sc, t ** 1.6)))
    pts += [(cx + hw * 0.62, cy + hh * 2.2), (cx + hw * 0.55, cy + hh * 1.85), (cx + hw * 0.92, cy + hh * 1.35)]
    return pts


def bust(s, cx, cy, sc, val=0.03, rim=0.55):
    pts = bust_outline(cx, cy, sc)
    if rim:
        s.poly([(x + (3 if x > cx else -3) * sc, y - 3 * sc) for x, y in pts], rim)
    s.poly(pts, val)


def person(s, cx, cy, scale, val):
    hr = 34 * scale
    s.ellipse((cx - hr, cy - hr, cx + hr, cy + hr), val)
    s.d.pieslice(
        [(cx - 80 * scale) * SS, (cy + 44 * scale) * SS, (cx + 80 * scale) * SS, (cy + 204 * scale) * SS],
        180, 360, fill=v(val),
    )


def scene_crm(s):
    s.light(1080, 440, 480, 0.5)
    people = [(1080, 420, 1.4, 0.62), (700, 260, 0.7, 0.32), (820, 640, 0.9, 0.4), (1380, 250, 0.85, 0.4), (1440, 640, 1.0, 0.45), (560, 520, 0.6, 0.28), (1240, 820, 0.75, 0.36), (960, 150, 0.55, 0.26)]
    cx, cy = people[0][0], people[0][1] + 60
    for x, y, sc, val in people[1:]:
        s.line([(cx, cy), (x, y + 50 * sc)], 0.3 + sc * 0.15, 2 + sc * 2, glow=0.2)
    for x, y, sc, val in sorted(people, key=lambda p: p[2]):
        person(s, x, y, sc, val)
        s.gd.ellipse([(x - 120 * sc) * SS, (y - 60 * sc) * SS, (x + 120 * sc) * SS, (y + 200 * sc) * SS], fill=v(val * 0.8))
    for bx, by, bw in ((1180, 250, 200), (640, 440, 150)):
        s.rect((bx, by, bx + bw, by + bw * 0.5), 0.55, radius=24)
        s.poly([(bx + 30, by + bw * 0.5), (bx + 70, by + bw * 0.5), (bx + 26, by + bw * 0.5 + 34)], 0.55)
        for k in range(3):
            s.rect((bx + 26, by + 22 + k * 24, bx + bw - 26 - k * 30, by + 32 + k * 24), 0.25, radius=4)
    ground(s, 960, 0.1, 0.04)


SCENES = {
    "trading": scene_trading,
    "risk-management": scene_risk,
    "compliance": scene_compliance,
    "wealth-management": scene_wealth,
    "accounting": scene_accounting,
    "learning-management-systems": scene_lms,
    "api-integrations": scene_api,
    "automated-email-response": scene_email,
    "document-automation": scene_docauto,
    "knowledge-base-software": scene_kb,
    "real-estate": scene_realestate,
    "documentation-automation": scene_legaldoc,
    "workflow-automation": scene_workflow,
    "client-relations-management": scene_crm,
}


# -------------------------------------------------------------- engraving ---


def engrave(L, seed):
    """Print a value study through a horizontal line screen in navy and cobalt."""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    L = np.clip(L, 0, 1)
    # slight tonal lift so mid-values carry lines, highlights fill in
    t = np.clip((L - 0.015) / 0.8, 0, 1)
    t = t * t * (3 - 2 * t)
    t = 0.07 + t * 0.93
    period = 3.2
    d = np.abs(((yy + 0.35 * np.sin(xx / 97.0)) % period) / period - 0.5) * 2
    lines = np.clip((t - d) * period / 1.3 + 0.5, 0, 1)
    # vertical hatching blooms in the brightest passages
    period2 = 3.0
    d2 = np.abs((xx % period2) / period2 - 0.5) * 2
    hatch = np.clip(((t - 0.62) / 0.38 - d2) * period2 / 1.3 + 0.5, 0, 1) * (t > 0.62)
    ink = np.maximum(lines, hatch * 0.85)
    ink *= 0.92 + rng.random((H, W), dtype=np.float32) * 0.08
    bg = np.array([7, 11, 32], dtype=np.float32)
    dim = np.array([22, 36, 104], dtype=np.float32)
    hi = np.array([118, 150, 236], dtype=np.float32)
    line_col = dim[None, None, :] + (hi - dim)[None, None, :] * (np.clip(L * 1.15, 0, 1)[..., None] ** 0.8)
    base = bg[None, None, :] + np.array([4, 8, 26], dtype=np.float32)[None, None, :] * L[..., None]
    rgb = base + (line_col - base) * ink[..., None]
    return Image.fromarray(np.clip(rgb, 0, 255).astype("uint8"))


def main():
    os.makedirs(OUT, exist_ok=True)
    wanted = sys.argv[1:] or list(SCENES)
    for i, slug in enumerate(wanted):
        s = Scene(1000 + i)
        SCENES[slug](s)
        img = engrave(s.value(), 1000 + i)
        path = os.path.join(OUT, f"{slug}.jpg")
        img.save(path, "JPEG", quality=84, optimize=True, progressive=True)
        print("wrote", os.path.relpath(path, ROOT), f"{os.path.getsize(path) // 1024} KB")


if __name__ == "__main__":
    main()
