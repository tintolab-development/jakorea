import assert from 'node:assert/strict'
import {
  CRIME_CONSENT_MESSAGES,
  CrimeConsentOriginalNotReadyError,
  type CrimeConsentOriginalFile,
} from './crime-consent-original.ts'
import {
  createCrimeConsentSubmitSession,
  CrimeConsentSubmitError,
  decideCrimeConsentSubmitStep,
  resolveCrimeConsentCompleteFailureAction,
  submitCrimeConsentOriginal,
  type CrimeConsentApiFailure,
  type CrimeConsentSubmitDeps,
} from './crime-consent-submit.ts'

/** fake API 응답: 객체면 그대로 반환, `ApiFailure`면 서버 오류, `'network'`면 응답 유실 */
class ApiFailure extends Error {
  readonly failure: CrimeConsentApiFailure
  constructor(status: number, code: string) {
    super(code)
    this.failure = { status, code }
  }
}
type Reply<T> = T | ApiFailure | 'network'

function settle<T>(reply: Reply<T>): Promise<T> {
  if (reply === 'network') return Promise.reject(new TypeError('Failed to fetch'))
  if (reply instanceof ApiFailure) return Promise.reject(reply)
  return Promise.resolve(reply)
}

const READY: CrimeConsentOriginalFile = {
  filePurpose: 'CRIMINAL_HISTORY_CONSENT_ORIGINAL',
  contentType: 'application/pdf',
  scanStatus: 'CLEAN',
  uploadStatus: 'AVAILABLE',
}
const PENDING: CrimeConsentOriginalFile = { ...READY, uploadStatus: 'PROMOTION_PENDING' }
const NOT_OWNED = new ApiFailure(403, 'MEMBER_FILE_NOT_OWNED')
const SIGNED = { documentId: 0, documentStatus: 'SIGNED' }

function fakeApi(script: {
  file: Reply<CrimeConsentOriginalFile>[]
  complete: Reply<{ documentStatus?: string }>[]
  document?: Reply<{ documentStatus?: string }>[]
}) {
  const calls = {
    fetchFile: [] as number[],
    createDocument: 0,
    complete: [] as { documentId: number; body: { evidenceFileObjectId: number } }[],
    fetchDocument: [] as number[],
    bugs: [] as string[],
  }
  let nextDocumentId = 1694900
  const take = <T>(queue: Reply<T>[], name: string): Reply<T> => {
    const reply = queue.shift()
    if (reply === undefined) throw new Error(`unexpected ${name} call`)
    return reply
  }
  const deps: CrimeConsentSubmitDeps = {
    fetchFile: id => {
      calls.fetchFile.push(id)
      return settle(take(script.file, 'fetchFile'))
    },
    createDocument: () => {
      calls.createDocument += 1
      return Promise.resolve({ documentId: nextDocumentId++ })
    },
    completeDocument: (documentId, body) => {
      calls.complete.push({ documentId, body })
      return settle(take(script.complete, 'complete'))
    },
    fetchDocument: documentId => {
      calls.fetchDocument.push(documentId)
      return settle(take(script.document ?? [], 'fetchDocument'))
    },
    readApiFailure: error => (error instanceof ApiFailure ? error.failure : null),
    reportClientBug: code => {
      calls.bugs.push(code)
    },
  }
  return { deps, calls }
}

async function rejects<T extends Error>(
  promise: Promise<unknown>,
  type: new (...args: never[]) => T,
): Promise<T> {
  try {
    await promise
  } catch (error) {
    assert.ok(error instanceof type, `expected ${type.name}, got ${String(error)}`)
    return error as T
  }
  assert.fail(`expected ${type.name}`)
}

// 판정 표
assert.equal(decideCrimeConsentSubmitStep('ready', false), 'complete')
assert.equal(decideCrimeConsentSubmitStep('pending', true), 'wait')
assert.equal(decideCrimeConsentSubmitStep('invalid', true), 'reupload')
assert.equal(decideCrimeConsentSubmitStep('unknown', true), 'complete')
assert.equal(decideCrimeConsentSubmitStep('unknown', false), 'reupload')
assert.equal(resolveCrimeConsentCompleteFailureAction('CONSENT_ORIGINAL_FILE_ALREADY_LINKED'), 'alreadyLinked')
assert.equal(resolveCrimeConsentCompleteFailureAction('SOMETHING_NEW'), 'fail')
assert.equal(resolveCrimeConsentCompleteFailureAction(null), 'fail')

// 정상 경로: ready → POST /documents → complete { evidenceFileObjectId }
{
  const { deps, calls } = fakeApi({ file: [READY], complete: [SIGNED] })
  const session = createCrimeConsentSubmitSession()
  await submitCrimeConsentOriginal(deps, session, 2056500)
  assert.equal(calls.createDocument, 1)
  assert.deepEqual(calls.complete, [{ documentId: 1694900, body: { evidenceFileObjectId: 2056500 } }])
}

// pending → complete 없이 대기, invalid → 재업로드
{
  const { deps, calls } = fakeApi({ file: [PENDING], complete: [] })
  const error = await rejects(
    submitCrimeConsentOriginal(deps, createCrimeConsentSubmitSession(), 2056500),
    CrimeConsentOriginalNotReadyError,
  )
  assert.equal(error.reason, 'pending')
  assert.equal(calls.complete.length, 0)
}
{
  const { deps, calls } = fakeApi({
    file: [{ ...READY, filePurpose: 'CRIMINAL_HISTORY_EVIDENCE' }],
    complete: [],
  })
  const error = await rejects(
    submitCrimeConsentOriginal(deps, createCrimeConsentSubmitSession(), 2056241),
    CrimeConsentOriginalNotReadyError,
  )
  assert.equal(error.reason, 'invalid')
  assert.equal(calls.createDocument, 0)
}

// M1-b: complete 응답 유실 → 재시도 시 GET 403(unknown) → 같은 문서·같은 파일로 재전송 → 200
{
  const { deps, calls } = fakeApi({ file: [READY, NOT_OWNED], complete: ['network', SIGNED] })
  const session = createCrimeConsentSubmitSession()
  const lost = await rejects(submitCrimeConsentOriginal(deps, session, 2056500), CrimeConsentSubmitError)
  assert.equal(lost.message, CRIME_CONSENT_MESSAGES.network)
  assert.deepEqual(session, { documentId: 1694900, completeSentFileObjectId: 2056500 })
  await submitCrimeConsentOriginal(deps, session, 2056500)
  assert.equal(calls.createDocument, 1)
  assert.deepEqual(
    calls.complete.map(call => [call.documentId, call.body.evidenceFileObjectId]),
    [
      [1694900, 2056500],
      [1694900, 2056500],
    ],
  )
}

// M1-b: 404 MEMBER_FILE_NOT_FOUND도 unknown. 재전송이 409 NOT_READY면 invalid → 재업로드
{
  const { deps, calls } = fakeApi({
    file: [READY, new ApiFailure(404, 'MEMBER_FILE_NOT_FOUND')],
    complete: ['network', new ApiFailure(409, 'CONSENT_ORIGINAL_FILE_NOT_READY')],
  })
  const session = createCrimeConsentSubmitSession()
  await rejects(submitCrimeConsentOriginal(deps, session, 2056500), CrimeConsentSubmitError)
  const error = await rejects(
    submitCrimeConsentOriginal(deps, session, 2056500),
    CrimeConsentOriginalNotReadyError,
  )
  assert.equal(error.reason, 'invalid')
  assert.equal(calls.complete.length, 2)
  assert.deepEqual(session, { documentId: null, completeSentFileObjectId: null })
}

// M1-c: complete를 보낸 적 없는데 unknown → 재업로드, complete 없음
{
  const { deps, calls } = fakeApi({ file: [NOT_OWNED], complete: [] })
  const error = await rejects(
    submitCrimeConsentOriginal(deps, createCrimeConsentSubmitSession(), 2056500),
    CrimeConsentOriginalNotReadyError,
  )
  assert.equal(error.reason, 'invalid')
  assert.equal(calls.complete.length, 0)
}

// M1: 다른 코드의 403·5xx 재확인 실패는 unknown이 아니다 — ID·이력 유지, 오류 안내
{
  const { deps, calls } = fakeApi({ file: [new ApiFailure(500, 'INTERNAL')], complete: [] })
  const session = { documentId: 1694900, completeSentFileObjectId: 2056500 }
  await rejects(submitCrimeConsentOriginal(deps, session, 2056500), CrimeConsentSubmitError)
  assert.equal(calls.complete.length, 0)
  assert.deepEqual(session, { documentId: 1694900, completeSentFileObjectId: 2056500 })
}

// M2: 409 ALREADY_LINKED → 문서 재조회 SIGNED → 완료
{
  const { deps, calls } = fakeApi({
    file: [READY],
    complete: [new ApiFailure(409, 'CONSENT_ORIGINAL_FILE_ALREADY_LINKED')],
    document: [{ documentStatus: 'SIGNED' }],
  })
  await submitCrimeConsentOriginal(deps, createCrimeConsentSubmitSession(), 2056500)
  assert.deepEqual(calls.fetchDocument, [1694900])
}
// M2: 재조회가 SIGNED가 아니면 완료로 보지 않고, 재업로드도 요구하지 않는다
{
  const { deps } = fakeApi({
    file: [READY],
    complete: [new ApiFailure(409, 'CONSENT_ORIGINAL_FILE_ALREADY_LINKED')],
    document: [{ documentStatus: 'DRAFT' }],
  })
  const error = await rejects(
    submitCrimeConsentOriginal(deps, createCrimeConsentSubmitSession(), 2056500),
    CrimeConsentSubmitError,
  )
  assert.equal(error.code, 'CONSENT_ORIGINAL_FILE_ALREADY_LINKED')
}

// 409 NOT_READY (ready로 보낸 경우): 다시 GET해 pending이면 「검사 상태 확인」
{
  const { deps } = fakeApi({
    file: [READY, PENDING],
    complete: [new ApiFailure(409, 'CONSENT_ORIGINAL_FILE_NOT_READY')],
  })
  const error = await rejects(
    submitCrimeConsentOriginal(deps, createCrimeConsentSubmitSession(), 2056500),
    CrimeConsentOriginalNotReadyError,
  )
  assert.equal(error.reason, 'pending')
}

// 409 ALREADY_USED → ID 폐기·재업로드
{
  const { deps } = fakeApi({
    file: [READY],
    complete: [new ApiFailure(409, 'CONSENT_ORIGINAL_FILE_ALREADY_USED')],
  })
  const error = await rejects(
    submitCrimeConsentOriginal(deps, createCrimeConsentSubmitSession(), 2056500),
    CrimeConsentOriginalNotReadyError,
  )
  assert.equal(error.reason, 'invalid')
  assert.equal(error.message, CRIME_CONSENT_MESSAGES.fileAlreadyUsed)
}

// 409 LINK_CONFLICT → 문서 재조회 후 수동 재시도 (자동 재요청 없음, 이력 유지)
{
  const { deps, calls } = fakeApi({
    file: [READY],
    complete: [new ApiFailure(409, 'CONSENT_ORIGINAL_FILE_LINK_CONFLICT')],
    document: [{ documentStatus: 'DRAFT' }],
  })
  const session = createCrimeConsentSubmitSession()
  await rejects(submitCrimeConsentOriginal(deps, session, 2056500), CrimeConsentSubmitError)
  assert.equal(calls.complete.length, 1)
  assert.deepEqual(calls.fetchDocument, [1694900])
  assert.deepEqual(session, { documentId: 1694900, completeSentFileObjectId: 2056500 })
}

// 버전 충돌 → 새 DRAFT에 같은 파일로 1회만 재전송
{
  const { deps, calls } = fakeApi({
    file: [READY],
    complete: [new ApiFailure(409, 'PORTAL_CONSENT_TEMPLATE_VERSION_CHANGED'), SIGNED],
  })
  await submitCrimeConsentOriginal(deps, createCrimeConsentSubmitSession(), 2056500)
  assert.equal(calls.createDocument, 2)
  assert.deepEqual(
    calls.complete.map(call => [call.documentId, call.body.evidenceFileObjectId]),
    [
      [1694900, 2056500],
      [1694901, 2056500],
    ],
  )
}
{
  const { deps, calls } = fakeApi({
    file: [READY],
    complete: [
      new ApiFailure(409, 'PORTAL_CONSENT_POLICY_VERSION_CHANGED'),
      new ApiFailure(409, 'PORTAL_CONSENT_DOCUMENT_NOT_DRAFT'),
    ],
  })
  const error = await rejects(
    submitCrimeConsentOriginal(deps, createCrimeConsentSubmitSession(), 2056500),
    CrimeConsentSubmitError,
  )
  assert.equal(error.message, CRIME_CONSENT_MESSAGES.versionChanged)
  assert.equal(calls.complete.length, 2)
}

// FE 버그 신호(400)는 로그를 남기고, 모르는 코드는 일반 문구 + 자동 재요청 없음
{
  const { deps, calls } = fakeApi({
    file: [READY],
    complete: [new ApiFailure(400, 'CONSENT_ORIGINAL_FILE_REQUIRED')],
  })
  await rejects(submitCrimeConsentOriginal(deps, createCrimeConsentSubmitSession(), 2056500), CrimeConsentSubmitError)
  assert.deepEqual(calls.bugs, ['CONSENT_ORIGINAL_FILE_REQUIRED'])
}
{
  const { deps, calls } = fakeApi({ file: [READY], complete: [new ApiFailure(409, 'BRAND_NEW_CODE')] })
  const error = await rejects(
    submitCrimeConsentOriginal(deps, createCrimeConsentSubmitSession(), 2056500),
    CrimeConsentSubmitError,
  )
  assert.equal(error.message, CRIME_CONSENT_MESSAGES.submitFailed)
  assert.equal(calls.complete.length, 1)
}

// Q7: 다른 파일로 바꾸면 예전 문서에 붙이지 않고 마지막 파일 ID로 새 문서를 만든다
{
  const { deps, calls } = fakeApi({ file: [READY], complete: [SIGNED] })
  const session = { documentId: 1694800, completeSentFileObjectId: 2056499 }
  await submitCrimeConsentOriginal(deps, session, 2056500)
  assert.equal(calls.createDocument, 1)
  assert.deepEqual(calls.complete, [{ documentId: 1694900, body: { evidenceFileObjectId: 2056500 } }])
}

// complete 200이라도 SIGNED가 아니면 성공으로 보지 않는다
{
  const { deps } = fakeApi({ file: [READY], complete: [{ documentStatus: 'DRAFT' }] })
  await rejects(submitCrimeConsentOriginal(deps, createCrimeConsentSubmitSession(), 2056500), CrimeConsentSubmitError)
}

console.log('crime-consent-submit.selfcheck: ok')
