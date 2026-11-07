/** A4에 거의 맞는 캡처는 1장으로 두고, 더 긴 이미지만 이어붙인다. */
export const PDF_IMAGE_SLICE_EPSILON_MM = 1

export function countPdfImageSlices(
  imgHeightMm: number,
  pageHeightMm: number,
  epsilonMm = PDF_IMAGE_SLICE_EPSILON_MM
): number {
  if (!(imgHeightMm > 0) || !(pageHeightMm > 0)) return 1
  if (imgHeightMm <= pageHeightMm + epsilonMm) return 1
  return Math.ceil(imgHeightMm / pageHeightMm)
}
