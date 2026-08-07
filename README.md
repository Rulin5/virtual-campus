# Peter Oravec portfolio reconstruction

Self-contained Phaser 3 reconstruction of the publicly visible
`peteroravec.com` portfolio.

Start a static server in this directory, then open `index.html` through that
server. The project does not require a build step or an internet connection.

Controls:

- Arrow keys or WASD: move
- E: interact near a portfolio zone
- Touchscreen: virtual joystick
- HUD buttons: open portfolio sections

Regenerate the offline map after changing the Tiled data:

```text
python automation/scripts/render_map.py
```

Reverse-engineering evidence is kept under `reverse-evidence/`; reports are
under `reports/`.
