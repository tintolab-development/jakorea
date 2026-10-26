/**
 * Platform 파일 업로드 공통 정책.
 * - 파일당 20MB
 * - 한 번에 올리는 전체 용량 100MB
 * - 여러 개 첨부 화면은 최대 10개
 * 문자·메일 첨부는 별도 정책을 따른다(Platform에는 해당 화면 없음).
 */
export const FILE_UPLOAD_MAX_BYTES = 20 * 1024 * 1024
export const FILE_UPLOAD_MAX_TOTAL_BYTES = 100 * 1024 * 1024
export const FILE_UPLOAD_MAX_COUNT = 10

export const FILE_UPLOAD_SIZE_EXCEEDED_MESSAGE = '파일은 1개당 최대 20MB까지 첨부할 수 있습니다.'
export const FILE_UPLOAD_TOTAL_EXCEEDED_MESSAGE =
  '한 번에 첨부할 수 있는 전체 용량은 최대 100MB입니다.'
export const FILE_UPLOAD_COUNT_EXCEEDED_MESSAGE = '파일은 최대 10개까지 첨부할 수 있습니다.'

type SizedFile = { size: number }

/** 단일 첨부 안내 — `파일은 최대 20MB까지 {formats} 형식만 등록 가능합니다.` */
export function formatSingleFileUploadHint(formats: string): string {
  return `파일은 최대 20MB까지 ${formats} 형식만 등록 가능합니다.`
}

/** 여러 개 첨부 안내 — 개수·총 용량 포함 */
export function formatMultiFileUploadHint(formats: string): string {
  return `파일은 1개당 최대 20MB, 최대 10개(총 100MB)까지 ${formats} 형식만 등록 가능합니다.`
}

export function validateUploadFileSize(file: SizedFile): string | null {
  return file.size > FILE_UPLOAD_MAX_BYTES ? FILE_UPLOAD_SIZE_EXCEEDED_MESSAGE : null
}

export function sumUploadFileBytes(files: readonly SizedFile[]): number {
  return files.reduce((sum, file) => sum + (Number.isFinite(file.size) ? file.size : 0), 0)
}

/** 이미 첨부한 파일 + 새로 고른 파일을 합쳐 개수·파일당 용량·전체 용량을 검사한다. */
export function validateUploadBatch(input: {
  currentCount: number
  currentTotalBytes: number
  incoming: readonly SizedFile[]
}): string | null {
  if (input.currentCount + input.incoming.length > FILE_UPLOAD_MAX_COUNT) {
    return FILE_UPLOAD_COUNT_EXCEEDED_MESSAGE
  }
  for (const file of input.incoming) {
    const sizeError = validateUploadFileSize(file)
    if (sizeError) return sizeError
  }
  if (input.currentTotalBytes + sumUploadFileBytes(input.incoming) > FILE_UPLOAD_MAX_TOTAL_BYTES) {
    return FILE_UPLOAD_TOTAL_EXCEEDED_MESSAGE
  }
  return null
}
