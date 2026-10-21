# Art made with ChatGPT (big pictures)

PixelLab makes everything that sits in the yard (isometric sprites, tiles,
vehicles, workers, small icons). ChatGPT makes the big pictures below. Sarana
generates them and drops the PNGs into the chat; Claude pixelates them
(downscale + nearest-neighbour + game palette) so they match the sprites.

## Style line (paste first in every prompt)

> Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean
> 1px dark outlines, bright cheerful flat colours with simple 3-tone shading,
> palette: steel grey #C9D3DC/#9EABB8/#73818F, cream #FFF6E3, safety yellow
> #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E, dark ink
> #14110F. No text, no letters, no logos, no watermark.

## Backgrounds (portrait 1024×1536)

| file             | prompt (after the style line)                                                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bg_title.png     | A small cheerful oil refinery on a sunny coast seen from a high isometric angle, tanks, a distillation tower, trucks on a road, sea and soft clouds at the top. Leave the middle third calm for a title and buttons. |
| bg_build.png     | Construction site at a refinery: cranes, steel beams, hard hats, blueprints on a table. Soft, low detail, works behind UI.                                                                                           |
| bg_blend.png     | Refinery laboratory bench: glass beakers with coloured oils, mixing vats, sample bottles. Soft, low detail, works behind UI.                                                                                         |
| bg_staff.png     | Cosy staff break room at a refinery: lockers, hard hats on hooks, a coffee machine, a notice board. Soft, low detail.                                                                                                |
| bg_customers.png | Loading dock at dusk: tanker trucks lined up, a fuel station sign, a small airport and a cargo ship far behind. Soft, low detail.                                                                                    |
| bg_company.png   | Company office overlooking the refinery through a big window: desk, trophy shelf, growth chart on the wall. Soft, low detail.                                                                                        |

## Scenes (landscape 1536×1024)

| file            | prompt                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| scene_rank.png  | Refinery staff cheering and throwing hard hats in the air in front of their refinery, confetti, golden light.  |
| scene_award.png | Year-end award ceremony on a small stage, a golden trophy shaped like an oil drop, spotlights, clapping crowd. |

## Staff portraits (square 1024×1024, plain light background, head and shoulders)

Two per job (one man, one woman), friendly face, looking at the viewer.

| job      | clothes / prop                                        |
| -------- | ----------------------------------------------------- |
| operator | orange coverall, yellow hard hat, radio               |
| chemist  | white lab coat, safety goggles on forehead, test tube |
| engineer | blue work shirt, white hard hat, wrench               |
| safety   | hi-vis vest, red hard hat, clipboard                  |
| manager  | shirt and tie, hard hat under the arm, tablet         |
| director | dark suit, gold pin, confident smile                  |

## Customers (square 1024×1024, plain light background, one character + one prop)

| group      | prompt                                                        |
| ---------- | ------------------------------------------------------------- |
| gas        | Gas station owner in a cap next to a small fuel pump          |
| air        | Airline pilot in uniform with a small plane model             |
| shipping   | Ship captain with a captain's hat and an anchor badge         |
| industrial | Factory buyer in a grey jacket with a box of plastic pellets  |
| government | Road works official in a hi-vis vest beside an asphalt roller |
