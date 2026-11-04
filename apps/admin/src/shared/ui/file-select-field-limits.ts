import {
  ATTACHMENT_ERROR,
  ATTACHMENT_MULTI_TOTAL_MAX_BYTES,
  ATTACHMENT_PER_FILE_MAX_BYTES,
} from '@/shared/lib/attachment-policy'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

/** @deprecated 운영 화면은 ATTACHMENT_PER_FILE_MAX_BYTES(20MB) 또는 여러 개 합계 100MB를 명시 */
export const FILE_SELECT_MAX_TOTAL_BYTES = 15 * 1024 * 1024

/** 1개 이미지 업로드 — 파일당 20MB */
export const FILE_SELECT_IMAGE_MAX_TOTAL_BYTES = ATTACHMENT_PER_FILE_MAX_BYTES

/** 여러 개 일반 첨부 합계 — 총 100MB */
export const FILE_SELECT_MULTI_MAX_TOTAL_BYTES = ATTACHMENT_MULTI_TOTAL_MAX_BYTES

/** @deprecated 화면 안내는 attachment-policy 가이드 문장 사용 */
export const FILE_SELECT_TOTAL_SIZE_GUIDE_LINE =
  '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 20MB까지 첨부할 수 있습니다.'

export function sumFileBytes(files: Iterable<{ size: number }>): number {
  let total = 0
  for (const file of files) total += file.size
  return total
}

export function isFileSelectTotalSizeExceeded(params: {
  incoming: Iterable<{ size: number }>
  currentTotalBytes?: number
  maxTotalBytes?: number
}): boolean {
  const max = params.maxTotalBytes ?? FILE_SELECT_MAX_TOTAL_BYTES
  const current = params.currentTotalBytes ?? 0
  return current + sumFileBytes(params.incoming) > max
}

export function notifyFileSelectTotalSizeExceeded(
  maxTotalBytes = FILE_SELECT_MAX_TOTAL_BYTES
): void {
  const content =
    maxTotalBytes >= ATTACHMENT_MULTI_TOTAL_MAX_BYTES
      ? ATTACHMENT_ERROR.totalSize
      : maxTotalBytes === ATTACHMENT_PER_FILE_MAX_BYTES
        ? ATTACHMENT_ERROR.perFileSize
        : `파일은 총 최대 ${Math.round(maxTotalBytes / (1024 * 1024))}MB까지 업로드 가능합니다.`
  cmsAlertModal.show({
    title: '안내',
    content,
  })
}
