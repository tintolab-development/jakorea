/** @vitest-environment jsdom */
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadRegistrationWizardFormDraft = vi.fn()
const persistRegistrationWizardFormDraft = vi.fn()

vi.mock('@/features/program/general/lib/registration-wizard-form-draft', () => ({
  loadRegistrationWizardFormDraft: (...args: unknown[]) =>
    loadRegistrationWizardFormDraft(...args),
  persistRegistrationWizardFormDraft: (...args: unknown[]) =>
    persistRegistrationWizardFormDraft(...args),
}))

vi.mock('@/features/template/context/template-writing-preview-context', () => ({
  TemplateWritingPreviewProvider: ({ children }: { children: unknown }) => children,
  useTemplateWritingPreview: () => ({
    isWritingUserPreviewOpen: false,
    openWritingUserPreview: () => {},
    closeWritingUserPreview: () => {},
    syncWritingUserPreviewSession: () => {},
    writingUserPreviewSession: null,
  }),
}))

import {
  createSeedDraftForOperationalCatalogId,
  persistRegistrationOperationalOverlaysToLocal,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  clearParticipantSessionOverlayFlushRegistry,
  flushParticipantSessionOverlaysToOperationalStores,
  seedParticipantSessionOverlayForTests,
} from '@/features/template/hooks/use-program-participant-application-editor'
import { resetAllOperationalOverlayStoresForTests } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import { CompanySchoolRegistrationWizardFormProvider } from '@/features/program/1c-1s/ui/registration/registration-wizard-form-provider'
import { peekCompanySchoolRegistrationRhf } from '@/features/program/1c-1s/lib/registration-rhf-api'
import {
  collectCompanySchoolRecruitFormState,
  readCompanySchoolRecruitEditorState,
} from '@/features/program/1c-1s/lib/recruit-form-state'
import {
  collectCompanySchoolApplicationFormState,
  readCompanySchoolApplicationEditorState,
} from '@/features/program/1c-1s/lib/application-form-state'

const RANGE_A = { start: '2026-03-01', end: '2026-03-31' }
const RANGE_B = { start: '2026-09-01', end: '2026-09-30' }
const RECRUIT = 'recruitment-economy'
const APPLICATION = 'application-economy'

const draftByCatalog = new Map<string, { editorState?: Record<string, unknown> }>()

function mountWizard() {
  render(
    <CompanySchoolRegistrationWizardFormProvider>ok</CompanySchoolRegistrationWizardFormProvider>
  )
}

function setLiveRecruitRanges(range: { start: string; end: string }) {
  const rhf = peekCompanySchoolRegistrationRhf()
  expect(rhf).not.toBeNull()
  rhf!.applyOverlayRecord({
    'recruit.programRangeSeal': range,
    'recruit.recruitRangeSeal': range,
    'recruit.inquiryContact': range === RANGE_B ? '담당B' : '담당A',
  })
}

describe('1사1교 등록 임시저장 — stale session overlay가 모집 기간을 덮지 않는다', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    draftByCatalog.clear()
    resetAllOperationalOverlayStoresForTests()
    clearParticipantSessionOverlayFlushRegistry()
    loadRegistrationWizardFormDraft.mockImplementation(
      async (args: { templateCode: string }) => {
        const saved = draftByCatalog.get(args.templateCode)
        return {
          draft: createSeedDraftForOperationalCatalogId(args.templateCode),
          editorState: saved?.editorState,
        }
      }
    )
    persistRegistrationWizardFormDraft.mockImplementation(
      async (args: { templateCode: string; editorState?: Record<string, unknown> }) => {
        draftByCatalog.set(args.templateCode, { editorState: args.editorState })
      }
    )
  })

  afterEach(() => {
    cleanup()
    resetAllOperationalOverlayStoresForTests()
    clearParticipantSessionOverlayFlushRegistry()
  })

  it('라이브 기간 B + stale snapshot A → flush해도 RHF 기간은 B', () => {
    mountWizard()
    act(() => {
      setLiveRecruitRanges(RANGE_B)
      seedParticipantSessionOverlayForTests(RECRUIT, {
        'recruit.programRangeSeal': RANGE_A,
        'recruit.recruitRangeSeal': RANGE_A,
        'recruit.inquiryContact': '담당A',
      })
      flushParticipantSessionOverlaysToOperationalStores({ excludeCatalogId: RECRUIT })
    })
    const live = collectCompanySchoolRecruitFormState()
    expect(live.programRange).toEqual(RANGE_B)
    expect(live.recruitRange).toEqual(RANGE_B)
    expect(live.inquiryContact).toBe('담당B')
  })

  it('exclude 키가 달라도 Economy RHF가 켜져 있으면 stale A로 롤백되지 않는다', () => {
    mountWizard()
    act(() => {
      setLiveRecruitRanges(RANGE_B)
      seedParticipantSessionOverlayForTests(RECRUIT, {
        'recruit.programRangeSeal': RANGE_A,
        'recruit.recruitRangeSeal': RANGE_A,
        'recruit.inquiryContact': '담당A',
      })
      flushParticipantSessionOverlaysToOperationalStores()
    })
    const live = collectCompanySchoolRecruitFormState()
    expect(live.programRange).toEqual(RANGE_B)
    expect(live.recruitRange).toEqual(RANGE_B)
    expect(live.inquiryContact).toBe('담당B')
  })

  it('임시저장 persist는 라이브 기간 B를 editorState로 남긴다', async () => {
    mountWizard()
    act(() => {
      setLiveRecruitRanges(RANGE_B)
      seedParticipantSessionOverlayForTests(RECRUIT, {
        'recruit.programRangeSeal': RANGE_A,
        'recruit.recruitRangeSeal': RANGE_A,
        'recruit.inquiryContact': '담당A',
      })
      flushParticipantSessionOverlaysToOperationalStores()
    })

    await persistRegistrationOperationalOverlaysToLocal('COMPANY_SCHOOL', 'economy')
    const persisted = readCompanySchoolRecruitEditorState(
      draftByCatalog.get(RECRUIT)?.editorState
    )
    expect(persisted?.programRange).toEqual(RANGE_B)
    expect(persisted?.recruitRange).toEqual(RANGE_B)
    expect(persisted?.inquiryContact).toBe('담당B')
  })

  it('신청 라이브 B + stale snapshot A → flush해도 RHF는 B', () => {
    mountWizard()
    act(() => {
      const rhf = peekCompanySchoolRegistrationRhf()
      expect(rhf).not.toBeNull()
      rhf!.applyOverlayRecord({
        'application.economy.basicInfo.detailAddress': '주소B',
      })
      seedParticipantSessionOverlayForTests(APPLICATION, {
        'application.economy.basicInfo.detailAddress': '주소A',
      })
      flushParticipantSessionOverlaysToOperationalStores()
    })
    expect(collectCompanySchoolApplicationFormState().basicInfo.detailAddress).toBe('주소B')
  })

  it('임시저장 persist는 신청 라이브 B를 editorState로 남긴다', async () => {
    mountWizard()
    act(() => {
      const rhf = peekCompanySchoolRegistrationRhf()
      expect(rhf).not.toBeNull()
      rhf!.applyOverlayRecord({
        'application.economy.basicInfo.detailAddress': '주소B',
      })
      seedParticipantSessionOverlayForTests(APPLICATION, {
        'application.economy.basicInfo.detailAddress': '주소A',
      })
      flushParticipantSessionOverlaysToOperationalStores()
    })
    await persistRegistrationOperationalOverlaysToLocal('COMPANY_SCHOOL', 'economy')
    const persisted = readCompanySchoolApplicationEditorState(
      draftByCatalog.get(APPLICATION)?.editorState
    )
    expect(persisted?.basicInfo.detailAddress).toBe('주소B')
  })
})
