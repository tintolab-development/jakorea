import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { createProgramParticipantApplicationDraft } from '@/features/template/model/program-application-form-individual-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { createProgramApplicationFormInstitutionDraft } from '@/features/template/model/program-application-form-institution-draft'
import { createProgramApplicationFormEconomyDraft } from '@/features/template/model/program-application-form-economy-draft'
import {
  hasIncompleteApplicationFormThirdPartyRecipient,
  isApplicationFormThirdPartyRecipientColumn,
} from '@/features/template/model/application-form-third-party-recipient'
import {
  horizontalTableSetFieldCellValue,
  type HorizontalTableParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { clearRegistrationWizardSessionDrafts } from './registration-wizard-session-drafts'
import {
  describeIncompleteApplicationFormThirdPartyRecipient,
  hasIncompleteApplicationFormThirdPartyRecipientForProgram,
} from './application-form-third-party-recipient-required'

function individualProgram(): Program {
  return {
    id: '100001',
    generalParticipantTypes: ['individual'],
  } as Program
}

function fillRecipient(draft: ReturnType<typeof createProgramParticipantApplicationDraft>, value: string) {
  const paragraph = draft.paragraphs.find(
    item => item.id === PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent
  ) as HorizontalTableParagraph | undefined
  if (paragraph == null) throw new Error('third party paragraph missing')
  const next = horizontalTableSetFieldCellValue(paragraph, 0, 0, { kind: 'text', value })
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(item => (item.id === paragraph.id ? next : item)),
  }
}

describe('application form third-party recipient required', () => {
  beforeEach(() => {
    clearRegistrationWizardSessionDrafts()
  })

  it('시드 빈 「제공받는 곳」은 미입력이고, 값을 넣으면 완료한다', () => {
    const seed = createProgramParticipantApplicationDraft()
    expect(hasIncompleteApplicationFormThirdPartyRecipient(seed)).toBe(true)
    expect(hasIncompleteApplicationFormThirdPartyRecipient(fillRecipient(seed, 'JA Korea'))).toBe(
      false
    )
  })

  it('placeholder 문구가 셀 값으로 남아 있으면 미입력이다', () => {
    const seed = createProgramParticipantApplicationDraft()
    expect(
      hasIncompleteApplicationFormThirdPartyRecipient(
        fillRecipient(seed, '제공받는 곳을 입력해 주세요')
      )
    ).toBe(true)
  })

  it('제공받는 곳 열만 필수 칸으로 본다', () => {
    const paragraphId = PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent
    const headers = ['제공받는 곳', '수집 항목', '수집·이용 목적', '제공받는 자의 보유기간']
    expect(isApplicationFormThirdPartyRecipientColumn(paragraphId, 0, headers)).toBe(true)
    expect(isApplicationFormThirdPartyRecipientColumn(paragraphId, 1, headers)).toBe(false)
  })

  it('등록 위저드 — 개인 신청 시드가 비어 있으면 막는다', () => {
    const program = individualProgram()
    expect(hasIncompleteApplicationFormThirdPartyRecipientForProgram({ program })).toBe(true)
    expect(describeIncompleteApplicationFormThirdPartyRecipient({ program })).toBe(
      'application.application-participant-individual.thirdPartyRecipient'
    )
  })

  it('현재 탭 draft가 채워져 있으면 통과한다', () => {
    const program = individualProgram()
    const filled = fillRecipient(createProgramParticipantApplicationDraft(), '황유정')
    expect(
      hasIncompleteApplicationFormThirdPartyRecipientForProgram({
        program,
        current: { templateCode: 'application-participant-individual', draft: filled },
      })
    ).toBe(false)
  })

  it('기관·1사1교 신청 시드도 제공받는 곳이 비면 미입력이다', () => {
    expect(
      hasIncompleteApplicationFormThirdPartyRecipient(createProgramApplicationFormInstitutionDraft())
    ).toBe(true)
    expect(
      hasIncompleteApplicationFormThirdPartyRecipient(createProgramApplicationFormEconomyDraft())
    ).toBe(true)
  })
})
