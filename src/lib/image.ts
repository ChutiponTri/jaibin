/** Teachable Machine image models expect a 224×224 input. */
export const MODEL_INPUT_SIZE = 224

/**
 * Center-crops and scales an image onto a square canvas sized for the model.
 * The TM library only center-crops, it does not resize, so this step is required
 * for arbitrary-sized uploads.
 */
export function toModelCanvas(
  source: HTMLImageElement,
  size = MODEL_INPUT_SIZE,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is not available')

  const { naturalWidth: w, naturalHeight: h } = source
  const side = Math.min(w, h)
  const sx = (w - side) / 2
  const sy = (h - side) / 2
  ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size)
  return canvas
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('ไม่สามารถเปิดไฟล์รูปภาพนี้ได้'))
    img.src = src
  })
}
