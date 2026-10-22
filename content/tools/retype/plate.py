import numpy as np
from PIL import Image, ImageFilter
def clean_plate(im, rects, thr=24, grow=13, verbose=False):
    """Remove text from the artwork. `rects` = [(x0,y0,x1,y1), ...] are the only areas that may be repainted
    (so a part of the illustration that sits next to the text is never touched). The background there is a smooth
    gradient, so it is rebuilt from a polynomial fitted to the surrounding pixels (illustration pixels are outliers)."""
    A = np.asarray(im.convert('RGB')).astype(np.float32); H, W, _ = A.shape
    bx0 = min(r[0] for r in rects); by0 = min(r[1] for r in rects); bx1 = max(r[2] for r in rects); by1 = max(r[3] for r in rects)
    reg = A[by0:by1, bx0:bx1].copy(); hh, ww = reg.shape[:2]
    allow = np.zeros((hh, ww), bool)
    for x0, y0, x1, y1 in rects: allow[y0 - by0:y1 - by0, x0 - bx0:x1 - bx0] = True
    yy, xx = np.mgrid[0:hh, 0:ww]; xn = xx / ww; yn = yy / hh
    F = np.stack([xn**i * yn**j for i in range(5) for j in range(5) if i + j <= 4], -1).reshape(-1, 15)
    flat = reg.reshape(-1, 3); bright = reg.mean(-1)
    mask = (bright > 175) | ((reg[..., 0] > 190) & (reg[..., 2] < 150))
    grow_f = lambda m: np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(grow))) > 127
    mask = grow_f(mask)
    for it in range(5):
        idx = np.flatnonzero(~mask.ravel())[::5]
        coef = np.stack([np.linalg.lstsq(F[idx], flat[idx, c], rcond=None)[0] for c in range(3)], -1)
        fit = (F @ coef).reshape(hh, ww, 3); res = np.abs(reg - fit).max(-1); mask = grow_f(res > thr)
        if verbose: print('iter', it, 'masked %.1f%%' % (mask.mean() * 100))
    mask &= allow
    soft = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2))).astype(np.float32)[..., None] / 255
    out = A.copy(); out[by0:by1, bx0:bx1] = reg * (1 - soft) + fit * soft
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)), mask
