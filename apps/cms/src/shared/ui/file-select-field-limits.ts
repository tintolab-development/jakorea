import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

/** 파일 업로드 공통 — 첨부 파일 합계 최대 용량 */
export const FILE_SELECT_MAX_TOTAL_BYTES = 15 * 1024 * 1024

/** 용량 안내 문구 (확장자 안내는 케이스별 guideLines에 별도) */
export const FILE_SELECT_TOTAL_SIZE_GUIDE_LINE =
  '- 파일은 총 최대 15MB까지 업로드 가능합니다.'

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

export function notifyFileSelectTotalSizeExceeded(): void {
  cmsAlertModal.show({
    title: '안내',
    content: '파일은 총 최대 15MB까지 업로드 가능합니다.',
  })
}
