#!/usr/bin/env python3
"""Generate KLB Finance Market logo and PWA icon set."""

from __future__ import annotations

import io
import struct
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "icons"
SOURCE = Path(
    "/cursor/stores/bc-ede699d6-4178-450a-834e-8b9738ddbd59/media/klb-finance-logo.png"
)
NAVY = (10, 18, 64)  # #0a1240


def remove_background(img: Image.Image) -> Image.Image:
    import numpy as np
    from collections import deque

    arr = np.array(img.convert("RGBA"), dtype=np.uint8)
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3].astype(np.int16)
    alpha = arr[:, :, 3]
    mx = rgb.max(axis=2)

    remove = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    for y in range(h):
        for x in range(w):
            if alpha[y, x] < 20:
                remove[y, x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not remove[ny, nx] and mx[ny, nx] < 45:
                remove[ny, nx] = True
                q.append((nx, ny))

    arr[remove, 3] = 0
    interior_dark = (arr[:, :, 3] > 0) & (mx < 32)
    arr[interior_dark, 3] = 0
    arr[arr[:, :, 3] == 0, :3] = 0

    ys, xs = np.where(arr[:, :, 3] > 12)
    if len(xs) == 0:
        raise RuntimeError("Background removal removed entire image")

    cropped = arr[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
    return Image.fromarray(cropped, "RGBA")


def fit_on_navy(logo: Image.Image, size: int, padding: float = 0.05) -> Image.Image:
    """Opaque square icon: deep navy fill, logo composited on top."""
    canvas = Image.new("RGB", (size, size), NAVY)
    inner = int(size * (1 - padding * 2))
    fitted = ImageOps.contain(logo, (inner, inner), Image.Resampling.LANCZOS)
    ox = (size - fitted.width) // 2
    oy = (size - fitted.height) // 2
    canvas.paste(fitted, (ox, oy), fitted)
    return canvas


def write_ico(path: Path, icon_rgb: Image.Image) -> None:
    sizes = [16, 32, 48]
    entries = []
    for size in sizes:
        icon = icon_rgb.resize((size, size), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        icon.save(buf, format="PNG")
        entries.append((size, buf.getvalue()))

    header = struct.pack("<HHH", 0, 1, len(entries))
    offset = 6 + 16 * len(entries)
    directory = b""
    blobs = b""
    for size, data in entries:
        directory += struct.pack("<BBBBHHII", size, size, 0, 0, 1, 32, len(data), offset)
        blobs += data
        offset += len(data)

    path.write_bytes(header + directory + blobs)


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    logo = remove_background(Image.open(SOURCE))
    logo.save(ICONS / "logo-transparent.png", optimize=True)
    logo.save(ICONS / "logo-finance.png", optimize=True)

    fit_on_navy(logo, 32, 0.04).save(ICONS / "favicon-32.png", optimize=True)
    fit_on_navy(logo, 180, 0.05).save(ICONS / "apple-touch-icon.png", optimize=True)
    fit_on_navy(logo, 192, 0.04).save(ICONS / "icon-192.png", optimize=True)
    fit_on_navy(logo, 512, 0.04).save(ICONS / "icon-512.png", optimize=True)
    fit_on_navy(logo, 192, 0.12).save(ICONS / "icon-maskable-192.png", optimize=True)
    fit_on_navy(logo, 512, 0.12).save(ICONS / "icon-maskable-512.png", optimize=True)
    write_ico(ROOT / "favicon.ico", fit_on_navy(logo, 32, 0.04))

    preview = fit_on_navy(logo, 512, 0.04)
    preview.save(
        Path(
            "/cursor/stores/bc-ede699d6-4178-450a-834e-8b9738ddbd59/media/icone-navy.png"
        ),
        optimize=True,
    )

    print(f"Generated icons in {ICONS}")
    print(f"Logo size: {logo.size}")


if __name__ == "__main__":
    main()
