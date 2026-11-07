// @vitest-environment jsdom
/**
 * 마이페이지 초상권 — 진입 시 DRAFT 자동 생성의 중복 POST·경쟁·원본 보기 회귀.
 */
import { StrictMode, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PORTRAIT_CONSENT_DRAFT_DOCUMENT_TTL_MS,
  acquirePortraitConsentDraftDocument,
  releasePortraitConsentDraftDocument,
  resetPortraitConsentDraftDocumentSessionForTest,
} from '../src/features/mypage/settings/lib/portrait-consent-draft-document-session'

type Captured = {
  serverDraft?: unknown
  serverDraftPending?: boolean
  onSubmitAsync?: (state: unknown) => Promise<void>
}
const captured: Captured = {}

const createMock = vi.fn()
const submitMock = vi.fn()

vi.mock('../src/shared/lib/api-remote-env', () => ({ isRemoteApiConfigured: () => true }))
vi.mock('../src/shared/lib/auth-token', () => ({ getAccessToken: () => 'present' }))
vi.mock('../src/features/mypage/hooks/use-mypage-member', () => ({
  useMypageMember: () => ({ displayName: '김제이', isLoading: false }),
}))
vi.mock('../src/features/mypage/settings/lib/mypage-portrait-consent-draft', () => ({
  clearMypagePortraitConsentDraftState: () => {},
  saveMypagePortraitConsentDraftState: () => {},
}))
vi.mock('../src/features/mypage/settings/lib/submit-portal-consent-document', () => ({
  createPortraitConsentDraftDocument: (...args: unknown[]) => createMock(...args),
  submitPortalPortraitConsentFromWriteState: (...args: unknown[]) => submitMock(...args),
}))
vi.mock('../src/features/auth/sign-up/ui/portrait-consent-write-form', () => ({
  PortraitConsentWriteForm: (props: Captured) => {
    captured.serverDraft = props.serverDraft
    captured.serverDraftPending = props.serverDraftPending
    captured.onSubmitAsync = props.onSubmitAsync
    return null
  },
}))

const { MypagePortraitConsentWriteForm } = await import(
  '../src/features/mypage/settings/ui/mypage-portrait-consent-write-form'
)

const SERVER_SCHEMA = { schemaVersion: 1, paragraphs: [{ id: 'server-only' }] }
const doc = (documentId: number) => ({
  documentId,
  formTemplateVersion: { templateVersionId: 70 + documentId, schemaJson: SERVER_SCHEMA },
})

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root | null = null

async function mount(path = '/mypage/settings/consents/consentPortrait') {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(
      <StrictMode>
        <MemoryRouter initialEntries={[path]}>
          <MypagePortraitConsentWriteForm onComplete={() => {}} />
        </MemoryRouter>
      </StrictMode>,
    )
  })
}

async function unmount() {
  await act(async () => root?.unmount())
  root = null
  container.remove()
}

beforeEach(() => {
  resetPortraitConsentDraftDocumentSessionForTest()
  createMock.mockReset()
  submitMock.mockReset()
  submitMock.mockResolvedValue(undefined)
  captured.serverDraft = undefined
  captured.onSubmitAsync = undefined
})
afterEach(async () => {
  if (root) await unmount()
})

describe('acquirePortraitConsentDraftDocument', () => {
  it('동시 요청은 한 번만 생성', async () => {
    const create = vi.fn().mockResolvedValue(doc(1))
    const [a, b] = await Promise.all([
      acquirePortraitConsentDraftDocument('k', create),
      acquirePortraitConsentDraftDocument('k', create),
    ])
    expect(create).toHaveBeenCalledTimes(1)
    expect(a).toBe(b)
  })
  it('실패하면 다음 요청에서 다시 생성', async () => {
    const create = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(doc(2))
    await expect(acquirePortraitConsentDraftDocument('k', create)).rejects.toThrow('x')
    await expect(acquirePortraitConsentDraftDocument('k', create)).resolves.toEqual(doc(2))
    expect(create).toHaveBeenCalledTimes(2)
  })
  it('release·TTL 이후 새로 생성, 키(프로그램)별 분리', async () => {
    let t = 0
    const now = () => t
    const create = vi.fn().mockImplementation(async () => doc(3))
    await acquirePortraitConsentDraftDocument('k', create, now)
    await acquirePortraitConsentDraftDocument('k2', create, now)
    expect(create).toHaveBeenCalledTimes(2)
    releasePortraitConsentDraftDocument('k')
    await acquirePortraitConsentDraftDocument('k', create, now)
    expect(create).toHaveBeenCalledTimes(3)
    t = PORTRAIT_CONSENT_DRAFT_DOCUMENT_TTL_MS + 1
    await acquirePortraitConsentDraftDocument('k', create, now)
    expect(create).toHaveBeenCalledTimes(4)
  })
})

describe('MypagePortraitConsentWriteForm DRAFT 생성', () => {
  it('StrictMode 이중 effect에서도 POST 1회, 서버 양식을 폼에 전달', async () => {
    createMock.mockResolvedValue(doc(1))
    await mount()
    expect(createMock).toHaveBeenCalledTimes(1)
    expect(captured.serverDraft).toEqual(SERVER_SCHEMA)
  })

  it('취소 후 재진입은 같은 DRAFT 재사용(POST 추가 없음), 제출 후 재진입은 새로 생성', async () => {
    createMock.mockResolvedValueOnce(doc(1)).mockResolvedValueOnce(doc(2))
    await mount()
    await unmount()
    await mount()
    expect(createMock).toHaveBeenCalledTimes(1)
    await act(async () => {
      await captured.onSubmitAsync!({ draft: SERVER_SCHEMA })
    })
    expect(submitMock).toHaveBeenCalledTimes(1)
    expect((submitMock.mock.calls[0]![1] as { createdDocument: { documentId: number } }).createdDocument.documentId).toBe(1)
    expect(createMock).toHaveBeenCalledTimes(1)
    await unmount()
    await mount()
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('생성 응답 전에 제출해도 같은 요청을 기다려 POST 1회', async () => {
    let resolve!: (v: unknown) => void
    createMock.mockReturnValue(new Promise(r => (resolve = r)))
    await mount()
    expect(captured.serverDraftPending).toBe(true)
    let submitPromise!: Promise<void>
    await act(async () => {
      submitPromise = captured.onSubmitAsync!({ draft: SERVER_SCHEMA })
    })
    await act(async () => {
      resolve(doc(5))
      await submitPromise
    })
    expect(createMock).toHaveBeenCalledTimes(1)
    expect(captured.serverDraftPending).toBe(false)
    expect((submitMock.mock.calls[0]![1] as { createdDocument: { documentId: number } }).createdDocument.documentId).toBe(5)
  })

  it('제출 실패 시 DRAFT 해제 → 다음 진입은 새로 생성', async () => {
    createMock.mockResolvedValueOnce(doc(1)).mockResolvedValueOnce(doc(2))
    submitMock.mockRejectedValueOnce(new Error('409'))
    await mount()
    await act(async () => {
      await expect(captured.onSubmitAsync!({ draft: SERVER_SCHEMA })).rejects.toThrow('409')
    })
    await unmount()
    await mount()
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('원본 보기(?mode=view)에서는 POST 하지 않음', async () => {
    await mount('/mypage/settings/consents/consentPortrait?mode=view')
    expect(createMock).not.toHaveBeenCalled()
    expect(captured.serverDraftPending).toBe(false)
  })
})
