/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Backup card reading that runs entirely in the browser (Tesseract OCR), used when the AI service is
// unavailable. The engine is served from /ocr (copied at build time) and loaded only when first needed.

import type { Worker } from 'tesseract.js';

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        workerPath: '/ocr/worker.min.js',
        corePath: '/ocr',
        langPath: '/ocr/lang',
        workerBlobURL: false,
      });
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
      return worker;
    })().catch((err) => {
      workerPromise = null; // allow a retry later
      throw err;
    });
  }
  return workerPromise;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Crop a horizontal band of the photo, upscale it and boost contrast so small print is readable. */
function bandToCanvas(img: HTMLImageElement, from: number, to: number): HTMLCanvasElement {
  const sy = Math.round(img.height * from);
  const sh = Math.max(1, Math.round(img.height * (to - from)));
  const scale = Math.min(3, Math.max(1, 1400 / img.width));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.filter = 'grayscale(1) contrast(1.4)';
  ctx.drawImage(img, 0, sy, img.width, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Read the name band (top of the card) and the number band (bottom) from a card photo. */
export async function readCardText(dataUrl: string): Promise<{ top: string; bottom: string }> {
  const [worker, img] = await Promise.all([getWorker(), loadImage(dataUrl)]);
  const top = await worker.recognize(bandToCanvas(img, 0, 0.2));
  const bottom = await worker.recognize(bandToCanvas(img, 0.8, 1));
  return { top: top.data.text, bottom: bottom.data.text };
}
