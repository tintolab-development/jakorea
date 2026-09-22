/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMyProgramDraftRemote = vi.fn()
const upsertMyProgramDraftRemote = vi.fn()
const deleteMyProgramDraftRemote = vi.fn()

vi.mock('@/features/program/general/api/program-draft-api-client', () => ({
  fetchMyProgramDraftRemote: (...args: unknown[]) => fetchMyProgramDraftRemote(...args),
  upsertMyProgramDraftRemote: (...args: unknown[]) => upsertMyProgramDraftRemote(...args),
  deleteMyProgramDraftRemote: (...args: unknown[]) => deleteMyProgramDraftRemote(...args),
}))

vi.mock('@/features/program/general/lib/registration-draft-form-versions', () => ({
  clearDraftOwnedFormVersions: vi.fn(),
  hydrateDraftOwnedFormVersions: vi.fn(),
  listDraftOwnedFormVersions: vi.fn(() => []),
}))

describe('registration-program-draft-session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    localStorage.clear()
    fetchMyProgramDraftRemote.mockResolvedValue(null)
    upsertMyProgramDraftRemote.mockResolvedValue({ draftId: 42, saved: true })
    deleteMyProgramDraftRemote.mockResolvedValue(undefined)
  })

  it('dedupes concurrent ensureRegistrationProgramDraftId PUT calls', async () => {
    const { ensureRegistrationProgramDraftId } = await import('./registration-program-draft-session')

    const [first, second] = await Promise.all([
      ensureRegistrationProgramDraftId('GENERAL', { skipRemoteFetch: true }),
      ensureRegistrationProgramDraftId('GENERAL', { skipRemoteFetch: true }),
    ])

    expect(first).toBe(42)
    expect(second).toBe(42)
    expect(upsertMyProgramDraftRemote).toHaveBeenCalledTimes(1)
  })

  it('다른 유형 draft는 재사용하지 않고 요청 유형으로 다시 upsert한다', async () => {
    fetchMyProgramDraftRemote.mockResolvedValue({
      draftId: 49,
      programType: 'GENERAL',
    })
    upsertMyProgramDraftRemote.mockResolvedValue({
      draftId: 50,
      programType: 'COMPANY_SCHOOL',
      saved: true,
    })
    const { ensureRegistrationProgramDraftId } = await import('./registration-program-draft-session')

    const draftId = await ensureRegistrationProgramDraftId('COMPANY_SCHOOL')

    expect(draftId).toBe(50)
    expect(upsertMyProgramDraftRemote).toHaveBeenCalledWith(
      expect.objectContaining({ programType: 'COMPANY_SCHOOL' })
    )
  })

  it('syncRegistrationProgramDraftSession writes localStorage without any remote call', async () => {
    const { syncRegistrationProgramDraftSession, peekRegistrationProgramDraftPayload } =
      await import('./registration-program-draft-session')

    syncRegistrationProgramDraftSession({
      programType: 'GENERAL',
      registrationTemplateCode: 'registration-general',
      activeStep: 'program',
      programTitleKo: '세션 임시저장',
    })

    expect(upsertMyProgramDraftRemote).not.toHaveBeenCalled()
    expect(fetchMyProgramDraftRemote).not.toHaveBeenCalled()
    expect(deleteMyProgramDraftRemote).not.toHaveBeenCalled()
    expect(peekRegistrationProgramDraftPayload('GENERAL')?.programTitleKo).toBe('세션 임시저장')
  })

  it('hydrateRegistrationProgramDraft reads localStorage without remote GET', async () => {
    const { hydrateRegistrationProgramDraft, syncRegistrationProgramDraftSession } =
      await import('./registration-program-draft-session')

    syncRegistrationProgramDraftSession({
      programType: 'GENERAL',
      registrationTemplateCode: 'registration-general',
      activeStep: 'program',
      programTitleKo: '로컬 제목',
    })

    const saved = await hydrateRegistrationProgramDraft('GENERAL')

    expect(saved?.programTitleKo).toBe('로컬 제목')
    expect(fetchMyProgramDraftRemote).not.toHaveBeenCalled()
  })
})
