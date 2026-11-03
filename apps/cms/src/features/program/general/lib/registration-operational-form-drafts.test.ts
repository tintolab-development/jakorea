/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'

const loadRegistrationWizardFormDraft = vi.fn()
const persistRegistrationWizardFormDraft = vi.fn()

vi.mock('@/features/program/general/lib/registration-wizard-form-draft', () => ({
  loadRegistrationWizardFormDraft: (...args: unknown[]) =>
    loadRegistrationWizardFormDraft(...args),
  persistRegistrationWizardFormDraft: (...args: unknown[]) =>
    persistRegistrationWizardFormDraft(...args),
}))

import {
  applyOperationalOverlayForCatalogId,
  clearRegistrationOperationalFormDrafts,
  collectOperationalOverlayForCatalogId,
  collectSelectedRecruitOverlaysForProgram,
  hydrateRegistrationOperationalOverlaysFromLocalDrafts,
  listRegistrationOperationalFormDraftStorageKeys,
  persistRegistrationOperationalOverlaysToLocal,
  loadOperationalFormDraftForProgram,
  resetOperationalOverlayForCatalogId,
  resolveOperationalDraftStorageKey,
} from './registration-operational-form-drafts'
import {
  peekApplicantRecruitInstitutionOverlayRecord,
  patchApplicantRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  patchGeneralRecruitOverlay,
  peekGeneralRecruitOverlayRecord,
  setGeneralRecruitOverlayScope,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  resetAllOperationalOverlayStoresForTests,
  setOperationalOverlayScope,
} from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  clearRegistrationStepTemplateSelections,
  setRegistrationStepTemplateSelection,
} from '@/features/program/shared/lib/step-template-selection'

describe('registration operational draft-owned helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllOperationalOverlayStoresForTests()
    clearRegistrationStepTemplateSelections()
  })

  it('clearRegistrationOperationalFormDrafts is no-op (local draft clear is centralized)', () => {
    expect(() => clearRegistrationOperationalFormDrafts('general')).not.toThrow()
  })

  it('lists catalog template ids per variant', () => {
    const economy = listRegistrationOperationalFormDraftStorageKeys('economy')
    expect(economy).toContain('recruitment-economy')
    expect(economy).toContain('recruitment-instructor')
    expect(economy).not.toContain('recruitment-participant-school')
    const ujat = listRegistrationOperationalFormDraftStorageKeys('ujat')
    expect(ujat).toContain('recruitment-ujat-school')
    expect(ujat).toContain('recruitment-ujat-volunteer')
    expect(ujat).toContain('application-ujat-school')
    expect(ujat).toContain('application-ujat-volunteer')
    expect(ujat).toHaveLength(4)
  })

  it('resolveOperationalDraftStorageKey returns catalog id', () => {
    const economyProgram = { id: '170001', title: '1사1교', mainTitle: '1사1교' } as Program
    expect(resolveOperationalDraftStorageKey(economyProgram, 'recruitment-instructor')).toBe(
      'recruitment-instructor'
    )
  })

  it('hydrates overlays from local registration drafts', async () => {
    loadRegistrationWizardFormDraft.mockImplementation(
      async (args: { templateCode: string }) => {
        if (args.templateCode === 'recruitment-participant-school') {
          return {
            overlay: {
              'recruit.inquiryContact': '기관문의',
              'recruit.detailInfo.programDescription': '프로그램 설명',
              'recruit.detailInfo.additionalContentHtml': '<p>에디터</p>',
            },
          }
        }
        return null
      }
    )

    await hydrateRegistrationOperationalOverlaysFromLocalDrafts('GENERAL', 'general')

    expect(loadRegistrationWizardFormDraft).toHaveBeenCalled()
    expect(
      peekApplicantRecruitInstitutionOverlayRecord('recruitment-participant-school')[
        'recruit.inquiryContact'
      ]
    ).toBe('기관문의')
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-participant-school')[
        'recruit.detailInfo.programDescription'
      ]
    ).toBe('프로그램 설명')
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-participant-school')[
        'recruit.detailInfo.additionalContentHtml'
      ]
    ).toBe('<p>에디터</p>')
  })

  it('collectSelectedRecruitOverlaysForProgram peeks the recruit bucket after application scope', () => {
    setOperationalOverlayScope('recruitment-participant-individual')
    patchGeneralRecruitOverlay({
      'recruit.individual.inquiryContact': '박지훈',
      'recruit.detailInfo.programDescription': '모집 설명',
    })
    setOperationalOverlayScope('application-participant-individual')
    const overlay = collectSelectedRecruitOverlaysForProgram({
      id: '100001',
      generalParticipantTypes: ['individual'],
    } as Program)
    expect(overlay['recruit.individual.inquiryContact']).toBe('박지훈')
    expect(overlay['recruit.detailInfo.programDescription']).toBe('모집 설명')
  })

  it('round-trips recruitment-volunteer interview overlay keys', () => {
    setGeneralRecruitOverlayScope('recruitment-volunteer')
    patchGeneralRecruitOverlay({
      'recruit.volunteer.interview.selectedSlotKeys': ['slot-a', 'slot-b'],
      'recruit.volunteer.interview.appliedUnavailableDates': ['2026-01-01'],
      'recruit.volunteer.interview.exclusionState': { mode: 'weekends' },
    })
    const collected = collectOperationalOverlayForCatalogId('recruitment-volunteer')
    expect(collected?.['recruit.volunteer.interview.selectedSlotKeys']).toEqual([
      'slot-a',
      'slot-b',
    ])

    resetAllOperationalOverlayStoresForTests()
    applyOperationalOverlayForCatalogId('recruitment-volunteer', collected ?? {})
    setGeneralRecruitOverlayScope('recruitment-volunteer')
    const again = collectOperationalOverlayForCatalogId('recruitment-volunteer')
    expect(again?.['recruit.volunteer.interview.selectedSlotKeys']).toEqual(['slot-a', 'slot-b'])
    expect(again?.['recruit.volunteer.interview.appliedUnavailableDates']).toEqual(['2026-01-01'])
  })

  it('collects individual recruit detailInfo with participant fields', () => {
    setOperationalOverlayScope('recruitment-participant-individual')
    patchGeneralRecruitOverlay({
      'recruit.individual.inquiryContact': '개인문의',
      'recruit.detailInfo.programDescription': '개인 프로그램 설명',
      'recruit.detailInfo.additionalContentHtml': '<p>추가</p>',
    })
    const overlay = collectOperationalOverlayForCatalogId('recruitment-participant-individual')
    expect(overlay?.['recruit.individual.inquiryContact']).toBe('개인문의')
    expect(overlay?.['recruit.detailInfo.programDescription']).toBe('개인 프로그램 설명')
    expect(overlay?.['recruit.detailInfo.additionalContentHtml']).toBe('<p>추가</p>')

    setOperationalOverlayScope('recruitment-instructor')
    applyOperationalOverlayForCatalogId('recruitment-participant-individual', overlay ?? {})
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-participant-individual')[
        'recruit.detailInfo.programDescription'
      ]
    ).toBe('개인 프로그램 설명')
  })

  it('loadOperationalFormDraftForProgram은 서버 draft 없이 위저드 localStorage 초안을 읽는다', async () => {
    const saved = { draft: { paragraphs: [] }, overlay: { k: 1 } }
    loadRegistrationWizardFormDraft.mockResolvedValueOnce(saved)
    const program = {
      id: '100001',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    } as Program

    const result = await loadOperationalFormDraftForProgram(
      program,
      'recruitment-participant-individual'
    )

    expect(result).toBe(saved)
    expect(loadRegistrationWizardFormDraft).toHaveBeenCalledWith(
      expect.objectContaining({ templateCode: 'recruitment-participant-individual' })
    )
  })

  it('clears instructor detail-info HTML so a new template does not persist leftover editors', () => {
    setGeneralRecruitOverlayScope('recruitment-instructor')
    patchGeneralRecruitOverlay({
      'recruitInstructor.detailInfo.programDescription': '<p>이전 프로그램 설명</p>',
      'recruitInstructor.detailInfo.recruitmentGuide': '<p>이전 모집 안내</p>',
      'recruitInstructor.detailInfo.additionalContentHtml': '<p>이전 추가</p>',
      'recruit.instructor.notes': '이전 비고',
    })
    setGeneralRecruitOverlayScope('recruitment-economy')
    patchGeneralRecruitOverlay({
      'economyRecruit.detailInfo.programDescription': '1사1교 상세',
    })
    resetOperationalOverlayForCatalogId('recruitment-instructor')
    const overlay = collectOperationalOverlayForCatalogId('recruitment-instructor')
    expect(overlay?.['recruitInstructor.detailInfo.programDescription']).toBeUndefined()
    expect(overlay?.['recruitInstructor.detailInfo.recruitmentGuide']).toBeUndefined()
    expect(overlay?.['recruitInstructor.detailInfo.additionalContentHtml']).toBeUndefined()
    expect(overlay?.['recruit.instructor.notes']).toBeUndefined()
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-economy')[
        'economyRecruit.detailInfo.programDescription'
      ]
    ).toBe('1사1교 상세')
  })

  it('collects only instructor prefixes from the instructor bucket', () => {
    setGeneralRecruitOverlayScope('recruitment-economy')
    patchGeneralRecruitOverlay({
      'economyRecruit.detailInfo.programDescription': '1사1교 상세',
    })
    setGeneralRecruitOverlayScope('recruitment-instructor')
    patchGeneralRecruitOverlay({
      'recruit.instructor.inquiryContact': '강사문의',
    })
    const overlay = collectOperationalOverlayForCatalogId('recruitment-instructor')
    expect(overlay?.['recruit.instructor.inquiryContact']).toBe('강사문의')
    expect(overlay?.['economyRecruit.detailInfo.programDescription']).toBeUndefined()
  })

  it('applying instructor overlay does not wipe 1사1교 recruit detail', () => {
    setOperationalOverlayScope('recruitment-economy')
    patchApplicantRecruitInstitutionOverlay({ 'recruit.notes': '1사1교 안내' })
    patchGeneralRecruitOverlay({
      'economyRecruit.detailInfo.programDescription': '1사1교 상세',
    })
    setOperationalOverlayScope('recruitment-instructor')
    patchGeneralRecruitOverlay({
      'recruit.instructor.inquiryContact': '이전 강사',
    })
    applyOperationalOverlayForCatalogId('recruitment-instructor', {
      'recruit.instructor.inquiryContact': '새 강사',
      'economyRecruit.detailInfo.programDescription': '덮이면 안 됨',
    })
    expect(peekApplicantRecruitInstitutionOverlayRecord('recruitment-economy')['recruit.notes']).toBe(
      '1사1교 안내'
    )
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-economy')[
        'economyRecruit.detailInfo.programDescription'
      ]
    ).toBe('1사1교 상세')
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-instructor')['recruit.instructor.inquiryContact']
    ).toBe('새 강사')
  })

  it('hydrating instructor draft overlay keeps 1사1교 recruit values', async () => {
    loadRegistrationWizardFormDraft.mockImplementation(
      async (args: { templateCode: string }) => {
        if (args.templateCode === 'recruitment-economy') {
          return {
            overlay: {
              'recruit.notes': '1사1교 안내',
              'economyRecruit.detailInfo.programDescription': '1사1교 상세',
            },
          }
        }
        if (args.templateCode === 'recruitment-instructor') {
          return {
            overlay: {
              'recruit.instructor.inquiryContact': '강사문의',
              'economyRecruit.detailInfo.programDescription': '덮이면 안 됨',
            },
          }
        }
        return null
      }
    )

    await hydrateRegistrationOperationalOverlaysFromLocalDrafts('ECONOMY', 'economy')

    expect(peekApplicantRecruitInstitutionOverlayRecord('recruitment-economy')['recruit.notes']).toBe(
      '1사1교 안내'
    )
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-economy')[
        'economyRecruit.detailInfo.programDescription'
      ]
    ).toBe('1사1교 상세')
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-instructor')['recruit.instructor.inquiryContact']
    ).toBe('강사문의')
  })

  it('1사1교 강사 editorState 초안은 overlay leftover보다 우선한다', async () => {
    const {
      companySchoolInstructorRecruitEditorState,
      emptyCompanySchoolInstructorRecruitFormState,
    } = await import('@/features/program/1c-1s/lib/registration-rhf-instructor-recruitment')
    const instructor = emptyCompanySchoolInstructorRecruitFormState()
    instructor.inquiryContact = 'typed 강사'
    loadRegistrationWizardFormDraft.mockImplementation(
      async (args: { templateCode: string }) => {
        if (args.templateCode === 'recruitment-instructor') {
          return {
            overlay: { 'recruit.instructor.inquiryContact': 'overlay leftover' },
            editorState: companySchoolInstructorRecruitEditorState(instructor),
          }
        }
        return null
      }
    )
    await hydrateRegistrationOperationalOverlaysFromLocalDrafts('ECONOMY', 'economy')
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-instructor')['recruit.instructor.inquiryContact']
    ).toBe('typed 강사')
  })

  it('임시저장 시 registration-general settingsJson을 overlay 재기록으로 덮지 않는다', async () => {
    setRegistrationStepTemplateSelection('GENERAL', 'program', 'registration-general')
    loadRegistrationWizardFormDraft.mockImplementation(
      async (args: { templateCode: string }) => {
        if (args.templateCode === 'registration-general') {
          return {
            draft: { paragraphs: [] },
            overlay: {
              'generalRegistration.basicInfo.localProgramTitleKo': '국문 대표명',
            },
            settingsJson: {
              registrationWizardRhf: { programTitleKo: '국문 대표명' },
            },
          }
        }
        return null
      }
    )
    persistRegistrationWizardFormDraft.mockResolvedValue(undefined)

    await persistRegistrationOperationalOverlaysToLocal('GENERAL', 'general')

    expect(
      persistRegistrationWizardFormDraft.mock.calls.map(
        call => (call[0] as { templateCode?: string } | undefined)?.templateCode
      )
    ).not.toContain('registration-general')
  })
})
