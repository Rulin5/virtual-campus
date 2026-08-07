# Differential testing

## Verified clone states

- Local entry responds successfully.
- Loading and Play states appear.
- Phaser creates one canvas at viewport size.
- The 2240×2240 reconstructed map renders from local assets.
- Original player sprite renders above the map.
- HUD exposes six portfolio sections plus map and language controls.
- About modal opens with `active is-visible` state.
- No JavaScript error was reported during the final browser run.
- The HTML entry point contains zero external script or stylesheet references.

## Visual result

The reconstructed scene uses the original public tile and character artwork,
not a screenshot or embedded original site. Camera scale and pixel rendering
match the public site's low-resolution-canvas approach.

## Remaining differences

Exact collision masks, all ambient particle effects, all NPC schedules and
every original easter egg require further state-by-state reconstruction.
