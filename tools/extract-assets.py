# Extract temporary object cut-outs and state frames from the Workshop B research videos.
# Usage (from the repo root):  python3 tools/extract-assets.py path/to/isnet-general-use.onnx
# Needs ffmpeg, numpy, pillow, onnxruntime, opencv-python-headless.
# Model: isnet-general-use.onnx from https://github.com/danielgatis/rembg/releases/tag/v0.0.0
# J lists, per object: source video, the time (s) of the hero frame, and the pinch / press / squeeze frames.
import subprocess, sys, os, tempfile, numpy as np, onnxruntime as ort
from PIL import Image, ImageFilter
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=f'{ROOT}/assets/materials'; OUT=f'{ROOT}/assets/objects'
TMP=os.path.join(tempfile.gettempdir(),'iam-frame.png')
SESS=ort.InferenceSession(sys.argv[1])
J={ # slug: (video, hero t, [pinch t, press t, squeeze t])
 'orange':('004-workshop-b',2,[10.5,21,37]),
 'ice':('002-workshop-b-05',0.3,[8,27,42]),
 'tomato':('006-workshop-b-02',0.5,[4,20,42]),
 'cream-foam':('009-workshop-b-03',12,[24,44,58]),
 'rose':('012-workshop-b-06',0.3,[6,28,52]),
 'cabbage-leaf':('013-workshop-b-03-leaf',0.3,[6,22,45]),
}
def frame(v,t):
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',f'{SRC}/{v}.mp4','-frames:v','1','-q:v','1',TMP],check=True)
    im=Image.open(TMP).convert('RGB')
    if v.endswith('leaf'):  # side labels 'Vegetable leaf' burned into rows 343-379
        import cv2
        a=np.asarray(im).copy(); m=np.zeros(a.shape[:2],'uint8')
        for x0,x1 in ((20,290),(1005,1270)):
            r=a[336:388,x0:x1]; m[336:388,x0:x1]=(r.min(-1)>120).astype('uint8')*255
        m=cv2.dilate(m,np.ones((7,7),'uint8'))
        im=Image.fromarray(cv2.inpaint(a,m,5,cv2.INPAINT_TELEA))
    return im
def mask(im):
    x=np.asarray(im.resize((1024,1024),Image.BICUBIC)).astype(np.float32)/255
    x=(x-0.5)/1.0; x=x.transpose(2,0,1)[None]
    m=SESS.run(None,{'input_image':x})[0][0,0]
    m=(m-m.min())/(m.max()-m.min()+1e-6)
    return Image.fromarray((m*255).astype('uint8')).resize(im.size,Image.BICUBIC)
def cut(slug,v,t):
    im=frame(v,t).crop((150,110,1130,720))  # drop burned-in labels
    a=mask(im); arr=np.asarray(a).astype(float)
    arr=np.clip((arr-90)/140,0,1)*255; a=Image.fromarray(arr.astype('uint8')).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.2))  # erode to drop the dark table halo
    import cv2
    m8=(np.asarray(a)>60).astype('uint8'); n,lab,st,_=cv2.connectedComponentsWithStats(m8)
    big=st[1:,4].max(); keep=np.isin(lab,[i for i in range(1,n) if st[i,4]>0.08*big])
    keep=cv2.dilate(keep.astype('uint8'),np.ones((9,9),'uint8'))
    a=Image.fromarray((np.asarray(a)*keep).astype('uint8'))
    ys,xs=np.where(np.asarray(a)>30); p=24
    box=(max(xs.min()-p,0),max(ys.min()-p,0),min(xs.max()+p,im.width),min(ys.max()+p,im.height))
    im.putalpha(a); im=im.crop(box)
    s=max(im.size); c=Image.new('RGBA',(s,s),(0,0,0,0)); c.paste(im,((s-im.width)//2,(s-im.height)//2))
    c=c.resize((900,900),Image.LANCZOS) if s<900 else c.resize((900,900),Image.LANCZOS)
    os.makedirs(f'{OUT}/{slug}',exist_ok=True); c.save(f'{OUT}/{slug}/cutout.webp',quality=90);
def states(slug,v,t0,ts):
    for i,t in enumerate([t0]+ts):
        im=frame(v,t).crop((230,105,1050,720)).resize((960,720),Image.LANCZOS)
        im.save(f'{OUT}/{slug}/state-0{i+1}.jpg',quality=84)
for slug,(v,t,ts) in J.items():
    cut(slug,v,t); states(slug,v,t,ts); print(slug)
