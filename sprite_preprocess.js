
```javascript
export async function preprocessSprite(url, frames = 4, fw = 32, fh = 32) {
  const img = await new Promise((res, rej) => { const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
  const srcC = document.createElement('canvas'); srcC.width = img.naturalWidth; srcC.height = img.naturalHeight;
  const sctx = srcC.getContext('2d', { willReadFrequently: true }); sctx.drawImage(img, 0, 0);
  const outC = document.createElement('canvas'); outC.width = img.naturalWidth; outC.height = img.naturalHeight;
  const octx = outC.getContext('2d'); octx.clearRect(0,0,outC.width,outC.height);
  const isDark = (r,g,b,a)=> a>8 && (0.299*r+0.587*g+0.114*b) < 140; // luma threshold
  for (let f = 0; f < frames; f++) {
    const sx = f * fw, sy = 0;
    const id = sctx.getImageData(sx, sy, fw, fh); const d = id.data;
    const keep = new Uint8Array(fw*fh), seen = new Uint8Array(fw*fh);
    const idx = (x,y)=> y*fw + x;
    const inb = (x,y)=> x>=0&&y>=0&&x<fw&&y<fh;
    const cx = Math.floor(fw/2), cy = Math.floor(fh/2);
    const q = []; const pushIf = (x,y)=>{ const i=idx(x,y)*4; if(!seen[idx(x,y)] && isDark(d[i],d[i+1],d[i+2],d[i+3])){ seen[idx(x,y)]=1; keep[idx(x,y)]=1; q.push(x,y);} };
    pushIf(cx,cy);
    // if center wasn't dark, search small radius for the nearest dark pixel
    if (q.length===0) {
      let found=false; for (let r=1; r<6 && !found; r++) for (let y=-r; y<=r && !found; y++) for (let x=-r; x<=r && !found; x++){
        const px=cx+x, py=cy+y; if(!inb(px,py)) continue; const i=idx(px,py)*4; if(isDark(d[i],d[i+1],d[i+2],d[i+3])){ pushIf(px,py); found=true; }
      }
    }
    while (q.length){ const y=q.pop(), x=q.pop();
      const nb = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
      for (let k=0;k<8;k++){ const nx=x+nb[k][0], ny=y+nb[k][1]; if(!inb(nx,ny)) continue; pushIf(nx,ny); }
    }
    // write out only kept pixels, others fully transparent
    for (let y=0;y<fh;y++) for (let x=0;x<fw;x++){ const i=idx(x,y)*4; if(!keep[idx(x,y)]) d[i+3]=0; }
    octx.putImageData(id, sx, sy);
  }
  return await new Promise(res => outC.toBlob(b => res(URL.createObjectURL(b)), 'image/png'));
}