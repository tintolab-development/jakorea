// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemberConsentDocumentViewModal } from './member-consent-document-view-modal'
import { writingFormDraftToSchemaJson } from '@/features/template/api/adapters/form-template-draft-adapters'
import {
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createEducatorFacilitatorPledgeDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { createPaymentStatementPreConsentDraft } from '@/features/template/model/payment-statement-pre-consent-draft'

const mutateAsync = vi.fn()
const reset = vi.fn()
vi.mock('@/features/user/api/hooks/use-consent-filled-document-mutation', () => ({
  useConsentFilledDocumentMutation: () => ({ mutateAsync, reset, isPending: false }),
}))
vi.mock('@/features/user/api/get-member-api-error', () => ({
  getMemberApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}))
vi.mock('@/shared/utils/error-handler', () => ({ handleError: vi.fn() }))
vi.mock('@/features/template/hooks/use-a4-paragraph-pages', () => ({
  useA4ParagraphPages: ({ allParagraphs }: { allParagraphs: unknown[] }) => ({
    pages: [allParagraphs], overflowParagraphIds: new Set<string>(), measureLayer: null,
  }),
}))
vi.mock('@/shared/ui/cms-alert-modal-provider', () => ({
  useCmsAlert: () => ({ showAlert: vi.fn() }),
}))
vi.mock('@/features/auth/model/auth-store', () => ({
  useAuthStore: (select?: (state: { user: { roleCode: string } }) => unknown) => {
    const state = { user: { roleCode: 'MASTER' } }
    return typeof select === 'function' ? select(state) : state
  },
}))

const loadConsentSignedSignatureBlobRemote = vi.fn()
const fetchConsentSignedDocumentRemote = vi.fn()
const fetchConsentOriginalFileBlobRemote = vi.fn()
vi.mock('@/features/user/api/members-api-client', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/user/api/members-api-client')>()
  return {
    ...actual,
    loadConsentSignedSignatureBlobRemote: (...args: unknown[]) =>
      loadConsentSignedSignatureBlobRemote(...args),
    fetchConsentSignedDocumentRemote: (...args: unknown[]) =>
      fetchConsentSignedDocumentRemote(...args),
    fetchConsentOriginalFileBlobRemote: (...args: unknown[]) =>
      fetchConsentOriginalFileBlobRemote(...args),
  }
})

const cases = [
  { title: 'payment', templateId: 'agreement-third-party', type: 'PAYMENT_STATEMENT_CONSENT', create: createPaymentStatementPreConsentDraft },
  { title: 'portrait', templateId: 'agreement-portrait', type: 'PORTRAIT_RIGHTS', create: createAgreementPortraitDraft },
  { title: 'facilitator', templateId: 'agreement-expense', type: 'FACILITATOR_PLEDGE', create: createEducatorFacilitatorPledgeDraft },
  { title: 'administrative', templateId: 'agreement-notice', type: 'ADMINISTRATIVE_INFO_CONSENT', create: createAgreementNoticeDraft },
] as const

function renderModal(props: Record<string, unknown>) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } })
  return render(
    <MemoryRouter><QueryClientProvider client={client}>
      <MemberConsentDocumentViewModal open memberId={701} templateId="agreement-portrait" membersRemote modalTitle="Mock consent" onClose={vi.fn()} {...props} />
    </QueryClientProvider></MemoryRouter>
  )
}

describe('member consent filled document rendering', () => {
  afterEach(cleanup)
  beforeEach(() => {
    mutateAsync.mockReset()
    reset.mockReset()
    loadConsentSignedSignatureBlobRemote.mockReset()
    loadConsentSignedSignatureBlobRemote.mockResolvedValue(null)
    fetchConsentSignedDocumentRemote.mockReset()
    fetchConsentOriginalFileBlobRemote.mockReset()
    fetchConsentSignedDocumentRemote.mockResolvedValue({
      originalFileObjectId: 88,
      originalDownloadApi: '/api/admin/files/88/sensitive-downloads',
    })
    fetchConsentOriginalFileBlobRemote.mockResolvedValue(null)
  })

  it.each(cases)('$title renders the server-filled schema in the A4 document view', async item => {
    const draft = item.create()
    const marker = `MOCK_FILLED_${item.title.toUpperCase()}_701`
    const explainer = draft.paragraphs.find(p => p.kind === 'single_item' && p.variant === 'agreement_explanation_text')
    if (explainer?.kind === 'single_item' && explainer.variant === 'agreement_explanation_text') explainer.bodyText = marker
    const closing = draft.paragraphs.find(p => p.kind === 'description' && p.variant === 'closing')
    if (closing?.kind === 'description' && closing.variant === 'closing') closing.body = marker
    mutateAsync.mockResolvedValue({
      filledDocumentId: 9001,
      consentRecordId: 81,
      memberId: 701,
      consentType: item.type,
      schemaJson: writingFormDraftToSchemaJson(draft),
      ...(item.type === 'PAYMENT_STATEMENT_CONSENT' ? { paymentBasicInfo: { nameKo: marker, bankName: 'Mock Bank', accountNumber: '123456' } } : {}),
    })
    renderModal({ templateId: item.templateId, consentType: item.type, filledDocumentAvailable: true })
    if (item.templateId === 'agreement-third-party' || item.templateId === 'agreement-notice') {
      const reason = document.querySelector('.user-personal-info-reveal-confirm-modal') as HTMLElement
      const input = reason.querySelector('textarea, input')
      if (input) fireEvent.change(input, { target: { value: 'authorized review' } })
      const buttons = [...(reason.closest('.ant-modal') ?? reason).querySelectorAll('button')]
      fireEvent.click(buttons[buttons.length - 1]!)
    }
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(document.body.textContent).toContain(marker))
    expect(document.body.textContent).not.toContain('MOCK_FILLED_OTHER')
    expect(document.querySelector('.template-preview-modal--agreement-layout')).toBeTruthy()
  })

  it('does not request a document when consent metadata is absent even when agreed', async () => {
    renderModal({ templateId: 'agreement-portrait', consentType: 'PORTRAIT_RIGHTS', documentAgreed: true })
    await waitFor(() => expect(mutateAsync).not.toHaveBeenCalled())
    expect(document.body.textContent).not.toContain('MOCK_FILLED')
  })

  it('loads the crime consent original after privacy reason instead of filled-document', async () => {
    fetchConsentOriginalFileBlobRemote.mockResolvedValue(
      new Blob([new Uint8Array([1, 2, 3])], { type: 'application/pdf' })
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-crime-original')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    renderModal({
      templateId: 'agreement-crime',
      consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT',
      filledDocumentAvailable: true,
      documentAgreed: true,
    })
    const reason = document.querySelector('.user-personal-info-reveal-confirm-modal') as HTMLElement
    const input = reason.querySelector('textarea, input')
    if (input) fireEvent.change(input, { target: { value: 'authorized review' } })
    const buttons = [...(reason.closest('.ant-modal') ?? reason).querySelectorAll('button')]
    fireEvent.click(buttons[buttons.length - 1]!)
    await waitFor(() => expect(fetchConsentSignedDocumentRemote).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(fetchConsentOriginalFileBlobRemote).toHaveBeenCalledTimes(1))
    expect(mutateAsync).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(document.querySelector('.crime-consent-doc-modal__a4-outer')).toBeTruthy()
    })
  })

  it('shows crime original unavailable when signed-document has no uploaded file', async () => {
    renderModal({
      templateId: 'agreement-crime',
      consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT',
      filledDocumentAvailable: true,
      documentAgreed: true,
    })
    const reason = document.querySelector('.user-personal-info-reveal-confirm-modal') as HTMLElement
    const input = reason.querySelector('textarea, input')
    if (input) fireEvent.change(input, { target: { value: 'authorized review' } })
    const buttons = [...(reason.closest('.ant-modal') ?? reason).querySelectorAll('button')]
    fireEvent.click(buttons[buttons.length - 1]!)
    await waitFor(() =>
      expect(document.body.textContent).toContain('제출된 성범죄 경력조회 동의서 원본을 불러올 수 없습니다.')
    )
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(document.querySelector('.crime-consent-doc-modal__a4-outer img')).toBeNull()
  })

  it('shows the document signature stack for submitted consents even without an image', async () => {
    const draft = createAgreementPortraitDraft()
    mutateAsync.mockResolvedValue({
      filledDocumentId: 9001,
      schemaJson: writingFormDraftToSchemaJson(draft),
    })
    renderModal({
      templateId: 'agreement-portrait',
      consentType: 'PORTRAIT_RIGHTS',
      filledDocumentAvailable: true,
      memberUser: { name: '황범진' },
    })
    await waitFor(() => expect(document.body.textContent).toContain('동의자'))
    expect(document.body.textContent).toContain('(서명)')
    expect(document.body.textContent).not.toContain('당사자의 서면 동의')
  })

  it('shows the portal e-signature image when signed-document returns a signed field', async () => {
    const draft = createAgreementPortraitDraft()
    mutateAsync.mockResolvedValue({
      filledDocumentId: 9001,
      consentRecordId: 81,
      memberId: 701,
      consentType: 'PORTRAIT_RIGHTS',
      savedAt: '2026-10-20T10:14:06.121586Z',
      schemaJson: writingFormDraftToSchemaJson(draft),
    })
    loadConsentSignedSignatureBlobRemote.mockResolvedValue(
      new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-portal-signature')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    renderModal({
      templateId: 'agreement-portrait',
      consentType: 'PORTRAIT_RIGHTS',
      filledDocumentAvailable: true,
    })
    await waitFor(() => expect(loadConsentSignedSignatureBlobRemote).toHaveBeenCalledTimes(1))
    await waitFor(() => {
      const image = document.querySelector('img[alt="전자서명"]') as HTMLImageElement | null
      expect(image?.getAttribute('src')).toBe('blob:mock-portal-signature')
    })
  })

  it('clears mutation state when the modal closes', async () => {
    const onClose = vi.fn()
    mutateAsync.mockResolvedValue({})
    const client = new QueryClient()
    const view = render(<MemoryRouter><QueryClientProvider client={client}><MemberConsentDocumentViewModal open templateId="agreement-portrait" modalTitle="Mock" memberId={701} consentType="PORTRAIT_RIGHTS" membersRemote filledDocumentAvailable onClose={onClose} /></QueryClientProvider></MemoryRouter>)
    view.rerender(<MemoryRouter><QueryClientProvider client={client}><MemberConsentDocumentViewModal open={false} templateId="agreement-portrait" modalTitle="Mock" memberId={701} consentType="PORTRAIT_RIGHTS" membersRemote filledDocumentAvailable onClose={onClose} /></QueryClientProvider></MemoryRouter>)
    await waitFor(() => expect(reset).toHaveBeenCalled())
  })
})
