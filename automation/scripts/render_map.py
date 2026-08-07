"""Render the public Tiled map into one deterministic offline background."""
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
MAP_PATH = ROOT / "assets" / "maps" / "final_map_runtime.json"
OUTPUT = ROOT / "assets" / "maps" / "portfolio-map.webp"
VISIBLE_LAYERS = {f"layer{i}" for i in range(1, 11)}
FLIP_H = 0x80000000
FLIP_V = 0x40000000
FLIP_D = 0x20000000
GID_MASK = ~(FLIP_H | FLIP_V | FLIP_D)


def main() -> None:
    data = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    tile_width = data["tilewidth"]
    tile_height = data["tileheight"]
    target = Image.new(
        "RGBA",
        (data["width"] * tile_width, data["height"] * tile_height),
        (32, 96, 32, 255),
    )

    tilesets = []
    for spec in data["tilesets"]:
        image = Image.open(MAP_PATH.parent / spec["image"]).convert("RGBA")
        tilesets.append((spec["firstgid"], spec, image))
    tilesets.sort(key=lambda item: item[0])

    for layer in data["layers"]:
        if layer["name"] not in VISIBLE_LAYERS:
            continue
        for index, raw_gid in enumerate(layer["data"]):
            if raw_gid == 0:
                continue
            gid = raw_gid & GID_MASK
            selected = None
            for item in tilesets:
                if item[0] <= gid:
                    selected = item
                else:
                    break
            if selected is None:
                continue
            first_gid, spec, sheet = selected
            local_id = gid - first_gid
            columns = spec["columns"]
            sx = (local_id % columns) * tile_width
            sy = (local_id // columns) * tile_height
            tile = sheet.crop((sx, sy, sx + tile_width, sy + tile_height))
            if raw_gid & FLIP_D:
                tile = tile.transpose(Image.Transpose.TRANSPOSE)
            if raw_gid & FLIP_H:
                tile = ImageOps.mirror(tile)
            if raw_gid & FLIP_V:
                tile = ImageOps.flip(tile)
            x = (index % data["width"]) * tile_width
            y = (index // data["width"]) * tile_height
            target.alpha_composite(tile, (x, y))

    target.save(OUTPUT, "WEBP", lossless=True, method=6)
    print(f"Rendered {OUTPUT} ({target.width}x{target.height})")


if __name__ == "__main__":
    main()
