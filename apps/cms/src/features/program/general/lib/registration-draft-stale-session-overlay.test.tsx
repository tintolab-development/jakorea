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
  applyOperationalOverlayForCatalogId,
  collectOperationalOverlayForCatalogId,
  createSeedDraftForOperationalCatalogId,
  hydrateRegistrationOperationalOverlaysFromLocalDrafts,
  persistRegistrationOperationalOverlaysToLocal,
} from './registration-operational-form-drafts'
import {
  clearParticipantSessionOverlayFlushRegistry,
  flushParticipantSessionOverlaysToOperationalStores,
  seedParticipantSessionOverlayForTests,
} from '@/features/template/hooks/use-program-participant-application-editor'
import { peekApplicantRecruitInstitutionOverlayRecord } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { peekGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { peekGeneralApplicationOverlayRecord } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { resetAllOperationalOverlayStoresForTests } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import { GeneralRegistrationWizardFormProvider } from '@/features/program/general/ui/registration/registration-wizard-form-provider'
import {
  peekGeneralRegistrationWizardRhf,
  registerGeneralRegistrationWizardRhf,
} from './overlay-phase1/registration-wizard-rhf-api'

const RANGE_A = { start: '2026-03-01T00:00:00.000Z', end: '2026-03-31T00:00:00.000Z' }
const RANGE_B = { start: '2026-09-01T00:00:00.000Z', end: '2026-09-30T00:00:00.000Z' }

const INSTITUTION = 'recruitment-participant-school'
const INDIVIDUAL = 'recruitment-participant-individual'
const INSTRUCTOR = 'recruitment-instructor'
const VOLUNTEER = 'recruitment-volunteer'
const APPLICATION_INDIVIDUAL = 'application-participant-individual'

const draftByCatalog = new Map<string, { overlay?: Record<string, unknown> }>()

function institutionLive(range: { start: string; end: string }): Record<string, unknown> {
  return {
    'recruit.programRangeSeal': range,
    'recruit.recruitRangeSeal': range,
    'recruit.inquiryContact': range === RANGE_B ? '담당B' : '담당A',
    'recruit.inquiryTel': range === RANGE_B ? '010-2222-2222' : '010-1111-1111',
    'recruit.targetLevels': range === RANGE_B ? ['middle'] : ['elementary'],
    'recruit.notesNotApplicable': range === RANGE_B ? false : true,
    'recruit.notes': range === RANGE_B ? '' : '이전 비고',
  }
}

function volunteerLive(range: { start: string; end: string }): Record<string, unknown> {
  return {
    'recruit.volunteer.programRangeSeal': range,
    'recruit.volunteer.recruitRangeSeal': range,
    'recruit.volunteer.inquiryContact': range === RANGE_B ? '봉사B' : '봉사A',
    'recruit.volunteer.volunteerTargets': range === RANGE_B ? [] : ['university'],
    'recruit.volunteer.interview.selectedSlotKeys':
      range === RANGE_B ? ['slot-b'] : ['slot-a'],
    'recruit.volunteer.notesNotApplicable': range === RANGE_B ? false : true,
  }
}

function mountWizard() {
  render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
}

function setRecruitmentKv(
  kv: Record<string, unknown>,
  participant: Partial<{
    organization: boolean
    individual: boolean
    teacherInstructor: boolean
    volunteer: boolean
  }> = { organization: true }
) {
  const rhf = peekGeneralRegistrationWizardRhf()
  expect(rhf).not.toBeNull()
  const current = rhf!.getValues()
  rhf!.reset({
    ...current,
    extras: {
      ...current.extras,
      participant: { ...current.extras.participant, ...participant },
    },
    recruitmentKv: kv,
  })
}

function recruitmentKv(): Record<string, unknown> {
  return { ...(peekGeneralRegistrationWizardRhf()?.getValues().recruitmentKv ?? {}) }
}

describe('일반 등록 임시저장 — stale session overlay 롤백', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    draftByCatalog.clear()
    resetAllOperationalOverlayStoresForTests()
    clearParticipantSessionOverlayFlushRegistry()
    registerGeneralRegistrationWizardRhf(null)
    loadRegistrationWizardFormDraft.mockImplementation(
      async (args: { templateCode: string }) => {
        const saved = draftByCatalog.get(args.templateCode)
        return {
          draft: createSeedDraftForOperationalCatalogId(args.templateCode),
          overlay: saved?.overlay,
        }
      }
    )
    persistRegistrationWizardFormDraft.mockImplementation(
      async (args: { templateCode: string; overlay?: Record<string, unknown> }) => {
        draftByCatalog.set(args.templateCode, { overlay: args.overlay })
      }
    )
  })

  afterEach(() => {
    cleanup()
    registerGeneralRegistrationWizardRhf(null)
    resetAllOperationalOverlayStoresForTests()
    clearParticipantSessionOverlayFlushRegistry()
  })

  it('exclude 없으면 stale snapshot A가 live 기간 B를 덮는다 (결함 재현)', () => {
    mountWizard()
    act(() => {
      applyOperationalOverlayForCatalogId(INSTITUTION, institutionLive(RANGE_B))
      setRecruitmentKv(institutionLive(RANGE_B))
      seedParticipantSessionOverlayForTests(INSTITUTION, institutionLive(RANGE_A))
      flushParticipantSessionOverlaysToOperationalStores()
    })
    expect(recruitmentKv()['recruit.programRangeSeal']).toEqual(RANGE_A)
    expect(recruitmentKv()['recruit.recruitRangeSeal']).toEqual(RANGE_A)
    expect(peekApplicantRecruitInstitutionOverlayRecord(INSTITUTION)['recruit.programRangeSeal']).toEqual(
      RANGE_A
    )
  })

  it('기존 기간 A → 기간 B 입력 → stale snapshot A → 임시저장 후 RHF/스토어/저장본 모두 B', async () => {
    mountWizard()
    act(() => {
      applyOperationalOverlayForCatalogId(INSTITUTION, institutionLive(RANGE_B))
      setRecruitmentKv(institutionLive(RANGE_B))
      seedParticipantSessionOverlayForTests(INSTITUTION, institutionLive(RANGE_A))
    })

    const beforeRhf = recruitmentKv()
    expect(beforeRhf['recruit.programRangeSeal']).toEqual(RANGE_B)
    expect(beforeRhf['recruit.recruitRangeSeal']).toEqual(RANGE_B)

    act(() => {
      flushParticipantSessionOverlaysToOperationalStores({ excludeCatalogId: INSTITUTION })
    })

    const afterRhf = recruitmentKv()
    expect(afterRhf['recruit.programRangeSeal']).toEqual(RANGE_B)
    expect(afterRhf['recruit.recruitRangeSeal']).toEqual(RANGE_B)
    expect(afterRhf['recruit.inquiryContact']).toBe('담당B')
    expect(afterRhf['recruit.targetLevels']).toEqual(['middle'])
    expect(afterRhf).toEqual(beforeRhf)

    const storeAfterFlush = collectOperationalOverlayForCatalogId(INSTITUTION)
    expect(storeAfterFlush?.['recruit.programRangeSeal']).toEqual(RANGE_B)
    expect(storeAfterFlush?.['recruit.recruitRangeSeal']).toEqual(RANGE_B)
    expect(storeAfterFlush?.['recruit.inquiryTel']).toBe('010-2222-2222')

    await persistRegistrationOperationalOverlaysToLocal('GENERAL', 'general')
    const persisted = draftByCatalog.get(INSTITUTION)?.overlay
    expect(persisted?.['recruit.programRangeSeal']).toEqual(RANGE_B)
    expect(persisted?.['recruit.recruitRangeSeal']).toEqual(RANGE_B)
    expect(persisted?.['recruit.inquiryContact']).toBe('담당B')

    act(() => {
      resetAllOperationalOverlayStoresForTests()
      registerGeneralRegistrationWizardRhf(null)
    })
    await hydrateRegistrationOperationalOverlaysFromLocalDrafts('GENERAL', 'general')
    expect(
      peekApplicantRecruitInstitutionOverlayRecord(INSTITUTION)['recruit.programRangeSeal']
    ).toEqual(RANGE_B)
    expect(
      peekApplicantRecruitInstitutionOverlayRecord(INSTITUTION)['recruit.recruitRangeSeal']
    ).toEqual(RANGE_B)
  })

  it('탭 A→B→A 후 수정·임시저장 — 활성 A는 live, 비활성 B 스냅샷은 유지', () => {
    mountWizard()
    const individualSnapshot = {
      'recruit.individual.recruitRangeSeal': RANGE_A,
      'recruit.individual.inquiryContact': '개인-비활성',
    }
    act(() => {
      applyOperationalOverlayForCatalogId(INSTITUTION, institutionLive(RANGE_B))
      setRecruitmentKv(institutionLive(RANGE_B), { organization: true, individual: true })
      seedParticipantSessionOverlayForTests(INSTITUTION, institutionLive(RANGE_A))
      seedParticipantSessionOverlayForTests(INDIVIDUAL, individualSnapshot)
      flushParticipantSessionOverlaysToOperationalStores({ excludeCatalogId: INSTITUTION })
    })
    expect(recruitmentKv()['recruit.programRangeSeal']).toEqual(RANGE_B)
    expect(peekApplicantRecruitInstitutionOverlayRecord(INSTITUTION)['recruit.programRangeSeal']).toEqual(
      RANGE_B
    )
    expect(peekGeneralRecruitOverlayRecord(INDIVIDUAL)['recruit.individual.inquiryContact']).toBe(
      '개인-비활성'
    )
    expect(peekGeneralRecruitOverlayRecord(INDIVIDUAL)['recruit.individual.recruitRangeSeal']).toEqual(
      RANGE_A
    )
    expect(
      peekApplicantRecruitInstitutionOverlayRecord(INSTITUTION)['recruit.individual.inquiryContact']
    ).toBeUndefined()
  })

  it('활성 모집 + 비활성 신청 탭 데이터가 모두 보존된다', () => {
    mountWizard()
    act(() => {
      applyOperationalOverlayForCatalogId(INSTITUTION, institutionLive(RANGE_B))
      setRecruitmentKv(institutionLive(RANGE_B), { organization: true, individual: true })
      seedParticipantSessionOverlayForTests(INSTITUTION, institutionLive(RANGE_A))
      seedParticipantSessionOverlayForTests(APPLICATION_INDIVIDUAL, {
        'application.individual.motivation': '신청-비활성',
      })
      flushParticipantSessionOverlaysToOperationalStores({ excludeCatalogId: INSTITUTION })
    })
    expect(recruitmentKv()['recruit.programRangeSeal']).toEqual(RANGE_B)
    expect(
      peekGeneralApplicationOverlayRecord(APPLICATION_INDIVIDUAL)['application.individual.motivation']
    ).toBe('신청-비활성')
  })

  it('공통정보 탭 임시저장(exclude 없음)에도 비활성 모집·신청 값이 복원된다', () => {
    act(() => {
      seedParticipantSessionOverlayForTests(INSTITUTION, institutionLive(RANGE_B))
      seedParticipantSessionOverlayForTests(APPLICATION_INDIVIDUAL, {
        'application.individual.motivation': '신청-보존',
      })
      flushParticipantSessionOverlaysToOperationalStores()
    })
    expect(peekApplicantRecruitInstitutionOverlayRecord(INSTITUTION)['recruit.programRangeSeal']).toEqual(
      RANGE_B
    )
    expect(
      peekGeneralApplicationOverlayRecord(APPLICATION_INDIVIDUAL)['application.individual.motivation']
    ).toBe('신청-보존')
  })

  it('문의처·모집 대상·면접 등 날짜 이외 필드가 stale snapshot으로 돌아가지 않는다', () => {
    mountWizard()
    act(() => {
      applyOperationalOverlayForCatalogId(VOLUNTEER, volunteerLive(RANGE_B))
      setRecruitmentKv(volunteerLive(RANGE_B), { volunteer: true })
      seedParticipantSessionOverlayForTests(VOLUNTEER, volunteerLive(RANGE_A))
      flushParticipantSessionOverlaysToOperationalStores({ excludeCatalogId: VOLUNTEER })
    })
    const kv = recruitmentKv()
    expect(kv['recruit.volunteer.inquiryContact']).toBe('봉사B')
    expect(kv['recruit.volunteer.volunteerTargets']).toEqual([])
    expect(kv['recruit.volunteer.interview.selectedSlotKeys']).toEqual(['slot-b'])
    expect(kv['recruit.volunteer.notesNotApplicable']).toBe(false)
    expect(peekGeneralRecruitOverlayRecord(VOLUNTEER)['recruit.volunteer.inquiryContact']).toBe('봉사B')
  })

  it('명시적 빈 값·false·[]는 stale 이전 값으로 복원되지 않는다', () => {
    mountWizard()
    const liveEmpty: Record<string, unknown> = {
      'recruit.programRangeSeal': RANGE_B,
      'recruit.recruitRangeSeal': RANGE_B,
      'recruit.inquiryContact': '',
      'recruit.targetLevels': [],
      'recruit.notesNotApplicable': false,
      'recruit.notes': '',
    }
    const staleFilled: Record<string, unknown> = {
      'recruit.programRangeSeal': RANGE_A,
      'recruit.recruitRangeSeal': RANGE_A,
      'recruit.inquiryContact': '이전 담당',
      'recruit.targetLevels': ['elementary'],
      'recruit.notesNotApplicable': true,
      'recruit.notes': '이전 비고',
    }
    act(() => {
      applyOperationalOverlayForCatalogId(INSTITUTION, liveEmpty)
      setRecruitmentKv(liveEmpty)
      seedParticipantSessionOverlayForTests(INSTITUTION, staleFilled)
      flushParticipantSessionOverlaysToOperationalStores({ excludeCatalogId: INSTITUTION })
    })
    const kv = recruitmentKv()
    expect(kv['recruit.inquiryContact']).toBe('')
    expect(kv['recruit.targetLevels']).toEqual([])
    expect(kv['recruit.notesNotApplicable']).toBe(false)
    expect(kv['recruit.notes']).toBe('')
    expect(kv['recruit.programRangeSeal']).toEqual(RANGE_B)
  })

  it.each([
    {
      catalogId: INDIVIDUAL,
      live: {
        'recruit.individual.recruitRangeSeal': RANGE_B,
        'recruit.individual.inquiryContact': '개인B',
      },
      stale: {
        'recruit.individual.recruitRangeSeal': RANGE_A,
        'recruit.individual.inquiryContact': '개인A',
      },
      rangeKey: 'recruit.individual.recruitRangeSeal',
      extraKey: 'recruit.individual.inquiryContact',
      extraValue: '개인B',
      peek: (id: string) => peekGeneralRecruitOverlayRecord(id),
    },
    {
      catalogId: INSTRUCTOR,
      live: {
        'recruit.instructor.recruitRangeSeal': RANGE_B,
        'recruit.instructor.inquiryContact': '강사B',
      },
      stale: {
        'recruit.instructor.recruitRangeSeal': RANGE_A,
        'recruit.instructor.inquiryContact': '강사A',
      },
      rangeKey: 'recruit.instructor.recruitRangeSeal',
      extraKey: 'recruit.instructor.inquiryContact',
      extraValue: '강사B',
      peek: (id: string) => peekGeneralRecruitOverlayRecord(id),
    },
    {
      catalogId: VOLUNTEER,
      live: {
        'recruit.volunteer.recruitRangeSeal': RANGE_B,
        'recruit.volunteer.inquiryContact': '봉사B',
      },
      stale: {
        'recruit.volunteer.recruitRangeSeal': RANGE_A,
        'recruit.volunteer.inquiryContact': '봉사A',
      },
      rangeKey: 'recruit.volunteer.recruitRangeSeal',
      extraKey: 'recruit.volunteer.inquiryContact',
      extraValue: '봉사B',
      peek: (id: string) => peekGeneralRecruitOverlayRecord(id),
    },
  ])(
    '$catalogId 활성 탭은 stale snapshot으로 롤백되지 않는다',
    ({ catalogId, live, stale, rangeKey, extraKey, extraValue, peek }) => {
      act(() => {
        applyOperationalOverlayForCatalogId(catalogId, live)
        seedParticipantSessionOverlayForTests(catalogId, stale)
        flushParticipantSessionOverlaysToOperationalStores({ excludeCatalogId: catalogId })
      })
      expect(peek(catalogId)[rangeKey]).toEqual(RANGE_B)
      expect(peek(catalogId)[extraKey]).toBe(extraValue)
    }
  )
})
