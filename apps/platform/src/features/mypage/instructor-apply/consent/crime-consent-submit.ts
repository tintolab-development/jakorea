import {
  classifyCrimeConsentOriginalFile,
  CRIME_CONSENT_MESSAGES,
  CrimeConsentOriginalNotReadyError,
  isValidEvidenceFileObjectId,
  resolveCrimeConsentApiErrorMessage,
  type CrimeConsentOriginalFile,
  type CrimeConsentOriginalFileState,
} from './crime-consent-original.ts'

/**
 * 제출 직전 재확인 결과.
 * `unknown`: GET /me/files/{id}가 403 `MEMBER_FILE_NOT_OWNED`·404 `MEMBER_FILE_NOT_FOUND` —
 * complete로 이미 동의 문서에 연결돼 소유가 넘어갔을 수 있다.
 */
export type CrimeConsentOriginalRecheck = CrimeConsentOriginalFileState | 'unknown'

/** 서버 응답이 있는 실패. 응답 자체가 없으면(네트워크·타임아웃) `readApiFailure`가 `null`. */
export type CrimeConsentApiFailure = { status: number | null; code: string | null }

export type CrimeConsentSubmitDeps = {
  fetchFile: (fileObjectId: number) => Promise<CrimeConsentOriginalFile>
  /** POST /api/portal/me/consents/documents `{ consentType: CRIMINAL_HISTORY_CHECK_CONSENT }` */
  createDocument: () => Promise<{ documentId?: number | null }>
  completeDocument: (
    documentId: number,
    body: { evidenceFileObjectId: number },
  ) => Promise<{ documentStatus?: string | null }>
  fetchDocument: (documentId: number) => Promise<{ documentStatus?: string | null }>
  readApiFailure: (error: unknown) => CrimeConsentApiFailure | null
  /** FE가 잘못된 complete 본문을 보냈다는 서버 신호 */
  reportClientBug?: (code: string) => void
}

/**
 * 한 화면 안의 제출 이력. 응답을 못 받은 complete를 같은 문서·같은 파일로 다시 보내기 위해 쓴다.
 * 메모리에만 두고 storage에 저장하지 않는다.
 */
export type CrimeConsentSubmitSession = {
  documentId: number | null
  /** `documentId`에 complete를 보낸 파일. 서버가 거부를 확정하면 비운다. */
  completeSentFileObjectId: number | null
}

export function createCrimeConsentSubmitSession(): CrimeConsentSubmitSession {
  return { documentId: null, completeSentFileObjectId: null }
}

/** 제출 단계 실패. `message`는 화면 안내 문구. */
export class CrimeConsentSubmitError extends Error {
  readonly code: string | null
  readonly status: number | null

  constructor(message: string, failure: CrimeConsentApiFailure | null = null) {
    super(message)
    this.name = 'CrimeConsentSubmitError'
    this.code = failure?.code ?? null
    this.status = failure?.status ?? null
  }
}

const UNKNOWN_FILE_FAILURES: Record<string, number> = {
  MEMBER_FILE_NOT_OWNED: 403,
  MEMBER_FILE_NOT_FOUND: 404,
}

export function isCrimeConsentUnknownFileFailure(failure: CrimeConsentApiFailure | null): boolean {
  if (!failure?.code) return false
  return UNKNOWN_FILE_FAILURES[failure.code] === failure.status
}

export type CrimeConsentSubmitStep = 'complete' | 'wait' | 'reupload'

/**
 * 재확인 결과 → 다음 행동.
 * `unknown`은 같은 문서·같은 파일로 complete를 보낸 적이 있을 때만 재전송하고, 판단은 서버 응답에 맡긴다.
 */
export function decideCrimeConsentSubmitStep(
  recheck: CrimeConsentOriginalRecheck,
  completeSentBefore: boolean,
): CrimeConsentSubmitStep {
  if (recheck === 'ready') return 'complete'
  if (recheck === 'pending') return 'wait'
  if (recheck === 'unknown' && completeSentBefore) return 'complete'
  return 'reupload'
}

export type CrimeConsentCompleteFailureAction =
  | 'alreadyLinked'
  | 'notReady'
  | 'alreadyUsed'
  | 'linkConflict'
  | 'newDocument'
  | 'documentNotFound'
  | 'clientBug'
  | 'fail'

const COMPLETE_FAILURE_ACTIONS: Record<string, CrimeConsentCompleteFailureAction> = {
  CONSENT_ORIGINAL_FILE_ALREADY_LINKED: 'alreadyLinked',
  CONSENT_ORIGINAL_FILE_NOT_READY: 'notReady',
  CONSENT_ORIGINAL_FILE_ALREADY_USED: 'alreadyUsed',
  CONSENT_ORIGINAL_FILE_LINK_CONFLICT: 'linkConflict',
  PORTAL_CONSENT_POLICY_VERSION_CHANGED: 'newDocument',
  PORTAL_CONSENT_TEMPLATE_VERSION_CHANGED: 'newDocument',
  PORTAL_CONSENT_DRAFT_VERSION_CONFLICT: 'newDocument',
  PORTAL_CONSENT_DOCUMENT_NOT_DRAFT: 'newDocument',
  PORTAL_CONSENT_RECONSENT_REQUIRED: 'newDocument',
  PORTAL_CONSENT_DOCUMENT_NOT_FOUND: 'documentNotFound',
  CONSENT_ORIGINAL_FILE_REQUIRED: 'clientBug',
  CONSENT_EVIDENCE_FILE_NOT_ALLOWED: 'clientBug',
}

export function resolveCrimeConsentCompleteFailureAction(
  code: string | null | undefined,
): CrimeConsentCompleteFailureAction {
  const normalized = code?.trim().toUpperCase()
  return (normalized && COMPLETE_FAILURE_ACTIONS[normalized]) || 'fail'
}

function isSignedDocument(detail: { documentStatus?: string | null } | null): boolean {
  return detail?.documentStatus?.trim().toUpperCase() === 'SIGNED'
}

function toSubmitError(
  failure: CrimeConsentApiFailure | null,
  fallback: string = CRIME_CONSENT_MESSAGES.submitFailed,
): CrimeConsentSubmitError {
  if (!failure) return new CrimeConsentSubmitError(CRIME_CONSENT_MESSAGES.network)
  return new CrimeConsentSubmitError(resolveCrimeConsentApiErrorMessage(failure, fallback), failure)
}

function resetSession(session: CrimeConsentSubmitSession): void {
  session.documentId = null
  session.completeSentFileObjectId = null
}

/** GET /me/files/{id} → ready·pending·invalid·unknown. 그 외 실패는 ID를 유지한 채 오류로 던진다. */
export async function recheckCrimeConsentOriginalFile(
  deps: Pick<CrimeConsentSubmitDeps, 'fetchFile' | 'readApiFailure'>,
  fileObjectId: number,
): Promise<CrimeConsentOriginalRecheck> {
  try {
    return classifyCrimeConsentOriginalFile(await deps.fetchFile(fileObjectId))
  } catch (error) {
    const failure = deps.readApiFailure(error)
    if (isCrimeConsentUnknownFileFailure(failure)) return 'unknown'
    throw toSubmitError(failure, CRIME_CONSENT_MESSAGES.uploadFailed)
  }
}

async function fetchDocumentQuietly(
  deps: CrimeConsentSubmitDeps,
  documentId: number,
): Promise<{ documentStatus?: string | null } | null> {
  try {
    return await deps.fetchDocument(documentId)
  } catch {
    return null
  }
}

async function createDocumentId(deps: CrimeConsentSubmitDeps): Promise<number> {
  let created: { documentId?: number | null }
  try {
    created = await deps.createDocument()
  } catch (error) {
    throw toSubmitError(deps.readApiFailure(error))
  }
  if (created.documentId == null) {
    throw new CrimeConsentSubmitError(CRIME_CONSENT_MESSAGES.submitFailed)
  }
  return created.documentId
}

/**
 * 성범죄 동의서 원본 PDF 제출 (경로 A: POST /documents → complete `{ evidenceFileObjectId }`).
 * `session`은 호출자가 화면 수명 동안 보관하고, 이 함수가 갱신한다.
 */
export async function submitCrimeConsentOriginal(
  deps: CrimeConsentSubmitDeps,
  session: CrimeConsentSubmitSession,
  evidenceFileObjectId: number,
): Promise<void> {
  if (!isValidEvidenceFileObjectId(evidenceFileObjectId)) {
    throw new CrimeConsentOriginalNotReadyError('invalid')
  }
  if (
    session.completeSentFileObjectId != null &&
    session.completeSentFileObjectId !== evidenceFileObjectId
  ) {
    // 다른 파일을 이미 보낸 문서에는 새 파일을 붙이지 않는다. 새 문서로 제출한다.
    resetSession(session)
  }
  const completeSentBefore =
    session.documentId != null && session.completeSentFileObjectId === evidenceFileObjectId

  const recheck = await recheckCrimeConsentOriginalFile(deps, evidenceFileObjectId)
  const step = decideCrimeConsentSubmitStep(recheck, completeSentBefore)
  if (step === 'wait') throw new CrimeConsentOriginalNotReadyError('pending')
  if (step === 'reupload') {
    resetSession(session)
    throw new CrimeConsentOriginalNotReadyError('invalid')
  }

  let newDocumentRetried = false
  for (;;) {
    const documentId = session.documentId ?? (await createDocumentId(deps))
    session.documentId = documentId
    session.completeSentFileObjectId = evidenceFileObjectId

    let failure: CrimeConsentApiFailure | null
    try {
      const completed = await deps.completeDocument(documentId, { evidenceFileObjectId })
      if (completed.documentStatus != null && !isSignedDocument(completed)) {
        throw new CrimeConsentSubmitError(CRIME_CONSENT_MESSAGES.submitFailed)
      }
      return
    } catch (error) {
      if (error instanceof CrimeConsentSubmitError) throw error
      failure = deps.readApiFailure(error)
    }

    // 응답 유실: 이력을 그대로 두고, 재시도 때 같은 문서·같은 파일로 다시 보낸다.
    if (!failure) throw toSubmitError(null)

    const action = resolveCrimeConsentCompleteFailureAction(failure.code)
    switch (action) {
      case 'alreadyLinked': {
        // 문서에 원본이 이미 연결됨 — SIGNED면 제출 완료로 본다.
        if (isSignedDocument(await fetchDocumentQuietly(deps, documentId))) return
        throw toSubmitError(failure)
      }
      case 'notReady': {
        session.completeSentFileObjectId = null
        if (recheck !== 'unknown') {
          const latest = await recheckCrimeConsentOriginalFile(deps, evidenceFileObjectId).catch(
            () => 'invalid' as const,
          )
          if (latest === 'pending') throw new CrimeConsentOriginalNotReadyError('pending')
        }
        resetSession(session)
        throw new CrimeConsentOriginalNotReadyError('invalid')
      }
      case 'alreadyUsed':
        session.completeSentFileObjectId = null
        throw new CrimeConsentOriginalNotReadyError(
          'invalid',
          CRIME_CONSENT_MESSAGES.fileAlreadyUsed,
        )
      case 'linkConflict':
        // 연결 여부를 알 수 없다. 이력을 유지하고 사용자가 직접 다시 제출한다.
        await fetchDocumentQuietly(deps, documentId)
        throw toSubmitError(failure)
      case 'newDocument':
        // 서버가 트랜잭션을 롤백해 파일은 미연결 — 새 문서에 같은 파일로 한 번만 다시 보낸다.
        resetSession(session)
        if (!newDocumentRetried) {
          newDocumentRetried = true
          continue
        }
        throw toSubmitError(failure)
      case 'documentNotFound':
        resetSession(session)
        throw toSubmitError(failure)
      case 'clientBug':
        deps.reportClientBug?.(failure.code ?? '')
        throw toSubmitError(failure)
      default:
        throw toSubmitError(failure)
    }
  }
}
