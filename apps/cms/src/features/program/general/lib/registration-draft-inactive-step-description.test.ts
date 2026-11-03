/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  createProgramApplicationFormEconomyDraft,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS,
} from '@/features/template/model/program-application-form-economy-draft'
import {
  horizontalTableSetFieldCellValue,
  type HorizontalTableParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { hasIncompleteApplicationFormThirdPartyRecipient } from '@/features/template/model/application-form-third-party-recipient'

const loadRegistrationWizardFormDraft = vi.fn()
const persistRegistrationWizardFormDraft = vi.fn()

vi.mock('@/features/program/general/lib/registration-wizard-form-draft', () => ({
  loadRegistrationWizardFormDraft: (...args: unknown[]) =>
    loadRegistrationWizardFormDraft(...args),
  persistRegistrationWizardFormDraft: (...args: unknown[]) =>
    persistRegistrationWizardFormDraft(...args),
}))

import { persistRegistrationOperationalOverlaysToLocal } from './registration-operational-form-drafts'
import {
  clearRegistrationWizardSessionDrafts,
  rememberRegistrationWizardSessionDraft,
} from './registration-wizard-session-drafts'
import { resetAllOperationalOverlayStoresForTests } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import { clearRegistrationStepTemplateSelections } from '@/features/program/shared/lib/step-template-selection'

function draftWithDescription(description: string): WritingFormDraft {
  return {
    paragraphs: [{ id: 'p1', title: '참여자 모집 정보', description, items: [] }],
  } as unknown as WritingFormDraft
}

function persistedDraftFor(templateCode: string): WritingFormDraft | undefined {
  const calls = persistRegistrationWizardFormDraft.mock.calls
    .map(call => call[0] as { templateCode: string; draft: WritingFormDraft })
    .filter(arg => arg.templateCode === templateCode)
  return calls.at(-1)?.draft
}

function descriptionOf(draft: WritingFormDraft | undefined): unknown {
  return (draft?.paragraphs[0] as { description?: unknown } | undefined)?.description
}

describe('임시저장 — 비활성 단계 단락 설명(카드 설명 입력)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllOperationalOverlayStoresForTests()
    clearRegistrationStepTemplateSelections()
    clearRegistrationWizardSessionDrafts()
    persistRegistrationWizardFormDraft.mockResolvedValue(undefined)
  })

  it('일반: 신청 단계에서 저장해도 떠난 모집 탭 draft 설명을 남긴다', async () => {
    loadRegistrationWizardFormDraft.mockImplementation(async (args: { templateCode: string }) =>
      args.templateCode === 'recruitment-participant-individual'
        ? { draft: draftWithDescription('stale'), overlay: { 'x.y': 1 } }
        : null
    )
    rememberRegistrationWizardSessionDraft({
      templateCode: 'recruitment-participant-individual',
      draft: draftWithDescription('모집 설명 R'),
    })

    await persistRegistrationOperationalOverlaysToLocal('GENERAL', 'general', {
      preferSessionDrafts: true,
      activeCatalogId: 'application-participant-individual',
    })

    expect(descriptionOf(persistedDraftFor('recruitment-participant-individual'))).toBe(
      '모집 설명 R'
    )
  })

  it('일반: 활성 탭은 세션 draft(이전 스냅샷)가 아니라 방금 저장한 localStorage draft를 쓴다', async () => {
    loadRegistrationWizardFormDraft.mockImplementation(async (args: { templateCode: string }) =>
      args.templateCode === 'application-participant-individual'
        ? { draft: draftWithDescription('fresh'), overlay: { 'x.y': 1 } }
        : null
    )
    rememberRegistrationWizardSessionDraft({
      templateCode: 'application-participant-individual',
      draft: draftWithDescription('old snapshot'),
    })

    await persistRegistrationOperationalOverlaysToLocal('GENERAL', 'general', {
      preferSessionDrafts: true,
      activeCatalogId: 'application-participant-individual',
    })

    const saved = persistedDraftFor('application-participant-individual')
    if (saved != null) expect(descriptionOf(saved)).toBe('fresh')
  })

  it('TT: 모집 단계에서 저장해도 떠난 신청 탭 draft 설명을 남긴다', async () => {
    loadRegistrationWizardFormDraft.mockResolvedValue(null)
    rememberRegistrationWizardSessionDraft({
      templateCode: 'application-trained-teachers',
      draft: draftWithDescription('신청 설명 A'),
    })

    await persistRegistrationOperationalOverlaysToLocal('TRAINED_TEACHER', 'trainedTeachers', {
      preferSessionDrafts: true,
      activeCatalogId: 'recruitment-trained-teachers',
    })

    expect(descriptionOf(persistedDraftFor('application-trained-teachers'))).toBe('신청 설명 A')
  })

  it('UJAT: 옵션 없이 localStorage/seed를 쓰고 세션 draft를 쓰지 않는다', async () => {
    loadRegistrationWizardFormDraft.mockResolvedValue(null)
    rememberRegistrationWizardSessionDraft({
      templateCode: 'application-ujat-school',
      draft: draftWithDescription('세션'),
    })

    await persistRegistrationOperationalOverlaysToLocal('UJAT', 'ujat')

    expect(descriptionOf(persistedDraftFor('application-ujat-school'))).not.toBe('세션')
  })

  it('1사1교: 세션의 제공받는 곳 값이 seed를 덮지 못하게 한다', async () => {
    loadRegistrationWizardFormDraft.mockResolvedValue(null)
    const seed = createProgramApplicationFormEconomyDraft()
    const paragraph = seed.paragraphs.find(
      item => item.id === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent
    ) as HorizontalTableParagraph | undefined
    if (paragraph == null) throw new Error('third party paragraph missing')
    const filledParagraph = horizontalTableSetFieldCellValue(paragraph, 0, 0, {
      kind: 'text',
      value: 'JA코리아',
    })
    const filled = {
      ...seed,
      paragraphs: seed.paragraphs.map(item =>
        item.id === paragraph.id ? filledParagraph : item
      ),
    }
    expect(hasIncompleteApplicationFormThirdPartyRecipient(filled)).toBe(false)
    rememberRegistrationWizardSessionDraft({
      templateCode: 'application-economy',
      draft: filled,
    })

    await persistRegistrationOperationalOverlaysToLocal('COMPANY_SCHOOL', 'economy', {
      preferSessionDrafts: true,
      activeCatalogId: 'recruitment-economy',
    })

    const persisted = persistedDraftFor('application-economy')
    expect(persisted).toBeTruthy()
    expect(hasIncompleteApplicationFormThirdPartyRecipient(persisted!)).toBe(false)
  })
})
