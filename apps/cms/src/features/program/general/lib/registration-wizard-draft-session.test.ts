/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpCalls: string[] = []
vi.mock('@/shared/api/orval-mutator', () => ({
  customInstance: vi.fn(async (config: { url?: string }) => {
    httpCalls.push(String(config?.url ?? ''))
    return {}
  }),
}))

describe('registration-wizard-draft-session (localStorage 전용)', () => {
  beforeEach(() => {
    vi.resetModules()
    httpCalls.length = 0
    localStorage.clear()
  })

  it('syncRegistrationProgramDraftSession은 원격 호출 없이 localStorage에만 쓴다', async () => {
    const { syncRegistrationProgramDraftSession, peekRegistrationProgramDraftPayload } =
      await import('./registration-wizard-draft-session')

    syncRegistrationProgramDraftSession({
      programType: 'COMPANY_SCHOOL',
      registrationTemplateCode: 'registration-economy',
      activeStep: 'program',
      programTitleKo: '세션 임시저장',
    })

    expect(httpCalls).toEqual([])
    const saved = peekRegistrationProgramDraftPayload('COMPANY_SCHOOL')
    expect(saved?.programTitleKo).toBe('세션 임시저장')
    expect(saved?.formVersions).toEqual({})
  })

  it('hydrateRegistrationProgramDraft는 localStorage만 읽는다', async () => {
    const { hydrateRegistrationProgramDraft, syncRegistrationProgramDraftSession } =
      await import('./registration-wizard-draft-session')

    syncRegistrationProgramDraftSession({
      programType: 'GENERAL',
      registrationTemplateCode: 'registration-general',
      activeStep: 'program',
      programTitleKo: '로컬 제목',
    })

    const saved = await hydrateRegistrationProgramDraft('GENERAL')
    expect(saved?.programTitleKo).toBe('로컬 제목')
    expect(httpCalls).toEqual([])
  })

  it('clearRegistrationProgramDraftLocal은 해당 유형 엔트리만 지운다(키 전체 삭제 금지)', async () => {
    localStorage.setItem('unrelated.key', 'keep')
    const {
      clearRegistrationProgramDraftLocal,
      peekRegistrationProgramDraftPayload,
      syncRegistrationProgramDraftSession,
    } = await import('./registration-wizard-draft-session')
    for (const programType of ['GENERAL', 'COMPANY_SCHOOL']) {
      syncRegistrationProgramDraftSession({
        programType,
        registrationTemplateCode: 'registration-general',
      })
    }

    await clearRegistrationProgramDraftLocal('GENERAL')

    expect(peekRegistrationProgramDraftPayload('GENERAL')).toBeUndefined()
    expect(peekRegistrationProgramDraftPayload('COMPANY_SCHOOL')).toBeDefined()
    expect(localStorage.getItem('unrelated.key')).toBe('keep')
    expect(httpCalls).toEqual([])
  })
})
