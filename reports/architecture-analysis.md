# Architecture analysis

## Detection evidence

The public site identifies Angular runtime chunks (`main-RV3Z53H4.js`,
`chunk-RA2FASQA.js`) and loads Phaser 3 from `assets/js/phaser.min.js`.
The main game scene is loaded from `chunk-WMFY56ZM.js`. Runtime inventory
observed 218 public resources: 177 images, 8 scripts, 2 stylesheets and 31
other resources.

## Runtime flow

1. Angular renders loading and Play states.
2. Phaser creates a low-resolution pixel-art canvas scaled to the viewport.
3. A Tiled JSON map supplies 24 layers and a 140×140 tile world.
4. Phaser renders the player, NPCs, vehicles and effects above map layers.
5. HTML modals render above the canvas for portfolio content.

## Reconstruction architecture

The clone keeps the same HTML-over-Phaser layering while using maintainable
plain JavaScript. The 16 public map tilesets are deterministically composed
from `final_map_small.json` into `portfolio-map.webp`. Phaser handles animated
player/NPC sprites, input and camera behavior; DOM handles navigation and
content panels.

## Network and storage

No private API, authentication, WebSocket or database dependency is required
for public behavior. The clone contains no external stylesheet, script, image
or font URL in its HTML entry point.

## Source maps

No `sourceMappingURL` marker was found in the collected production JavaScript
or stylesheet files. No public source map was identified.

## Risks

- Exact original collision geometry, vehicle schedules and every ambient
  effect are not fully reproduced.
- Public site resources remain subject to their original copyright.
- The original site may change after this evidence snapshot.
