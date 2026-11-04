# High resolution object cut-outs from Lynn's 4K studio videos and photographs (4 Nov 2026).
# Usage (from the repo root):  python3 tools/extract-hd.py path/to/isnet-general-use.onnx path/to/source/folder
# The source folder holds the original DJI files named below. Needs ffmpeg, numpy, pillow,
# onnxruntime, opencv-python-headless, and rawpy for the .DNG.
# Two passes: find the object on the whole frame, then cut it out again from a tight crop,
# so the mask has as much detail as the 4K source allows.
import subprocess, sys, os, tempfile, numpy as np, onnxruntime as ort, cv2
from PIL import Image, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f'{ROOT}/assets/objects'
SESS = ort.InferenceSession(sys.argv[1]); SRC = sys.argv[2]
TMP = os.path.join(tempfile.gettempdir(), 'iam-hd-frame.png')
J = {  # slug: (file, time in s for videos, optional region (x0, y0, x1, y1) to search in)
  'orange': ('DJI_20261001164834_0742_D.MP4', 0, None),
  'tomato': ('DJI_20261001165058_0748_D.MP4', 0.5, None),
  'pear': ('DJI_20261001164752_0741_D.MP4', 0, None),
  'cream-foam': ('DJI_20261001170040_0755_D.MP4', 0.5, None),
  'cabbage-leaf': ('DJI_20261021155626_0776_D.MP4', 0.5, None),
  'rose': ('DJI_20261021160221_0787_D.MP4', 0.5, None),
  'aluminium-foil': ('DJI_20261104211555_0800_D.JPG', None, None),
  'ice': ('DJI_20261104212555_0812_D.JPG', None, None),
  'cleaning-sponge': ('DJI_20261104211921_0805_D.DNG', None, (900, 500, 2900, 1900)),  # skip the room beyond the paper
}
MAX = 1400  # longest side of the saved cut-out

def load(f, t):
    p = f'{SRC}/{f}'
    if t is not None:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', p, '-frames:v', '1', TMP], check=True)
        return Image.open(TMP).convert('RGB')
    if f.upper().endswith('.DNG'):
        import rawpy
        return Image.fromarray(rawpy.imread(p).postprocess(use_camera_wb=True, output_bps=8))
    return Image.open(p).convert('RGB')

def mask(im):
    x = np.asarray(im.resize((1024, 1024), Image.BICUBIC)).astype(np.float32) / 255
    x = (x - 0.5).transpose(2, 0, 1)[None]
    m = SESS.run(None, {'input_image': x})[0][0, 0]
    m = (m - m.min()) / (m.max() - m.min() + 1e-6)
    return cv2.resize(m, im.size, interpolation=cv2.INTER_CUBIC).clip(0, 1)

def largest(m, frac=0.08):
    m8 = (m > .35).astype('uint8'); n, lab, st, _ = cv2.connectedComponentsWithStats(m8)
    if n < 2: return m8
    big = st[1:, 4].max()
    return np.isin(lab, [i for i in range(1, n) if st[i, 4] > frac * big]).astype('uint8')

def cut(slug, f, t, region):
    im = load(f, t)
    if region: im = im.crop(region)
    keep = largest(mask(im))  # pass 1: where is the object
    ys, xs = np.where(keep); w, h = xs.max() - xs.min(), ys.max() - ys.min(); p = int(max(w, h) * .25)
    box = (max(xs.min() - p, 0), max(ys.min() - p, 0), min(xs.max() + p, im.width), min(ys.max() + p, im.height))
    c = im.crop(box)
    m = mask(c)  # pass 2: detailed mask on the tight crop
    m = np.clip((m - .3) / .5, 0, 1)
    k = cv2.dilate(largest(m), np.ones((15, 15), 'uint8'))
    a = (m * k * 255).astype('uint8')
    a = cv2.erode(a, np.ones((3, 3), 'uint8')); a = cv2.GaussianBlur(a, (0, 0), .8)  # trim the dark table halo
    ys, xs = np.where(a > 20); q = 30
    b2 = (max(xs.min() - q, 0), max(ys.min() - q, 0), min(xs.max() + q, c.width), min(ys.max() + q, c.height))
    c.putalpha(Image.fromarray(a)); c = c.crop(b2)
    s = max(c.size); sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.paste(c, ((s - c.width) // 2, (s - c.height) // 2))
    if s > MAX: sq = sq.resize((MAX, MAX), Image.LANCZOS)
    os.makedirs(f'{OUT}/{slug}', exist_ok=True)
    sq.save(f'{OUT}/{slug}/cutout.webp', quality=92, method=6)
    print(slug, 'source object', s, 'px, saved', sq.size[0])

for slug, (f, t, r) in J.items():
    if len(sys.argv) > 3 and slug not in sys.argv[3:]: continue
    cut(slug, f, t, r)
