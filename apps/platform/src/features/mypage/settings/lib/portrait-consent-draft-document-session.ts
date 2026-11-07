import type { PortalConsentDocumentDetail } from '../api/portal-consent-documents.types'

/**
 * 마이페이지 초상권 작성 — 진입 시 만드는 DRAFT 문서를 화면 재진입·StrictMode 이중 effect·
 * 제출 직전 경쟁 상황에서 한 번만 POST 하도록 공유한다.
 * - 같은 키(회원 표시명 + 프로그램)에 진행 중/완료된 생성이 있으면 그 Promise를 그대로 돌려준다.
 * - 생성 실패·제출 완료·제출 실패 시 `release` → 다음 진입에서 새로 만든다.
 * - 오래된 DRAFT 재사용을 막기 위해 TTL 이후에는 새로 만든다.
 */
export const PORTRAIT_CONSENT_DRAFT_DOCUMENT_TTL_MS = 10 * 60 * 1000

type Entry = { promise: Promise<PortalConsentDocumentDetail>; createdAt: number }

const entries = new Map<string, Entry>()

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
  now: () => number = Date.now,
): Promise<PortalConsentDocumentDetail> {
  const existing = entries.get(key)
  if (existing != null && now() - existing.createdAt < PORTRAIT_CONSENT_DRAFT_DOCUMENT_TTL_MS) {
    return existing.promise
  }
  const promise = create().then(
    document => {
      if (document.documentId == null) {
        entries.delete(key)
      }
      return document
    },
    (error: unknown) => {
      entries.delete(key)
      throw error
    },
  )
  entries.set(key, { promise, createdAt: now() })
  return promise
}

export function releasePortraitConsentDraftDocument(key: string): void {
  entries.delete(key)
}

/** 테스트 전용 */
export function resetPortraitConsentDraftDocumentSessionForTest(): void {
  entries.clear()
}
