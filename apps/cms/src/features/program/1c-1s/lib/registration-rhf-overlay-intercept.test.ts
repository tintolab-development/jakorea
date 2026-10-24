/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getProgramRegistrationOverlayRecord,
  patchProgramRegistrationOverlay,
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlayStoreForTests,
  updateProgramRegistrationOverlayKey,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  registerCompanySchoolRegistrationRhf,
  type CompanySchoolRegistrationRhfApi,
} from './registration-rhf-api'
import {
  applyCompanySchoolRhfOverlayRecord,
  createDefaultCompanySchoolRegistrationRhfValues,
  readCompanySchoolRhfOverlayValue,
  type CompanySchoolRegistrationRhfValues,
} from './registration-rhf-values'

function mockApi(
  overrides: Partial<CompanySchoolRegistrationRhfApi> = {}
): CompanySchoolRegistrationRhfApi & { values: CompanySchoolRegistrationRhfValues } {
  const state: { values: CompanySchoolRegistrationRhfValues } = {
    values: createDefaultCompanySchoolRegistrationRhfValues(),
  }
  return {
    get values() {
      return state.values
    },
    set values(next: CompanySchoolRegistrationRhfValues) {
      state.values = next
    },
    getValues: () => state.values,
    getPath: () => undefined,
    setPath: vi.fn(),
    reset: vi.fn((next: CompanySchoolRegistrationRhfValues) => {
      state.values = next
    }),
    applyOverlayRecord: vi.fn((overlay: Record<string, unknown>) => {
      state.values = applyCompanySchoolRhfOverlayRecord(state.values, overlay)
    }),
    isDirty: () => false,
    markBaseline: vi.fn(),
    ...overrides,
  }
}

describe('1사1교 등록 overlay intercept', () => {
  afterEach(() => {
    registerCompanySchoolRegistrationRhf(null)
    resetProgramRegistrationOverlayStoreForTests()
  })

  it('담당자 ID overlay snapshot은 동일 값이면 참조가 유지된다', () => {
    const values = createDefaultCompanySchoolRegistrationRhfValues()
    const first = readCompanySchoolRhfOverlayValue(
      values,
      'economyRegistration.basicInfo.managerContactIds'
    )
    const second = readCompanySchoolRhfOverlayValue(
      values,
      'economyRegistration.basicInfo.managerContactIds'
    )
    expect(first).toBe(second)
  })

  it('공통정보 patch는 Overlay store가 아니라 RHF로 간다', () => {
    const api = mockApi()
    registerCompanySchoolRegistrationRhf(api)
    patchProgramRegistrationOverlay({
      'economyRegistration.basicInfo.publicProgramTitle': 'RHF 공고',
      'economyRecruit.detailInfo.title': '모집 leftover',
    })
    expect(api.reset).toHaveBeenCalled()
    expect(api.values.publicProgramTitle).toBe('RHF 공고')
    expect(getProgramRegistrationOverlayRecord()['economyRecruit.detailInfo.title']).toBe(
      '모집 leftover'
    )
  })

  it('updateKey는 RHF 값을 읽고 다시 RHF에 쓴다', () => {
    const api = mockApi()
    registerCompanySchoolRegistrationRhf(api)
    updateProgramRegistrationOverlayKey(
      'economyRegistration.kpi.participantCount',
      () => 20
    )
    expect(api.values.participantCount).toBe(20)
  })

  it('replace는 applyOverlayRecord로 공통정보만 RHF에 투영한다', () => {
    const api = mockApi()
    registerCompanySchoolRegistrationRhf(api)
    replaceProgramRegistrationOverlay(
      {
        'economyRegistration.basicInfo.publicProgramTitle': '복원',
        'economyRecruit.detailInfo.title': '모집',
      },
      { shouldDirty: false }
    )
    expect(api.applyOverlayRecord).toHaveBeenCalled()
    expect(api.values.publicProgramTitle).toBe('복원')
    expect(getProgramRegistrationOverlayRecord()['economyRecruit.detailInfo.title']).toBe('모집')
  })
})
