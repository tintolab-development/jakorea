import { describe, expect, it, vi } from 'vitest'
import { buildParticipantScreeningLeadingHeaderActions } from './participant-screening-header-actions'

describe('buildParticipantScreeningLeadingHeaderActions', () => {
  const onCancelDocumentApproval = vi.fn()
  const onWithdrawActivity = vi.fn()

  it('1차 서류 심사 상세(doc1) — CANCEL_DOCUMENT_APPROVAL이면 「승인 취소」를 맨 앞에 둔다', () => {
    const items = buildParticipantScreeningLeadingHeaderActions({
      screeningStage: 'doc1',
      availableActions: ['CANCEL_DOCUMENT_APPROVAL'],
      onCancelDocumentApproval,
    })
    expect(items?.map(item => [item.key, item.label, item.variant])).toEqual([
      ['cancel-document-approval', '승인 취소', 'delete'],
    ])
    items?.[0].onClick?.()
    expect(onCancelDocumentApproval).toHaveBeenCalledTimes(1)
  })

  it('1차 서류 합격자·2차 면접 상세에는 CANCEL_DOCUMENT_APPROVAL이 있어도 「승인 취소」를 두지 않는다', () => {
    for (const screeningStage of ['doc_passed', 'interview2'] as const) {
      const items = buildParticipantScreeningLeadingHeaderActions({
        screeningStage,
        availableActions: ['CANCEL_DOCUMENT_APPROVAL', 'GIVE_UP'],
        onCancelDocumentApproval,
        onWithdrawActivity,
      })
      expect(items?.map(item => item.key)).toEqual(['give-up'])
    }
  })

  it('CANCEL_APPROVAL(최종 승인 취소)만 있으면 서류 승인 취소를 띄우지 않는다', () => {
    expect(
      buildParticipantScreeningLeadingHeaderActions({
        screeningStage: 'doc1',
        availableActions: ['CANCEL_APPROVAL'],
        onCancelDocumentApproval,
      })
    ).toBeUndefined()
  })

  it('availableActions가 없거나 핸들러가 없으면 노출하지 않는다', () => {
    expect(
      buildParticipantScreeningLeadingHeaderActions({
        screeningStage: 'doc1',
        availableActions: undefined,
        onCancelDocumentApproval,
        onWithdrawActivity,
      })
    ).toBeUndefined()
    expect(
      buildParticipantScreeningLeadingHeaderActions({
        screeningStage: 'doc_passed',
        availableActions: ['GIVE_UP'],
      })
    ).toBeUndefined()
  })
})
