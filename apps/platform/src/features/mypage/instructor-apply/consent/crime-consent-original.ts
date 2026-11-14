/**
 * 성범죄 경력 조회 동의서 원본 — OpenAPI `MemberPortalFileUploadRequest.filePurpose`
 * `CRIMINAL_HISTORY_CONSENT_ORIGINAL` (PDF·JPG·PNG, 20MB) · `MemberPortalConsentCompleteRequest.evidenceFileObjectId`.
 */
export const CRIME_CONSENT_ORIGINAL_FILE_PURPOSE = 'CRIMINAL_HISTORY_CONSENT_ORIGINAL'
export const CRIME_CONSENT_ORIGINAL_CONTENT_TYPE = 'application/pdf'
export const CRIME_CONSENT_ORIGINAL_MAX_BYTES = 20 * 1024 * 1024
export const CRIME_CONSENT_ORIGINAL_ACCEPT =
  'application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png'

const CRIME_CONSENT_ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
])

export const CRIME_CONSENT_ORIGINAL_UPLOAD_POLICY = {
  maxBytes: CRIME_CONSENT_ORIGINAL_MAX_BYTES,
  allowedFileTypes: [
    { extensions: ['pdf'], contentType: CRIME_CONSENT_ORIGINAL_CONTENT_TYPE },
    { extensions: ['jpg', 'jpeg'], contentType: 'image/jpeg' },
    { extensions: ['png'], contentType: 'image/png' },
  ],
} as const

export const CRIME_CONSENT_MESSAGES = {
  fileType: 'PDF, JPG, PNG 파일만 업로드할 수 있습니다.',
  fileSize: '파일은 최대 20MB까지 업로드할 수 있습니다.',
  fileEmpty: '빈 파일은 업로드할 수 없습니다. 파일을 다시 선택해 주세요.',
  scanning: '파일 보안 검사 중입니다. 검사가 끝나면 제출할 수 있어요.',
  scanTimeout:
    '파일 보안 검사가 아직 끝나지 않았어요. 잠시 후 「검사 상태 확인」을 눌러 다시 확인해 주세요.',
  scanRejected: '보안 검사를 통과하지 못한 파일입니다. 다른 PDF 파일을 업로드해 주세요.',
  network: '네트워크 오류로 요청하지 못했어요. 연결 상태를 확인한 뒤 다시 시도해 주세요.',
  uploadFailed: '동의서 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  fileRequired: '작성한 동의서 PDF를 업로드해 주세요.',
  fileNotReady: '업로드한 동의서 파일을 확인할 수 없어요. PDF 파일을 다시 업로드해 주세요.',
  uploadIncomplete: '파일 업로드를 마치지 못했어요. PDF 파일을 다시 업로드해 주세요.',
  fileAlreadyUsed: '이미 다른 동의서에 사용된 파일이에요. 동의서 PDF를 다시 업로드해 주세요.',
  linkConflict: '동의서 제출 상태가 바뀌었어요. 잠시 후 다시 제출해 주세요.',
  versionChanged: '동의서 내용이 변경되었어요. 다시 제출해 주세요.',
  reconsentRequired: '동의서 유효기간이 지나 다시 동의가 필요해요. 다시 제출해 주세요.',
  termsNotPublished: '지금은 동의서를 제출할 수 없어요. 잠시 후 다시 시도해 주세요.',
  documentNotFound: '동의서를 찾을 수 없어요. 화면을 새로고침한 뒤 다시 시도해 주세요.',
  submitFailed: '동의서를 제출하지 못했어요. 잠시 후 다시 시도해 주세요.',
  signedFileNotReady:
    '제출된 동의서에 연결된 원본 파일이 없어요. 동의서 PDF를 다시 업로드해 제출해 주세요.',
  documentFileNotReady: '동의서 파일 준비가 아직 끝나지 않았어요. 잠시 후 다시 시도해 주세요.',
  retentionExpired: '보관 기간이 지나 동의서를 다운로드할 수 없어요.',
  downloadFailed: '업로드한 동의서를 다운로드하지 못했어요. 잠시 후 다시 시도해 주세요.',
  formFileUnavailable:
    '게시된 동의서 양식 파일을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  formFileFallbackName: '성범죄 경력 조회 동의서_양식.pdf',
  unauthorized: '로그인이 만료되었어요. 다시 로그인한 뒤 시도해 주세요.',
  forbidden: '이 동의서에 접근할 권한이 없어요.',
} as const

type FileLike = { name: string; type: string; size: number }

/**
 * 네트워크 요청 전 차단. 확장자 `.pdf` / `.jpg` / `.jpeg` / `.png`만 허용한다.
 * MIME이 비어 있으면 확장자만 본다. 실제 내용 검증은 서버 보안 검사가 담당한다.
 */
function expectedCrimeConsentMime(fileName: string): string | null {
  const name = fileName.trim().toLowerCase()
  if (name.endsWith('.pdf')) return 'application/pdf'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  if (name.endsWith('.png')) return 'image/png'
  return null
}

export function validateCrimeConsentOriginalFile(file: FileLike): string | null {
  const expectedMime = expectedCrimeConsentMime(file.name)
  if (!expectedMime) return CRIME_CONSENT_MESSAGES.fileType
  const mime = file.type.trim().toLowerCase()
  if (mime !== '' && mime !== expectedMime) {
    return CRIME_CONSENT_MESSAGES.fileType
  }
  if (!Number.isFinite(file.size) || file.size <= 0) return CRIME_CONSENT_MESSAGES.fileEmpty
  if (file.size > CRIME_CONSENT_ORIGINAL_MAX_BYTES) return CRIME_CONSENT_MESSAGES.fileSize
  return null
}

/**
 * complete를 보낼 수 없는 원본 파일 상태.
 * `pending`: 검사·승격 대기 — 같은 ID로 상태를 다시 확인한다.
 * `invalid`: 이 파일로는 제출할 수 없다 — ID를 버리고 다시 업로드한다.
 */
export class CrimeConsentOriginalNotReadyError extends Error {
  readonly reason: 'pending' | 'invalid'

  constructor(reason: 'pending' | 'invalid', message?: string) {
    super(
      message ??
        (reason === 'pending' ? CRIME_CONSENT_MESSAGES.scanning : CRIME_CONSENT_MESSAGES.fileNotReady),
    )
    this.name = 'CrimeConsentOriginalNotReadyError'
    this.reason = reason
  }
}

export type CrimeConsentOriginalFile = {
  filePurpose?: string | null
  contentType?: string | null
  scanStatus?: string | null
  uploadStatus?: string | null
}

export type CrimeConsentOriginalFileState = 'ready' | 'pending' | 'invalid'

const RECHECKABLE_SCAN_STATUSES = new Set(['PENDING_SCAN', 'CLEAN'])
const RECHECKABLE_UPLOAD_STATUSES = new Set(['CONFIRM_REQUESTED', 'UPLOADED', 'PROMOTION_PENDING'])
const INVALID_SCAN_STATUSES = new Set(['FAILED', 'INFECTED', 'REJECTED', 'DESTROYED'])
const INVALID_UPLOAD_STATUSES = new Set(['QUARANTINED', 'EXPIRED', 'DELETED', 'DESTROYED'])
/** confirm 전 상태(`PREPARED`·`PENDING_UPLOAD`) — 업로드 흐름이 끝나지 않은 파일 */
const BEFORE_CONFIRM_STATUSES = new Set(['PREPARED', 'PENDING_UPLOAD'])

function upper(value: string | null | undefined): string {
  return value?.trim().toUpperCase() ?? ''
}

/**
 * GET /me/files/{id} 응답 → 원본 PDF 제출 가능 여부.
 * complete는 본인·목적·PDF·CLEAN·AVAILABLE(정확히)·미만료 파일만 연결한다.
 * `CONFIRMED`와 목록에 없는 조합은 `pending`이지만 재확인 대상이 아니다
 * ({@link canRecheckCrimeConsentOriginalFile}) — 시간 초과 후 재업로드를 안내한다.
 */
export function classifyCrimeConsentOriginalFile(
  file: CrimeConsentOriginalFile,
): CrimeConsentOriginalFileState {
  if (upper(file.filePurpose) !== CRIME_CONSENT_ORIGINAL_FILE_PURPOSE) return 'invalid'
  if (!CRIME_CONSENT_ALLOWED_CONTENT_TYPES.has(file.contentType?.trim().toLowerCase() ?? '')) {
    return 'invalid'
  }
  const scan = upper(file.scanStatus)
  const upload = upper(file.uploadStatus)
  if (INVALID_SCAN_STATUSES.has(scan) || INVALID_UPLOAD_STATUSES.has(upload)) return 'invalid'
  if (BEFORE_CONFIRM_STATUSES.has(scan) || BEFORE_CONFIRM_STATUSES.has(upload)) return 'invalid'
  if (scan === 'CLEAN' && upload === 'AVAILABLE') return 'ready'
  return 'pending'
}

/** `pending` 중 검사·저장소 승격 대기라 「검사 상태 확인」으로 다시 기다릴 수 있는 상태 */
export function canRecheckCrimeConsentOriginalFile(file: CrimeConsentOriginalFile): boolean {
  return (
    classifyCrimeConsentOriginalFile(file) === 'pending' &&
    RECHECKABLE_SCAN_STATUSES.has(upper(file.scanStatus)) &&
    RECHECKABLE_UPLOAD_STATUSES.has(upper(file.uploadStatus))
  )
}

export function isValidEvidenceFileObjectId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

/** BE 확정 오류 코드(`$.error.code`) → 안내 문구 */
const CRIME_CONSENT_ERROR_CODE_MESSAGES: Record<string, string> = {
  MEMBER_FILE_PURPOSE_NOT_ALLOWED: CRIME_CONSENT_MESSAGES.fileType,
  MEMBER_FILE_TYPE_NOT_ALLOWED: CRIME_CONSENT_MESSAGES.fileType,
  MEMBER_FILE_SIZE_EXCEEDED: CRIME_CONSENT_MESSAGES.fileSize,
  MEMBER_FILE_CONFIRM_NOT_ALLOWED: CRIME_CONSENT_MESSAGES.uploadIncomplete,
  MEMBER_FILE_NOT_OWNED: CRIME_CONSENT_MESSAGES.fileNotReady,
  MEMBER_FILE_NOT_FOUND: CRIME_CONSENT_MESSAGES.fileNotReady,
  CONSENT_ORIGINAL_FILE_REQUIRED: CRIME_CONSENT_MESSAGES.fileRequired,
  CONSENT_EVIDENCE_FILE_NOT_ALLOWED: CRIME_CONSENT_MESSAGES.submitFailed,
  CONSENT_ORIGINAL_FILE_NOT_READY: CRIME_CONSENT_MESSAGES.fileNotReady,
  CONSENT_ORIGINAL_FILE_ALREADY_LINKED: CRIME_CONSENT_MESSAGES.linkConflict,
  CONSENT_ORIGINAL_FILE_ALREADY_USED: CRIME_CONSENT_MESSAGES.fileAlreadyUsed,
  CONSENT_ORIGINAL_FILE_LINK_CONFLICT: CRIME_CONSENT_MESSAGES.linkConflict,
  PORTAL_CONSENT_POLICY_VERSION_CHANGED: CRIME_CONSENT_MESSAGES.versionChanged,
  PORTAL_CONSENT_TEMPLATE_VERSION_CHANGED: CRIME_CONSENT_MESSAGES.versionChanged,
  PORTAL_CONSENT_DRAFT_VERSION_CONFLICT: CRIME_CONSENT_MESSAGES.versionChanged,
  PORTAL_CONSENT_DOCUMENT_NOT_DRAFT: CRIME_CONSENT_MESSAGES.versionChanged,
  PORTAL_CONSENT_RECONSENT_REQUIRED: CRIME_CONSENT_MESSAGES.reconsentRequired,
  PORTAL_CONSENT_TERMS_NOT_PUBLISHED: CRIME_CONSENT_MESSAGES.termsNotPublished,
  PORTAL_CONSENT_DOCUMENT_NOT_FOUND: CRIME_CONSENT_MESSAGES.documentNotFound,
  PORTAL_CONSENT_SIGNED_FILE_NOT_READY: CRIME_CONSENT_MESSAGES.signedFileNotReady,
  PORTAL_CONSENT_DOCUMENT_FILE_NOT_READY: CRIME_CONSENT_MESSAGES.documentFileNotReady,
  PORTAL_CONSENT_DOCUMENT_RETENTION_EXPIRED: CRIME_CONSENT_MESSAGES.retentionExpired,
}

/** API 오류 code·HTTP status → 화면 안내. 모르는 code는 `fallback`. */
export function resolveCrimeConsentApiErrorMessage(
  input: { code?: string | null; status?: number | null },
  fallback: string,
): string {
  if (input.status === 401) return CRIME_CONSENT_MESSAGES.unauthorized
  const code = input.code?.trim().toUpperCase()
  if (code && CRIME_CONSENT_ERROR_CODE_MESSAGES[code]) {
    return CRIME_CONSENT_ERROR_CODE_MESSAGES[code]
  }
  if (input.status === 403) return CRIME_CONSENT_MESSAGES.forbidden
  return fallback
}

/** 서버 응답 body에서 오류 code를 읽는다 (`{ error: { code } }` 또는 `{ code }`). */
export function readCrimeConsentErrorCodeFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const record = body as { code?: unknown; error?: { code?: unknown } }
  const nested = record.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim().toUpperCase()
  if (typeof record.code === 'string' && record.code.trim()) return record.code.trim().toUpperCase()
  return null
}
