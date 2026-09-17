import { describe, expect, it } from 'vitest'
import { resolveGeneralProgramNavigation } from './use-general-program-navigation'

describe('resolveGeneralProgramNavigation', () => {
  it('기관 신청 활성 응답은 기관 신청 LNB를 숨기지 않는다', () => {
    const result = resolveGeneralProgramNavigation([
      { key: 'ORGANIZATION_APPLICATIONS', enabled: true },
    ])

    expect(result.disabledLnbKeys.has('institution_applications')).toBe(false)
  })

  it('기관 신청 비활성 응답은 기관 신청 LNB만 숨긴다', () => {
    const result = resolveGeneralProgramNavigation([
      { key: 'ORGANIZATION_APPLICATIONS', enabled: false },
      { key: 'PARTICIPANT_APPLICATIONS', enabled: true },
    ])

    expect(result.disabledLnbKeys.has('institution_applications')).toBe(true)
    expect(result.disabledLnbKeys.has('participant_applications')).toBe(false)
  })

  it('개인 신청 비활성 응답은 기관 신청 LNB에 전파되지 않는다', () => {
    const result = resolveGeneralProgramNavigation([
      { key: 'ORGANIZATION_APPLICATIONS', enabled: true },
      { key: 'PARTICIPANT_APPLICATIONS', enabled: false },
    ])

    expect(result.disabledLnbKeys.has('institution_applications')).toBe(false)
    expect(result.disabledLnbKeys.has('participant_applications')).toBe(true)
  })

  it('PROGRAM_EXECUTION이 활성이고 교육일지가 비활성이어도 progress를 숨기지 않는다', () => {
    const result = resolveGeneralProgramNavigation([
      { key: 'PROGRAM_EXECUTION', enabled: true },
      { key: 'EDUCATION_JOURNAL', enabled: false },
    ])

    expect(result.disabledLnbKeys.has('progress')).toBe(false)
    expect(result.capabilities.educationJournalEnabled).toBe(false)
  })

  it('PROGRAM_EXECUTION이 활성이고 학생 명단이 비활성이어도 progress를 숨기지 않는다', () => {
    const result = resolveGeneralProgramNavigation([
      { key: 'PROGRAM_EXECUTION', enabled: true },
      { key: 'STUDENT_ROSTER', enabled: false },
    ])

    expect(result.disabledLnbKeys.has('progress')).toBe(false)
    expect(result.capabilities.studentRosterEnabled).toBe(false)
  })

  it('두 하위 capability가 모두 비활성이어도 상위 활성값을 유지한다', () => {
    const result = resolveGeneralProgramNavigation([
      { key: 'PROGRAM_EXECUTION', enabled: true },
      { key: 'EDUCATION_JOURNAL', enabled: false },
      { key: 'STUDENT_ROSTER', enabled: false },
    ])

    expect(result.disabledLnbKeys.has('progress')).toBe(false)
  })

  it('PROGRAM_EXECUTION이 비활성이면 progress를 숨긴다', () => {
    const result = resolveGeneralProgramNavigation([
      { key: 'PROGRAM_EXECUTION', enabled: false },
      { key: 'EDUCATION_JOURNAL', enabled: true },
    ])

    expect(result.disabledLnbKeys.has('progress')).toBe(true)
  })

  it('navigation이 없으면 기존 로컬 메뉴 fallback을 막지 않는다', () => {
    const result = resolveGeneralProgramNavigation()

    expect(result.disabledLnbKeys.size).toBe(0)
    expect(result.capabilities.educationJournalEnabled).toBeUndefined()
    expect(result.capabilities.studentRosterEnabled).toBeUndefined()
  })

  it('구형 capability 응답에 enabled가 없으면 기존 로컬 설정으로 fallback한다', () => {
    const result = resolveGeneralProgramNavigation([
      { key: 'EDUCATION_JOURNAL' },
      { key: 'STUDENT_ROSTER' },
    ])

    expect(result.capabilities.educationJournalEnabled).toBeUndefined()
    expect(result.capabilities.studentRosterEnabled).toBeUndefined()
  })

  it('구형 progress 키의 비활성 응답을 계속 지원한다', () => {
    const result = resolveGeneralProgramNavigation([{ key: 'progress', enabled: false }])

    expect(result.disabledLnbKeys.has('progress')).toBe(true)
  })
})
