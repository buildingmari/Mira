/**
 * Downscales a picked photo to a JPEG data URL before it's sent to the AI.
 * Phone camera photos are 3–8 MB; base64 makes that ~33% bigger again, which
 * makes uploads slow on mobile data and can exceed request limits. A receipt
 * stays perfectly readable for OCR at ~1600px on the long edge.
 */
export async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<string> {
  const original = await readAsDataURL(file);
  // GIF/SVG etc. or anything the browser can't decode: send as-is.
  if (!/^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(file.type)) return original;
  try {
    const img = await loadImage(original);
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.fillStyle = '#fff'; // transparent PNGs -> white, not black, as JPEG
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL('image/jpeg', quality);
    return out.length < original.length ? out : original;
  } catch {
    return original;
  }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
