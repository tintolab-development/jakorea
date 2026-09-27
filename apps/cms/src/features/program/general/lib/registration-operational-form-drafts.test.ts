/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'

const ensureDraftOwnedFormVersionWithBaseline = vi.fn()
const loadRegistrationWizardFormDraft = vi.fn()
const persistDraftOwnedFormVersion = vi.fn()
vi.mock('@/features/program/general/lib/registration-draft-form-versions', () => ({
  ensureDraftOwnedFormVersionWithBaseline: (...args: unknown[]) =>
    ensureDraftOwnedFormVersionWithBaseline(...args),
  persistDraftOwnedFormVersion: (...args: unknown[]) => persistDraftOwnedFormVersion(...args),
}))

vi.mock('@/features/program/general/lib/registration-program-draft-session', () => ({
  ensureRegistrationProgramDraftId: vi.fn(async () => 99),
  peekRegistrationProgramDraftId: vi.fn(() => 99),
}))

vi.mock('@/features/program/general/lib/registration-wizard-form-draft', () => ({
  loadRegistrationWizardFormDraft: (...args: unknown[]) =>
    loadRegistrationWizardFormDraft(...args),
}))

import {
  clearRegistrationOperationalFormDrafts,
  hydrateRegistrationOperationalOverlaysFromLocalDrafts,
  listRegistrationOperationalFormDraftStorageKeys,
  persistRegistrationOperationalOverlaySnapshots,
  resolveOperationalDraftStorageKey,
} from './registration-operational-form-drafts'
import {
  getApplicantRecruitInstitutionOverlayRecord,
  resetApplicantRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  resetGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  patchGeneralApplicationOverlay,
  resetGeneralApplicationOverlay,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'

describe('registration operational draft-owned helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetApplicantRecruitInstitutionOverlay()
    resetGeneralRecruitOverlay()
    resetGeneralApplicationOverlay()
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
    expect(getApplicantRecruitInstitutionOverlayRecord()['recruit.inquiryContact']).toBe('기관문의')
    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.programDescription']).toBe(
      '프로그램 설명'
    )
    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.additionalContentHtml']).toBe(
      '<p>에디터</p>'
    )
  })

  it('persists only visible operational overlays for individual general program', async () => {
    patchGeneralRecruitOverlay({ 'recruit.instructor.inquiryContact': '강사문의' })
    patchGeneralApplicationOverlay({ 'application.volunteer.essay': '에세이' })
    ensureDraftOwnedFormVersionWithBaseline.mockResolvedValue({
      owned: { templateCode: 'recruitment-participant-individual', templateId: 1, draftVersionId: 10 },
      baseline: null,
    })
    persistDraftOwnedFormVersion.mockResolvedValue(undefined)

    const program = {
      id: '100001',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    } as Program

    await persistRegistrationOperationalOverlaySnapshots(program)

    expect(persistDraftOwnedFormVersion).toHaveBeenCalled()
    type PersistCallArg = { templateCode?: string; baseline?: unknown; owned?: unknown }
    const templateCodes = persistDraftOwnedFormVersion.mock.calls.map(
      (call: PersistCallArg[]) => call[0]?.templateCode
    )
    expect(templateCodes).not.toContain('recruitment-instructor')
    expect(templateCodes).not.toContain('application-volunteer')
    expect(templateCodes).toContain('recruitment-participant-individual')
    expect(
      persistDraftOwnedFormVersion.mock.calls.every(
        (call: PersistCallArg[]) =>
          call[0]?.owned != null && call[0]?.baseline !== undefined
      )
    ).toBe(true)
  })
})
