import assert from 'node:assert/strict'
import {
  canRecheckCrimeConsentOriginalFile,
  classifyCrimeConsentOriginalFile,
  CRIME_CONSENT_MESSAGES,
  CRIME_CONSENT_ORIGINAL_FILE_PURPOSE,
  CRIME_CONSENT_ORIGINAL_MAX_BYTES,
  CrimeConsentOriginalNotReadyError,
  isValidEvidenceFileObjectId,
  readCrimeConsentErrorCodeFromBody,
  resolveCrimeConsentApiErrorMessage,
  validateCrimeConsentOriginalFile,
} from './crime-consent-original.ts'

const pdf = (overrides: Partial<{ name: string; type: string; size: number }> = {}) => ({
  name: '동의서.pdf',
  type: 'application/pdf',
  size: 1024,
  ...overrides,
})

assert.equal(CRIME_CONSENT_ORIGINAL_FILE_PURPOSE, 'CRIMINAL_HISTORY_CONSENT_ORIGINAL')
assert.equal(CRIME_CONSENT_ORIGINAL_MAX_BYTES, 20 * 1024 * 1024)

// 정상 PDF · 대문자 확장자 · MIME 미전달(확장자 기준 application/pdf)
assert.equal(validateCrimeConsentOriginalFile(pdf()), null)
assert.equal(validateCrimeConsentOriginalFile(pdf({ name: 'SCAN.PDF' })), null)
assert.equal(validateCrimeConsentOriginalFile(pdf({ type: '' })), null)
assert.equal(validateCrimeConsentOriginalFile(pdf({ size: CRIME_CONSENT_ORIGINAL_MAX_BYTES })), null)

// 업로드 전 차단: 이미지, 확장자 불일치, 비정상 MIME, 크기
assert.equal(
  validateCrimeConsentOriginalFile(pdf({ name: 'scan.jpg', type: 'image/jpeg' })),
  CRIME_CONSENT_MESSAGES.fileType,
)
assert.equal(
  validateCrimeConsentOriginalFile(pdf({ name: 'scan.png', type: 'image/png' })),
  CRIME_CONSENT_MESSAGES.fileType,
)
assert.equal(
  validateCrimeConsentOriginalFile(pdf({ name: 'consent.docx', type: 'application/pdf' })),
  CRIME_CONSENT_MESSAGES.fileType,
)
assert.equal(
  validateCrimeConsentOriginalFile(pdf({ name: 'consent.pdf.exe', type: 'application/pdf' })),
  CRIME_CONSENT_MESSAGES.fileType,
)
assert.equal(
  validateCrimeConsentOriginalFile(pdf({ type: 'application/octet-stream' })),
  CRIME_CONSENT_MESSAGES.fileType,
)
assert.equal(
  validateCrimeConsentOriginalFile(pdf({ type: 'image/jpeg' })),
  CRIME_CONSENT_MESSAGES.fileType,
)
assert.equal(
  validateCrimeConsentOriginalFile(pdf({ size: CRIME_CONSENT_ORIGINAL_MAX_BYTES + 1 })),
  CRIME_CONSENT_MESSAGES.fileSize,
)
assert.equal(validateCrimeConsentOriginalFile(pdf({ size: 0 })), CRIME_CONSENT_MESSAGES.fileEmpty)

// fileObjectId
assert.equal(isValidEvidenceFileObjectId(2056241), true)
assert.equal(isValidEvidenceFileObjectId(0), false)
assert.equal(isValidEvidenceFileObjectId(-1), false)
assert.equal(isValidEvidenceFileObjectId(1.5), false)
assert.equal(isValidEvidenceFileObjectId('2056241'), false)
assert.equal(isValidEvidenceFileObjectId(undefined), false)

// 파일 상태 — 목적·PDF·CLEAN·AVAILABLE(정확히)만 ready
const purpose = CRIME_CONSENT_ORIGINAL_FILE_PURPOSE
const original = (scanStatus: string, uploadStatus: string) => ({
  filePurpose: purpose,
  contentType: 'application/pdf',
  scanStatus,
  uploadStatus,
})
const expectState = (
  file: Parameters<typeof classifyCrimeConsentOriginalFile>[0],
  state: 'ready' | 'pending' | 'invalid',
  recheckable = false,
) => {
  assert.equal(classifyCrimeConsentOriginalFile(file), state, JSON.stringify(file))
  assert.equal(canRecheckCrimeConsentOriginalFile(file), recheckable, `recheck ${JSON.stringify(file)}`)
}

expectState(original('CLEAN', 'AVAILABLE'), 'ready')
expectState(original('clean', 'available'), 'ready')

// pending: 검사·저장소 승격 대기 → 「검사 상태 확인」 가능
expectState(original('PENDING_SCAN', 'CONFIRM_REQUESTED'), 'pending', true)
expectState(original('PENDING_SCAN', 'UPLOADED'), 'pending', true)
expectState(original('CLEAN', 'UPLOADED'), 'pending', true)
expectState(original('CLEAN', 'PROMOTION_PENDING'), 'pending', true)
expectState(original('PENDING_SCAN', 'PROMOTION_PENDING'), 'pending', true)
// CONFIRMED: complete가 거부하는 값 — pending이지만 시간 초과 후 재업로드
expectState(original('CLEAN', 'CONFIRMED'), 'pending', false)

// invalid: 검사 실패·격리·만료·삭제·confirm 전
expectState(original('FAILED', 'QUARANTINED'), 'invalid')
expectState(original('INFECTED', 'AVAILABLE'), 'invalid')
expectState(original('REJECTED', 'AVAILABLE'), 'invalid')
expectState(original('DESTROYED', 'DESTROYED'), 'invalid')
expectState(original('CLEAN', 'EXPIRED'), 'invalid')
expectState(original('CLEAN', 'DELETED'), 'invalid')
expectState(original('PENDING_SCAN', 'QUARANTINED'), 'invalid')
expectState(original('PENDING_UPLOAD', 'PREPARED'), 'invalid')
expectState(original('CLEAN', 'PREPARED'), 'invalid')

// invalid: 목적·contentType 불일치 (2056241 사례: CRIMINAL_HISTORY_EVIDENCE는 원본이 될 수 없다)
expectState({ ...original('PENDING_SCAN', 'CONFIRM_REQUESTED'), filePurpose: 'CRIMINAL_HISTORY_EVIDENCE' }, 'invalid')
expectState({ ...original('CLEAN', 'AVAILABLE'), filePurpose: 'CRIMINAL_HISTORY_EVIDENCE' }, 'invalid')
expectState({ ...original('CLEAN', 'AVAILABLE'), filePurpose: undefined }, 'invalid')
expectState({ ...original('CLEAN', 'AVAILABLE'), contentType: 'image/jpeg' }, 'invalid')
expectState({ ...original('CLEAN', 'AVAILABLE'), contentType: undefined }, 'invalid')

assert.equal(new CrimeConsentOriginalNotReadyError('pending').message, CRIME_CONSENT_MESSAGES.scanning)
assert.equal(new CrimeConsentOriginalNotReadyError('invalid').message, CRIME_CONSENT_MESSAGES.fileNotReady)
assert.equal(
  new CrimeConsentOriginalNotReadyError('invalid', CRIME_CONSENT_MESSAGES.fileAlreadyUsed).message,
  CRIME_CONSENT_MESSAGES.fileAlreadyUsed,
)

// 오류 code · status 매핑 ([3] 확정 표)
const fallback = 'fallback'
const expectCode = (code: string, status: number, message: string) => {
  assert.equal(resolveCrimeConsentApiErrorMessage({ code, status }, fallback), message, code)
}
expectCode('MEMBER_FILE_PURPOSE_NOT_ALLOWED', 400, CRIME_CONSENT_MESSAGES.fileType)
expectCode('MEMBER_FILE_TYPE_NOT_ALLOWED', 400, CRIME_CONSENT_MESSAGES.fileType)
expectCode('MEMBER_FILE_SIZE_EXCEEDED', 400, CRIME_CONSENT_MESSAGES.fileSize)
expectCode('MEMBER_FILE_CONFIRM_NOT_ALLOWED', 409, CRIME_CONSENT_MESSAGES.uploadIncomplete)
expectCode('MEMBER_FILE_NOT_OWNED', 403, CRIME_CONSENT_MESSAGES.fileNotReady)
expectCode('MEMBER_FILE_NOT_FOUND', 404, CRIME_CONSENT_MESSAGES.fileNotReady)
expectCode('CONSENT_ORIGINAL_FILE_REQUIRED', 400, CRIME_CONSENT_MESSAGES.fileRequired)
expectCode('CONSENT_EVIDENCE_FILE_NOT_ALLOWED', 400, CRIME_CONSENT_MESSAGES.submitFailed)
expectCode('CONSENT_ORIGINAL_FILE_NOT_READY', 409, CRIME_CONSENT_MESSAGES.fileNotReady)
expectCode('consent_original_file_not_ready', 409, CRIME_CONSENT_MESSAGES.fileNotReady)
expectCode('CONSENT_ORIGINAL_FILE_ALREADY_LINKED', 409, CRIME_CONSENT_MESSAGES.linkConflict)
expectCode('CONSENT_ORIGINAL_FILE_ALREADY_USED', 409, CRIME_CONSENT_MESSAGES.fileAlreadyUsed)
expectCode('CONSENT_ORIGINAL_FILE_LINK_CONFLICT', 409, CRIME_CONSENT_MESSAGES.linkConflict)
expectCode('PORTAL_CONSENT_POLICY_VERSION_CHANGED', 409, CRIME_CONSENT_MESSAGES.versionChanged)
expectCode('PORTAL_CONSENT_TEMPLATE_VERSION_CHANGED', 409, CRIME_CONSENT_MESSAGES.versionChanged)
expectCode('PORTAL_CONSENT_DRAFT_VERSION_CONFLICT', 409, CRIME_CONSENT_MESSAGES.versionChanged)
expectCode('PORTAL_CONSENT_DOCUMENT_NOT_DRAFT', 409, CRIME_CONSENT_MESSAGES.versionChanged)
expectCode('PORTAL_CONSENT_RECONSENT_REQUIRED', 409, CRIME_CONSENT_MESSAGES.reconsentRequired)
expectCode('PORTAL_CONSENT_TERMS_NOT_PUBLISHED', 409, CRIME_CONSENT_MESSAGES.termsNotPublished)
expectCode('PORTAL_CONSENT_DOCUMENT_NOT_FOUND', 404, CRIME_CONSENT_MESSAGES.documentNotFound)
expectCode('PORTAL_CONSENT_SIGNED_FILE_NOT_READY', 409, CRIME_CONSENT_MESSAGES.signedFileNotReady)
expectCode('PORTAL_CONSENT_DOCUMENT_FILE_NOT_READY', 409, CRIME_CONSENT_MESSAGES.documentFileNotReady)
expectCode('PORTAL_CONSENT_DOCUMENT_RETENTION_EXPIRED', 410, CRIME_CONSENT_MESSAGES.retentionExpired)
// 401은 code와 무관하게 로그인 안내, 모르는 code는 일반 문구
expectCode('PORTAL_CONSENT_DOCUMENT_NOT_FOUND', 401, CRIME_CONSENT_MESSAGES.unauthorized)
assert.equal(resolveCrimeConsentApiErrorMessage({ status: 401 }, fallback), CRIME_CONSENT_MESSAGES.unauthorized)
assert.equal(resolveCrimeConsentApiErrorMessage({ status: 403 }, fallback), CRIME_CONSENT_MESSAGES.forbidden)
assert.equal(resolveCrimeConsentApiErrorMessage({ code: 'OTHER', status: 409 }, fallback), fallback)
assert.equal(resolveCrimeConsentApiErrorMessage({}, fallback), fallback)

assert.equal(
  readCrimeConsentErrorCodeFromBody({ error: { code: 'PORTAL_CONSENT_SIGNED_FILE_NOT_READY' } }),
  'PORTAL_CONSENT_SIGNED_FILE_NOT_READY',
)
assert.equal(readCrimeConsentErrorCodeFromBody({ code: 'x_y' }), 'X_Y')
assert.equal(readCrimeConsentErrorCodeFromBody(null), null)
assert.equal(readCrimeConsentErrorCodeFromBody('text'), null)

console.log('crime-consent-original.selfcheck: ok')
