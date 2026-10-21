/** QR 데이터 URL에 포함된 흰 여백을 잘라 모듈만 남긴다. */
export function trimQrImagePadding(src: string): Promise<string> {
  return new Promise(resolve => {
    const image = new Image()
    image.onload = () => {
      resolve(cropNearWhitePadding(image) ?? src)
    }
    image.onerror = () => resolve(src)
    image.src = src
  })
}

function cropNearWhitePadding(image: HTMLImageElement): string | null {
  const width = image.naturalWidth
  const height = image.naturalHeight
  if (width <= 0 || height <= 0) return null

  const source = document.createElement('canvas')
  source.width = width
  source.height = height
  const sourceContext = source.getContext('2d', { willReadFrequently: true })
  if (!sourceContext) return null

  sourceContext.drawImage(image, 0, 0)
  let pixels: Uint8ClampedArray
  try {
    pixels = sourceContext.getImageData(0, 0, width, height).data
  } catch {
    return null
  }

  const isInk = (index: number) => {
    const alpha = pixels[index + 3] ?? 0
    if (alpha < 16) return false
    const red = pixels[index] ?? 255
    const green = pixels[index + 1] ?? 255
    const blue = pixels[index + 2] ?? 255
    return red < 250 || green < 250 || blue < 250
  }

  let top = 0
  let bottom = height - 1
  let left = 0
  let right = width - 1

  const rowHasInk = (y: number) => {
    const offset = y * width * 4
    for (let x = 0; x < width; x += 1) {
      if (isInk(offset + x * 4)) return true
    }
    return false
  }

  const columnHasInk = (x: number) => {
    for (let y = 0; y < height; y += 1) {
      if (isInk((y * width + x) * 4)) return true
    }
    return false
  }

  while (top < bottom && !rowHasInk(top)) top += 1
  while (bottom > top && !rowHasInk(bottom)) bottom -= 1
  while (left < right && !columnHasInk(left)) left += 1
  while (right > left && !columnHasInk(right)) right -= 1

  const cropWidth = right - left + 1
  const cropHeight = bottom - top + 1
  if (cropWidth <= 0 || cropHeight <= 0) return null
  if (cropWidth === width && cropHeight === height) return null

  const output = document.createElement('canvas')
  output.width = cropWidth
  output.height = cropHeight
  const outputContext = output.getContext('2d')
  if (!outputContext) return null

  outputContext.drawImage(source, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
  return output.toDataURL('image/png')
}
