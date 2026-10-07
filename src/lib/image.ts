const MAX_DIMENSION = 640;
const THUMBNAIL_SIZE = 160;
const JPEG_QUALITY = 0.85;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please use JPEG, PNG, WebP, or GIF.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File too large. Maximum size is 25 MB.';
  }
  return null;
}

export function validateUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'URL must use http or https protocol.';
    }
    if (url.length > 2048) {
      return 'URL is too long (max 2048 characters).';
    }
    return null;
  } catch {
    return 'Invalid URL format.';
  }
}

export async function compressImage(file: File): Promise<{ blob: Blob; dataUrl: string; hash: string }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  // Calculate dimensions (max 640px, no upscale)
  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', JPEG_QUALITY);
  });

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const hash = await computeHash(blob);

  return { blob, dataUrl, hash };
}

export async function createThumbnail(file: File | Blob): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  let { width, height } = bitmap;
  const ratio = Math.min(THUMBNAIL_SIZE / width, THUMBNAIL_SIZE / height);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', 0.7);
}

export async function computeHash(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function buildCacheKey(imageHash: string, options: { cutBorders: boolean; anilistId?: number }): string {
  const cb = options.cutBorders ? '1' : '0';
  const id = options.anilistId || 'any';
  return `${imageHash}|cb=${cb}|id=${id}`;
}

export function cropImage(
  imageDataUrl: string,
  crop: { x: number; y: number; width: number; height: number }
): Promise<{ blob: Blob; dataUrl: string; hash: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const sx = (crop.x / 100) * img.width;
      const sy = (crop.y / 100) * img.height;
      const sw = (crop.width / 100) * img.width;
      const sh = (crop.height / 100) * img.height;

      let cw = sw, ch = sh;
      if (cw > MAX_DIMENSION || ch > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / cw, MAX_DIMENSION / ch);
        cw = Math.round(cw * ratio);
        ch = Math.round(ch * ratio);
      }

      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);

      const blob = await new Promise<Blob>((r) => {
        canvas.toBlob((b) => r(b!), 'image/jpeg', JPEG_QUALITY);
      });
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      const hash = await computeHash(blob);
      resolve({ blob, dataUrl, hash });
    };
    img.src = imageDataUrl;
  });
}

export function captureVideoFrame(
  video: HTMLVideoElement,
  time: number
): Promise<{ blob: Blob; dataUrl: string; hash: string }> {
  return new Promise((resolve, reject) => {
    video.currentTime = time;
    video.onseeked = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        let { width, height } = canvas;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const outCanvas = document.createElement('canvas');
        outCanvas.width = width;
        outCanvas.height = height;
        const ctx = outCanvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, width, height);

        const blob = await new Promise<Blob>((r) => {
          outCanvas.toBlob((b) => r(b!), 'image/jpeg', JPEG_QUALITY);
        });
        const dataUrl = outCanvas.toDataURL('image/jpeg', JPEG_QUALITY);
        const hash = await computeHash(blob);
        resolve({ blob, dataUrl, hash });
      } catch {
        reject(new Error('Failed to capture frame. Try using a screenshot instead.'));
      }
    };
  });
}
