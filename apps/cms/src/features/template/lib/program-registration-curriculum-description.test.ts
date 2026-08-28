import { describe, expect, it } from 'vitest'
import { resolveProgramRegistrationScheduleCurriculumEditDescription } from './program-registration-curriculum-description'

const COMMON = {
  educationFormScheduleDetail: 'common' as const,
  participationScheduleDetail: 'common' as const,
  ipsScheduleDetail: 'common' as const,
}

describe('resolveProgramRegistrationScheduleCurriculumEditDescription', () => {
  it('개인 + 복수 회차이면 행사 일정 설명을 반환한다', () => {
    expect(
      resolveProgramRegistrationScheduleCurriculumEditDescription({
        sessionRoundType: 'multi',
        participantOrganization: false,
        ...COMMON,
      })
    ).toBe('행사 일정 별 정보를 입력해 주세요')
  })

  it('기관 + 복수 회차 기본이면 회차 별 설명을 반환한다', () => {
    expect(
      resolveProgramRegistrationScheduleCurriculumEditDescription({
        sessionRoundType: 'multi',
        participantOrganization: true,
        ...COMMON,
      })
    ).toBe('회차 별 정보를 입력해 주세요')
  })

  it('단일 회차이면 세부 일정 설명을 반환한다', () => {
    expect(
      resolveProgramRegistrationScheduleCurriculumEditDescription({
        sessionRoundType: 'single',
        participantOrganization: false,
        ...COMMON,
      })
    ).toBe('세부 일정 별 정보를 입력해 주세요')
  })
})
