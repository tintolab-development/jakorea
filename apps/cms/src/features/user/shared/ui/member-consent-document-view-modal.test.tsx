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
  beforeEach(() => { mutateAsync.mockReset(); reset.mockReset() })

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

  it('keeps crime consent unavailable without presenting the signed snapshot as an uploaded original', async () => {
    renderModal({ templateId: 'agreement-crime', consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT', filledDocumentAvailable: true, documentAgreed: true })
    await waitFor(() => expect(document.body.textContent).toContain('원본'))
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(document.querySelector('.crime-consent-doc-modal__a4-outer img')).toBeNull()
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
