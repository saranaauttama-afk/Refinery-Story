import sys
from PIL import Image
from collections import deque
def clean(src, dst):
    im = Image.open(src).convert('RGBA'); W, H = im.size; px = im.load()
    # 1. flood-fill background from the border when it is opaque and uniform
    bg = px[0, 0]
    if bg[3] > 0:
        near = lambda c: c[3] > 0 and sum(abs(c[i]-bg[i]) for i in range(3)) < 30
        seen = set(); q = deque((x, y) for x in range(W) for y in (0, H-1)); q.extend((x, y) for y in range(H) for x in (0, W-1))
        while q:
            x, y = q.popleft()
            if (x, y) in seen or not (0 <= x < W and 0 <= y < H): continue
            seen.add((x, y))
            if not near(px[x, y]): continue
            px[x, y] = (0, 0, 0, 0)
            q.extend(((x+1, y), (x-1, y), (x, y+1), (x, y-1)))
    # 2. keep only the big connected blobs (drops watermarks/specks)
    lab = {}; blobs = []
    for y in range(H):
        for x in range(W):
            if px[x, y][3] < 128 or (x, y) in lab: continue
            n = len(blobs); blob = []; q = deque([(x, y)]); lab[(x, y)] = n
            while q:
                a, b = q.popleft(); blob.append((a, b))
                for c, d in ((a+1, b), (a-1, b), (a, b+1), (a, b-1), (a+1, b+1), (a-1, b-1), (a+1, b-1), (a-1, b+1)):
                    if 0 <= c < W and 0 <= d < H and (c, d) not in lab and px[c, d][3] >= 128:
                        lab[(c, d)] = n; q.append((c, d))
            blobs.append(blob)
    big = max(len(b) for b in blobs)
    for b in blobs:
        if len(b) < big * 0.02:
            for a, c in b: px[a, c] = (0, 0, 0, 0)
    for y in range(H):
        for x in range(W):
            r, g, b_, a = px[x, y]; px[x, y] = (r, g, b_, 255 if a >= 128 else 0)
    # 3. crop: symmetric around the centre column, bottom = lowest art row (diamond tip)
    bb = im.getbbox(); cx = W // 2
    half = max(cx - bb[0], bb[2] - cx)
    im = im.crop((cx - half, bb[1], cx + half, bb[3]))
    im.save(dst); return im.size
for arg in sys.argv[1:]:
    src, dst = arg.split(':'); print(dst, *clean(src, dst))
