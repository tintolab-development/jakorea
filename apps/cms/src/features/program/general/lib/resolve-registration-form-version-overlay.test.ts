import { describe, expect, it, vi } from 'vitest'
import { resolveRegistrationFormVersionOverlay } from './resolve-registration-form-version-overlay'

describe('R2 등록 Form Version overlay = CREATE overlay', () => {
  const store = { 'generalRegistration.basicInfo.managerContactId': '__sponsor_contact_unselected__' }

  it('일반: CREATE 빌더 overlay와 같은 객체를 쓴다(스토어 미참조)', () => {
    const createOverlay = { 'generalRegistration.basicInfo.managerContactIds': [] }
    const readStore = vi.fn(() => store)
    const out = resolveRegistrationFormVersionOverlay({
      variant: 'general',
      createProgramOverlay: createOverlay,
      readStoreOverlay: readStore,
    })
    expect(out).toBe(createOverlay)
    expect(readStore).not.toHaveBeenCalled()
  })

  it('일반: 빌더 결과가 없으면 스토어 사본으로 fallback', () => {
    const out = resolveRegistrationFormVersionOverlay({
      variant: 'general',
      createProgramOverlay: undefined,
      readStoreOverlay: () => store,
    })
    expect(out).toEqual(store)
    expect(out).not.toBe(store)
  })

  it('1사1교: RHF 직렬화 결과 우선', () => {
    const cs = { 'economyRegistration.basicInfo.repKo': 'R' }
    expect(
      resolveRegistrationFormVersionOverlay({
        variant: 'economy',
        companySchoolOverlay: cs,
        readStoreOverlay: () => store,
      })
    ).toBe(cs)
  })

  it('TT: overlay 없음(불변)', () => {
    expect(
      resolveRegistrationFormVersionOverlay({
        variant: 'trainedTeachers',
        createProgramOverlay: { a: 1 },
        readStoreOverlay: () => store,
      })
    ).toBeUndefined()
  })
})
