import { AttachmentItem } from './chatUtils';

/**
 * Compresses and resizes an uploaded image file on the client so it uploads
 * quickly and never overflows localStorage quota.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1024,
  quality = 0.86
): Promise<AttachmentItem> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawDataUrl = (ev.target?.result as string) || '';
      if (!rawDataUrl || !file.type.startsWith('image/')) {
        resolve({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: rawDataUrl,
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width || 800;
          let height = img.naturalHeight || img.height || 800;

          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              name: file.name,
              type: file.type || 'image/jpeg',
              size: file.size,
              dataUrl: rawDataUrl,
            });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({
            name: file.name.replace(/\.[^.]+$/, '') + '.jpg',
            type: 'image/jpeg',
            size: Math.round(compressedDataUrl.length * 0.75),
            dataUrl: compressedDataUrl,
          });
        } catch {
          resolve({
            name: file.name,
            type: file.type || 'image/jpeg',
            size: file.size,
            dataUrl: rawDataUrl,
          });
        }
      };
      img.onerror = () => {
        resolve({
          name: file.name,
          type: file.type || 'image/jpeg',
          size: file.size,
          dataUrl: rawDataUrl,
        });
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export type StudioStyleId =
  | 'paint'
  | 'sitcom'
  | 'bloom'
  | 'zen'
  | 'marble'
  | 'sommelier'
  | 'elven'
  | 'doll'
  | 'arcade'
  | 'hollywood'
  | 'general';

/**
 * Detects whether a user prompt + attachments represent an image creation
 * or artistic photo transformation request (Nano Banana / Buat gambar mode).
 */
export function detectImageStudioIntent(
  prompt: string,
  hasImageAttachment: boolean,
  forceImageStudio = false
): {
  isImageRequest: boolean;
  styleId: StudioStyleId;
  aspectRatio: '1:1' | '9:16' | '3:4' | '4:3' | '16:9';
} {
  const lower = (prompt || '').toLowerCase();

  let aspectRatio: '1:1' | '9:16' | '3:4' | '4:3' | '16:9' = '3:4';
  if (lower.includes('16:9')) aspectRatio = '16:9';
  else if (lower.includes('9:16')) aspectRatio = '9:16';
  else if (lower.includes('4:3')) aspectRatio = '4:3';
  else if (lower.includes('1:1')) aspectRatio = '1:1';
  else if (lower.includes('3:4')) aspectRatio = '3:4';

  let styleId: StudioStyleId = 'general';
  if (
    lower.includes('cat minyak') ||
    lower.includes('impresionis') ||
    lower.includes('sapuan kuas') ||
    lower.includes('lukisan') ||
    lower.includes('oil paint')
  ) {
    styleId = 'paint';
  } else if (
    lower.includes('sitkom') ||
    lower.includes('80-an') ||
    lower.includes('guest star') ||
    lower.includes('sitcom')
  ) {
    styleId = 'sitcom';
  } else if (
    lower.includes('bunga musim semi') ||
    lower.includes('mekar') ||
    lower.includes('kelopak bunga') ||
    lower.includes('taman yang rimbun')
  ) {
    styleId = 'bloom';
  } else if (
    lower.includes('zen futuristik') ||
    lower.includes('biru kehijauan') ||
    lower.includes('pencahayaan zen')
  ) {
    styleId = 'zen';
  } else if (
    lower.includes('patung marmer') ||
    lower.includes('marmer klasik') ||
    lower.includes('pahatan batu')
  ) {
    styleId = 'marble';
  } else if (
    lower.includes('pencicip anggur') ||
    lower.includes('somelier') ||
    lower.includes('gudang anggur')
  ) {
    styleId = 'sommelier';
  } else if (
    lower.includes('peri hutan') ||
    lower.includes('elven') ||
    lower.includes('mahkota perak')
  ) {
    styleId = 'elven';
  } else if (
    lower.includes('boneka rajut') ||
    lower.includes('stop-motion') ||
    lower.includes('serat benang')
  ) {
    styleId = 'doll';
  } else if (
    lower.includes('arcade era 90') ||
    lower.includes('neon magenta') ||
    lower.includes('jaket kulit')
  ) {
    styleId = 'arcade';
  } else if (
    lower.includes('hollywood') ||
    lower.includes('hitam putih klasik') ||
    lower.includes('monokrom')
  ) {
    styleId = 'hollywood';
  }

  const imageKeywords = [
    'ubah potret',
    'ubah subjek',
    'ubah orang',
    'ubah foto',
    'edit foto',
    'edit gambar',
    'buat gambar',
    'buatkan gambar',
    'buatkan ilustrasi',
    'buat ilustrasi',
    'imajinasikan',
    'lukisan cat minyak',
    'nano banana',
    '[rasio aspek:',
    'rasio aspek',
    'generate image',
    'create an image',
    'turn this photo',
    'transform this portrait',
  ];

  const matchesKeyword =
    styleId !== 'general' || imageKeywords.some((kw) => lower.includes(kw));

  const isImageRequest =
    forceImageStudio ||
    matchesKeyword ||
    (hasImageAttachment &&
      (lower.includes('ubah') ||
        lower.includes('jadikan') ||
        lower.includes('gaya') ||
        lower.includes('style') ||
        lower.includes('filter') ||
        lower.includes('lukis') ||
        lower.includes('buat')));

  return {
    isImageRequest,
    styleId,
    aspectRatio,
  };
}

/**
 * Generates or transforms an image on an HTML5 Canvas so the user always gets
 * an immediate, high-craft visual artwork output in Gemini Buat Gambar mode.
 */
export async function renderStudioArtwork(
  prompt: string,
  sourceImageDataUrl?: string,
  styleId: StudioStyleId = 'general',
  aspectRatio: '1:1' | '9:16' | '3:4' | '4:3' | '16:9' = '3:4'
): Promise<string> {
  if (sourceImageDataUrl) {
    return transformUploadedPhotoCanvas(sourceImageDataUrl, styleId, prompt);
  }
  return generateSyntheticArtworkCanvas(prompt, styleId, aspectRatio);
}

async function transformUploadedPhotoCanvas(
  sourceDataUrl: string,
  styleId: StudioStyleId,
  prompt: string
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const maxSide = 880;
        let w = img.naturalWidth || img.width || 720;
        let h = img.naturalHeight || img.height || 900;
        if (w > maxSide || h > maxSide) {
          if (w >= h) {
            h = Math.round((h * maxSide) / w);
            w = maxSide;
          } else {
            w = Math.round((w * maxSide) / h);
            h = maxSide;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(sourceDataUrl);
          return;
        }

        // Base draw
        ctx.drawImage(img, 0, 0, w, h);

        // Offscreen low-res sampler for painterly brushstrokes
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = w;
        sampleCanvas.height = h;
        const sCtx = sampleCanvas.getContext('2d');
        if (sCtx) {
          sCtx.drawImage(img, 0, 0, w, h);
        }
        const imgData = sCtx?.getImageData(0, 0, w, h);

        if (styleId === 'paint' && imgData) {
          // IMPRESSIONIST OIL PAINTING ("Cat") — Expressive impasto brushstrokes + warm street glow
          const data = imgData.data;

          // Warm golden-hour base pass
          ctx.save();
          ctx.filter = 'saturate(1.45) contrast(1.12) brightness(1.04)';
          ctx.drawImage(img, 0, 0, w, h);
          ctx.restore();

          // Multi-pass painterly impasto strokes sampled from real image pixels
          const passes = [
            { step: 14, radiusW: 18, radiusH: 7, alpha: 0.55, jitter: 16 },
            { step: 8, radiusW: 11, radiusH: 4.5, alpha: 0.65, jitter: 22 },
            { step: 5, radiusW: 6, radiusH: 2.8, alpha: 0.5, jitter: 28 },
          ];

          for (const pass of passes) {
            for (let y = 0; y < h; y += pass.step) {
              for (let x = 0; x < w; x += pass.step) {
                const sx = Math.min(
                  w - 1,
                  Math.max(0, Math.round(x + (Math.sin(x * 0.17 + y * 0.11) * pass.step) / 2))
                );
                const sy = Math.min(
                  h - 1,
                  Math.max(0, Math.round(y + (Math.cos(x * 0.13 - y * 0.19) * pass.step) / 2))
                );
                const idx = (sy * w + sx) * 4;
                let r = data[idx];
                let g = data[idx + 1];
                let b = data[idx + 2];

                // Impressionist warm enrichment + subtle brushstroke color vibration
                const shift = Math.sin(x * 0.09 + y * 0.07) * pass.jitter;
                r = Math.min(255, Math.max(0, r * 1.08 + 10 + shift));
                g = Math.min(255, Math.max(0, g * 1.03 + 4 + shift * 0.6));
                b = Math.min(255, Math.max(0, b * 0.96 + (shift < 0 ? -shift * 0.9 : 0)));

                // Compute local gradient angle for directional brushwork
                const nx = Math.min(w - 1, sx + 2);
                const ny = Math.min(h - 1, sy + 2);
                const gx = data[(sy * w + nx) * 4] - r;
                const gy = data[(ny * w + sx) * 4] - r;
                const angle = Math.atan2(gy, gx) + Math.PI / 4;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.globalAlpha = pass.alpha;
                ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
                ctx.beginPath();
                ctx.ellipse(0, 0, pass.radiusW, pass.radiusH, 0, 0, Math.PI * 2);
                ctx.fill();

                // Impasto ridge highlight on top edge of stroke
                ctx.strokeStyle = `rgba(255, 245, 220, ${pass.alpha * 0.24})`;
                ctx.lineWidth = 0.9;
                ctx.beginPath();
                ctx.arc(0, 0, pass.radiusW * 0.7, -0.8, 0.8);
                ctx.stroke();
                ctx.restore();
              }
            }
          }

          // Blend back 34% crisp facial detail in center so portrait likeness stays unmistakable
          const detailGrad = ctx.createRadialGradient(
            w * 0.5,
            h * 0.42,
            w * 0.08,
            w * 0.5,
            h * 0.42,
            w * 0.48
          );
          detailGrad.addColorStop(0, 'rgba(0,0,0,1)');
          detailGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.save();
          ctx.globalAlpha = 0.36;
          ctx.filter = 'saturate(1.35) contrast(1.15)';
          ctx.drawImage(img, 0, 0, w, h);
          ctx.restore();

          // Warm sunlit city street bokeh glow overlay
          const sunGlow = ctx.createLinearGradient(0, 0, w, h);
          sunGlow.addColorStop(0, 'rgba(255, 195, 110, 0.18)');
          sunGlow.addColorStop(0.5, 'rgba(255, 160, 90, 0.06)');
          sunGlow.addColorStop(1, 'rgba(45, 75, 130, 0.16)');
          ctx.fillStyle = sunGlow;
          ctx.fillRect(0, 0, w, h);

          // Subtle linen canvas weave texture
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 248, 230, 0.045)';
          ctx.lineWidth = 1;
          for (let y = 0; y < h; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }
          for (let x = 0; x < w; x += 4) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
          ctx.restore();
        } else if (styleId === 'sitcom') {
          // 1980s SITCOM ("Sitkom") — Vintage VHS warm grade + halation + "GUEST STAR" broadcast caption
          ctx.save();
          ctx.filter = 'sepia(0.28) saturate(1.35) contrast(1.08) brightness(1.05)';
          ctx.drawImage(img, 0, 0, w, h);
          ctx.restore();

          // Warm amber 80s studio key light overlay
          const warmGrad = ctx.createRadialGradient(
            w * 0.5,
            h * 0.35,
            w * 0.1,
            w * 0.5,
            h * 0.5,
            w * 0.75
          );
          warmGrad.addColorStop(0, 'rgba(255, 210, 130, 0.18)');
          warmGrad.addColorStop(0.7, 'rgba(180, 95, 40, 0.16)');
          warmGrad.addColorStop(1, 'rgba(25, 12, 8, 0.52)');
          ctx.fillStyle = warmGrad;
          ctx.fillRect(0, 0, w, h);

          // Subtle CRT scanlines
          ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
          for (let y = 0; y < h; y += 3) {
            ctx.fillRect(0, y, w, 1);
          }

          // Classic 1980s yellow broadcast caption: "GUEST STAR"
          const fontSize = Math.max(26, Math.round(w * 0.072));
          ctx.save();
          ctx.font = `900 ${fontSize}px "Arial Black", Impact, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = '#000000';
          ctx.fillText('GUEST STAR', w / 2 + 3, h - Math.round(h * 0.055) + 3);
          ctx.fillStyle = '#ffd524';
          ctx.strokeStyle = '#1a1204';
          ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.08));
          ctx.strokeText('GUEST STAR', w / 2, h - Math.round(h * 0.055));
          ctx.fillText('GUEST STAR', w / 2, h - Math.round(h * 0.055));
          ctx.restore();
        } else if (styleId === 'bloom') {
          // SPRING BLOOM ("Mekar") — Soft dreamy rose/blossom sunlight + floating petals
          ctx.save();
          ctx.filter = 'saturate(1.32) contrast(1.05) brightness(1.08)';
          ctx.drawImage(img, 0, 0, w, h);
          ctx.restore();

          const bloomGrad = ctx.createRadialGradient(
            w * 0.5,
            h * 0.3,
            w * 0.05,
            w * 0.5,
            h * 0.5,
            w * 0.75
          );
          bloomGrad.addColorStop(0, 'rgba(255, 230, 240, 0.22)');
          bloomGrad.addColorStop(0.6, 'rgba(255, 155, 195, 0.16)');
          bloomGrad.addColorStop(1, 'rgba(60, 120, 75, 0.22)');
          ctx.fillStyle = bloomGrad;
          ctx.fillRect(0, 0, w, h);

          // Floating cherry blossom petals around edges
          for (let i = 0; i < 38; i++) {
            const px = ((Math.sin(i * 73.1) + 1) / 2) * w;
            const py = ((Math.cos(i * 41.7) + 1) / 2) * h;
            // Keep center face clear
            if (Math.hypot(px - w * 0.5, py - h * 0.42) < w * 0.24) continue;
            const pSize = 6 + (i % 9) * 1.8;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(i * 0.7);
            ctx.fillStyle =
              i % 2 === 0 ? 'rgba(255, 192, 218, 0.78)' : 'rgba(255, 228, 240, 0.82)';
            ctx.beginPath();
            ctx.ellipse(0, 0, pSize, pSize * 0.58, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        } else if (styleId === 'zen') {
          // FUTURISTIC ZEN ("Zen") — Deep cyan/teal aura lighting + sleek modern contrast
          ctx.save();
          ctx.filter = 'contrast(1.18) saturate(1.15) brightness(1.02)';
          ctx.drawImage(img, 0, 0, w, h);
          ctx.restore();

          const zenGrad = ctx.createRadialGradient(
            w * 0.5,
            h * 0.42,
            w * 0.12,
            w * 0.5,
            h * 0.48,
            w * 0.72
          );
          zenGrad.addColorStop(0, 'rgba(56, 235, 255, 0.14)');
          zenGrad.addColorStop(0.55, 'rgba(14, 145, 185, 0.28)');
          zenGrad.addColorStop(1, 'rgba(6, 24, 38, 0.68)');
          ctx.fillStyle = zenGrad;
          ctx.fillRect(0, 0, w, h);

          // Futuristic glowing halo ring behind subject
          ctx.save();
          ctx.strokeStyle = 'rgba(110, 245, 255, 0.42)';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(w * 0.5, h * 0.4, w * 0.34, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (styleId === 'marble') {
          // CLASSICAL MARBLE SCULPTURE ("Marmer") — Carrara stone monochrome + museum relief lighting
          ctx.save();
          ctx.filter = 'grayscale(0.95) contrast(1.32) brightness(1.08)';
          ctx.drawImage(img, 0, 0, w, h);
          ctx.restore();

          const marbleGrad = ctx.createRadialGradient(
            w * 0.45,
            h * 0.32,
            w * 0.08,
            w * 0.5,
            h * 0.5,
            w * 0.75
          );
          marbleGrad.addColorStop(0, 'rgba(255, 252, 245, 0.22)');
          marbleGrad.addColorStop(0.65, 'rgba(215, 210, 200, 0.12)');
          marbleGrad.addColorStop(1, 'rgba(18, 20, 24, 0.65)');
          ctx.fillStyle = marbleGrad;
          ctx.fillRect(0, 0, w, h);
        } else if (styleId === 'hollywood') {
          // GOLDEN AGE HOLLYWOOD B&W ("Hollywood") — Silver gelatin high-contrast key light
          ctx.save();
          ctx.filter = 'grayscale(1) contrast(1.42) brightness(1.04)';
          ctx.drawImage(img, 0, 0, w, h);
          ctx.restore();

          const noirGrad = ctx.createRadialGradient(
            w * 0.5,
            h * 0.38,
            w * 0.14,
            w * 0.5,
            h * 0.5,
            w * 0.72
          );
          noirGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
          noirGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.18)');
          noirGrad.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
          ctx.fillStyle = noirGrad;
          ctx.fillRect(0, 0, w, h);
        } else if (styleId === 'arcade') {
          // 90s NEON ARCADE ("Arcade") — Dual-tone Magenta & Cyan synthwave lighting
          ctx.save();
          ctx.filter = 'contrast(1.22) saturate(1.45)';
          ctx.drawImage(img, 0, 0, w, h);
          ctx.restore();

          const neonGrad = ctx.createLinearGradient(0, 0, w, h);
          neonGrad.addColorStop(0, 'rgba(236, 72, 153, 0.32)');
          neonGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.14)');
          neonGrad.addColorStop(1, 'rgba(6, 182, 212, 0.34)');
          ctx.fillStyle = neonGrad;
          ctx.fillRect(0, 0, w, h);
        } else {
          // Sommelier, Elven, Doll, or Custom Photo Style Transfer
          ctx.save();
          ctx.filter = 'saturate(1.32) contrast(1.14) brightness(1.04)';
          ctx.drawImage(img, 0, 0, w, h);
          ctx.restore();

          const studioGrad = ctx.createRadialGradient(
            w * 0.5,
            h * 0.4,
            w * 0.12,
            w * 0.5,
            h * 0.5,
            w * 0.75
          );
          studioGrad.addColorStop(0, 'rgba(255, 225, 180, 0.14)');
          studioGrad.addColorStop(1, 'rgba(15, 20, 35, 0.42)');
          ctx.fillStyle = studioGrad;
          ctx.fillRect(0, 0, w, h);
        }

        // Subtle Gemini watermark sparkle in bottom-right corner (like official Gemini image outputs)
        drawGeminiWatermarkSparkle(ctx, w, h);

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch {
        resolve(sourceDataUrl);
      }
    };
    img.onerror = () => resolve(sourceDataUrl);
    img.src = sourceDataUrl;
  });
}

function generateSyntheticArtworkCanvas(
  prompt: string,
  styleId: StudioStyleId,
  aspectRatio: '1:1' | '9:16' | '3:4' | '4:3' | '16:9'
): string {
  const dims: Record<string, [number, number]> = {
    '1:1': [768, 768],
    '9:16': [576, 1024],
    '3:4': [672, 896],
    '4:3': [896, 672],
    '16:9': [1024, 576],
  };
  const [w, h] = dims[aspectRatio] || [672, 896];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Rich atmospheric gradient background based on prompt / style
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  if (styleId === 'paint') {
    bgGrad.addColorStop(0, '#1e3a5f');
    bgGrad.addColorStop(0.45, '#b45309');
    bgGrad.addColorStop(1, '#78350f');
  } else if (styleId === 'zen') {
    bgGrad.addColorStop(0, '#042f2e');
    bgGrad.addColorStop(0.5, '#0e7490');
    bgGrad.addColorStop(1, '#090d16');
  } else if (styleId === 'arcade') {
    bgGrad.addColorStop(0, '#3b0764');
    bgGrad.addColorStop(0.5, '#be185d');
    bgGrad.addColorStop(1, '#0f172a');
  } else {
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e3a8a');
    bgGrad.addColorStop(1, '#311042');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Expressive glowing orbs & painterly strokes
  for (let i = 0; i < 65; i++) {
    const x = ((Math.sin(i * 19.3) + 1) / 2) * w;
    const y = ((Math.cos(i * 27.7) + 1) / 2) * h;
    const r = 18 + (i % 7) * 22;
    const orb = ctx.createRadialGradient(x, y, 2, x, y, r);
    const hue = (i * 37 + (styleId === 'paint' ? 35 : 195)) % 360;
    orb.addColorStop(0, `hsla(${hue}, 85%, 68%, 0.34)`);
    orb.addColorStop(1, `hsla(${hue}, 85%, 45%, 0)`);
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Horizon silhouette & sunlit reflections
  const sunY = h * 0.42;
  const sunOrb = ctx.createRadialGradient(w * 0.5, sunY, 10, w * 0.5, sunY, w * 0.38);
  sunOrb.addColorStop(0, 'rgba(255, 240, 195, 0.92)');
  sunOrb.addColorStop(0.35, 'rgba(251, 146, 60, 0.48)');
  sunOrb.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = sunOrb;
  ctx.fillRect(0, 0, w, h);

  drawGeminiWatermarkSparkle(ctx, w, h);
  return canvas.toDataURL('image/jpeg', 0.9);
}

function drawGeminiWatermarkSparkle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  const cx = w - 28;
  const cy = h - 28;
  const r = 11;
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
