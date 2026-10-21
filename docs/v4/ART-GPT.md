# Art made with ChatGPT (big pictures)

PixelLab makes everything that sits in the yard (isometric sprites, tiles,
vehicles, workers, small icons). ChatGPT makes the big pictures below. Sarana
generates them and drops the PNGs into the chat; Claude pixelates them
(downscale + nearest-neighbour + game palette) so they match the sprites.

## Style line (paste first in every background/scene prompt; the grid prompts below already include it)

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

## Staff portraits — 36 people, 3 images (square 1024×1024)

Every image is a 4×3 grid of 12 portraits. Thai/Southeast Asian people, a mix of
men and women and ages. Claude cuts each cell out.

**staff_1.png** (operator + chemist)

> Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines, bright cheerful flat colours with simple 3-tone shading, palette steel grey, cream, safety yellow #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E, dark ink #14110F. No text, no letters, no logos, no watermark. A 4×3 grid of 12 separate head-and-shoulders portraits on a plain light cream background, each in its own equal square cell with a thin gap, every person different (age, face, hair, body type), friendly expression, looking at the viewer. Thai and Southeast Asian men and women. Row order: 6 refinery operators in orange coveralls with yellow hard hats (some holding radios), then 6 chemists in white lab coats with safety goggles (some holding test tubes).

**staff_2.png** (engineer + safety)

> Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines, bright cheerful flat colours with simple 3-tone shading, palette steel grey, cream, safety yellow #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E, dark ink #14110F. No text, no letters, no logos, no watermark. A 4×3 grid of 12 separate head-and-shoulders portraits on a plain light cream background, each in its own equal square cell with a thin gap, every person different (age, face, hair, body type), friendly expression, looking at the viewer. Thai and Southeast Asian men and women. Row order: 6 engineers in blue work shirts with white hard hats (some holding wrenches), then 6 safety officers in hi-vis vests with red hard hats (some holding clipboards).

**staff_3.png** (manager + director)

> Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines, bright cheerful flat colours with simple 3-tone shading, palette steel grey, cream, safety yellow #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E, dark ink #14110F. No text, no letters, no logos, no watermark. A 4×3 grid of 12 separate head-and-shoulders portraits on a plain light cream background, each in its own equal square cell with a thin gap, every person different (age, face, hair, body type), friendly expression, looking at the viewer. Thai and Southeast Asian men and women. Row order: 6 managers in shirts and ties (some with a tablet or a hard hat under the arm), then 6 plant directors in dark suits with a gold pin, confident smiles.

## Customers — 40 people, 5 images (square 1024×1024)

One image per customer group, a 4×2 grid of 8 (one per customer in the game).

**customers_gas.png**

> Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines, bright cheerful flat colours with simple 3-tone shading, palette steel grey, cream, safety yellow #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E, dark ink #14110F. No text, no letters, no logos, no watermark. A 4×2 grid of 8 separate head-and-shoulders portraits on a plain light cream background, each in its own equal square cell with a thin gap, every person different (age, face, hair, body type), friendly expression, looking at the viewer. Thai and international business people: gas station owners and attendants, caps and uniforms, some next to a small fuel pump.

**customers_air.png**

> Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines, bright cheerful flat colours with simple 3-tone shading, palette steel grey, cream, safety yellow #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E, dark ink #14110F. No text, no letters, no logos, no watermark. A 4×2 grid of 8 separate head-and-shoulders portraits on a plain light cream background, each in its own equal square cell with a thin gap, every person different (age, face, hair, body type), friendly expression, looking at the viewer. Thai and international business people: airline pilots and airline fuel buyers in uniform, some holding a small plane model.

**customers_shipping.png**

> Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines, bright cheerful flat colours with simple 3-tone shading, palette steel grey, cream, safety yellow #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E, dark ink #14110F. No text, no letters, no logos, no watermark. A 4×2 grid of 8 separate head-and-shoulders portraits on a plain light cream background, each in its own equal square cell with a thin gap, every person different (age, face, hair, body type), friendly expression, looking at the viewer. Thai and international business people: ship captains and shipping company buyers, captain hats, anchor badges.

**customers_industrial.png**

> Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines, bright cheerful flat colours with simple 3-tone shading, palette steel grey, cream, safety yellow #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E, dark ink #14110F. No text, no letters, no logos, no watermark. A 4×2 grid of 8 separate head-and-shoulders portraits on a plain light cream background, each in its own equal square cell with a thin gap, every person different (age, face, hair, body type), friendly expression, looking at the viewer. Thai and international business people: factory buyers in grey jackets and work clothes, some holding a box of plastic pellets or a wax block.

**customers_government.png**

> Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines, bright cheerful flat colours with simple 3-tone shading, palette steel grey, cream, safety yellow #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E, dark ink #14110F. No text, no letters, no logos, no watermark. A 4×2 grid of 8 separate head-and-shoulders portraits on a plain light cream background, each in its own equal square cell with a thin gap, every person different (age, face, hair, body type), friendly expression, looking at the viewer. Thai and international business people: public works officials and road engineers in hi-vis vests, some beside traffic cones or an asphalt roller.
