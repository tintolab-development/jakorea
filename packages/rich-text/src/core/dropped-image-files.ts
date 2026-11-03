const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

/** 내부 노드 드래그(파일 없음)는 새 이미지 삽입으로 취급하지 않는다. */
export function shouldInsertDroppedImageFiles(files: File[] | FileList | null | undefined): boolean {
  if (files == null) return false
  return Array.from(files).some(file => ALLOWED_MIME_TYPES.includes(file.type))
}

export function isAllowedDroppedImageMime(type: string): boolean {
  return ALLOWED_MIME_TYPES.includes(type)
}
