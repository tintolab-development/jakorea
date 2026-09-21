/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'

const loadDraftOwnedFormVersionRecord = vi.fn()
const persistDraftOwnedFormVersion = vi.fn()
vi.mock('@/features/program/general/lib/registration-draft-form-versions', () => ({
  loadDraftOwnedFormVersionRecord: (...args: unknown[]) => loadDraftOwnedFormVersionRecord(...args),
  persistDraftOwnedFormVersion: (...args: unknown[]) => persistDraftOwnedFormVersion(...args),
}))

vi.mock('@/features/program/general/lib/registration-program-draft-session', () => ({
  ensureRegistrationProgramDraftId: vi.fn(async () => 99),
  peekRegistrationProgramDraftId: vi.fn(() => 99),
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

  it('clearRegistrationOperationalFormDrafts is no-op (session cleared via program-draft DELETE)', () => {
    expect(() => clearRegistrationOperationalFormDrafts('general')).not.toThrow()
  })

  it('lists catalog template ids per variant', () => {
    const economy = listRegistrationOperationalFormDraftStorageKeys('economy')
    expect(economy).toContain('recruitment-economy')
    expect(economy).toContain('recruitment-instructor')
    expect(economy).not.toContain('recruitment-participant-school')
  })

  it('resolveOperationalDraftStorageKey returns catalog id', () => {
    const economyProgram = { id: '170001', title: '1사1교', mainTitle: '1사1교' } as Program
    expect(resolveOperationalDraftStorageKey(economyProgram, 'recruitment-instructor')).toBe(
      'recruitment-instructor'
    )
  })

  it('hydrates overlays from draft-owned records', async () => {
    loadDraftOwnedFormVersionRecord.mockResolvedValueOnce({
      overlay: { 'recruit.inquiryContact': '기관문의' },
    })

    await hydrateRegistrationOperationalOverlaysFromLocalDrafts('GENERAL', 'general')

    expect(loadDraftOwnedFormVersionRecord).toHaveBeenCalled()
    expect(getApplicantRecruitInstitutionOverlayRecord()['recruit.inquiryContact']).toBe('기관문의')
  })

  it('persists in-memory overlays via draft-owned PUT', async () => {
    patchGeneralRecruitOverlay({ 'recruit.instructor.inquiryContact': '강사문의' })
    patchGeneralApplicationOverlay({ 'application.volunteer.essay': '에세이' })
    loadDraftOwnedFormVersionRecord.mockResolvedValue(null)
    persistDraftOwnedFormVersion.mockResolvedValue(undefined)

    await persistRegistrationOperationalOverlaySnapshots('GENERAL', 'general')

    expect(persistDraftOwnedFormVersion).toHaveBeenCalled()
    type PersistCallArg = { templateCode?: string; overlay?: Record<string, string> }
    const instructorCall = persistDraftOwnedFormVersion.mock.calls.find(
      (call: PersistCallArg[]) => call[0]?.templateCode === 'recruitment-instructor'
    )
    expect(instructorCall?.[0]?.overlay?.['recruit.instructor.inquiryContact']).toBe('강사문의')
  })
})
