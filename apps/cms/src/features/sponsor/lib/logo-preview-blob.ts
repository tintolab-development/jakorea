import { fetchFileContentBlob } from '@/shared/lib/admin-file-upload'

/** 같은 세션에서 상세를 다시 열 때 로고를 다시 받지 않도록 기억한다 */
const logoBlobByFileObjectId = new Map<number, Promise<Blob>>()

/**
 * 미리보기는 인라인 경로(`GET /api/admin/files/{id}/content`)로 받는다 — 다운로드 이력을 남기지 않는다(QA-0110).
 * 실제 다운로드 버튼은 기존 다운로드 경로(`downloadAdminFile`)·이력 기록을 그대로 쓴다.
 */
export function loadLogoBlob(fileObjectId: number): Promise<Blob> {
  const cached = logoBlobByFileObjectId.get(fileObjectId)
  if (cached) return cached
  const pending = fetchFileContentBlob(fileObjectId, { skipGlobalErrorAlert: true })
  logoBlobByFileObjectId.set(fileObjectId, pending)
  pending.catch(() => {
    logoBlobByFileObjectId.delete(fileObjectId)
  })
  return pending
}
