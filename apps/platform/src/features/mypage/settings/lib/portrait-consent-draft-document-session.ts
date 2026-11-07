import type { PortalConsentDocumentDetail } from '../api/portal-consent-documents.types'

/**
 * 마이페이지 초상권 작성 — StrictMode 이중 effect·제출 직전 경쟁에서 같은 키의
 * 진행 중 POST만 공유한다. 완료된 응답을 오래 붙잡아 서버 최신 게시본보다 앞세우지 않는다.
 */
type Entry = { promise: Promise<PortalConsentDocumentDetail> }

const inFlight = new Map<string, Entry>()

export function portraitConsentDraftDocumentKey(input: {
  memberKey: string
  programId?: number | null
}): string {
  const program = input.programId == null ? 'member' : `program:${input.programId}`
  return `${input.memberKey.trim()}|${program}`
}

export function acquirePortraitConsentDraftDocument(
  key: string,
  create: () => Promise<PortalConsentDocumentDetail>,
): Promise<PortalConsentDocumentDetail> {
  const existing = inFlight.get(key)
  if (existing != null) return existing.promise

  const promise = create().then(
    document => {
      inFlight.delete(key)
      if (document.documentId == null) {
        throw new Error('동의서 문서를 만들지 못했습니다.')
      }
      return document
    },
    (error: unknown) => {
      inFlight.delete(key)
      throw error
    },
  )
  inFlight.set(key, { promise })
  return promise
}

export function releasePortraitConsentDraftDocument(key: string): void {
  inFlight.delete(key)
}

export function resetPortraitConsentDraftDocumentSession(): void {
  inFlight.clear()
}

/** @deprecated 테스트 호환 — `resetPortraitConsentDraftDocumentSession` 사용 */
export function resetPortraitConsentDraftDocumentSessionForTest(): void {
  resetPortraitConsentDraftDocumentSession()
}
