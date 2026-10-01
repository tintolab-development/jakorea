const DATA_URI_IMAGE_TAG =
  /<img\b[^>]*\bsrc\s*=\s*(['"])data:image\/[\s\S]*?\1[^>]*>/gi

/** HTML 붙여넣기의 base64 이미지는 저장 API가 거절한다. */
export function stripPastedDataUriImages(html: string): string {
  return html.replace(DATA_URI_IMAGE_TAG, '')
}
