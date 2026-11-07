import { describe, expect, it } from 'vitest'
import {
  educationFormLabelFromProgramType,
  participantTypeChecked,
  resolveTrainedTeachersEducationFormView,
  resolveTrainedTeachersIpsTypeView,
  shouldShowSessionIpsSummary,
  trainedTeacherOptionLabel,
  TRAINED_TEACHER_EDUCATION_PROCESS_OPTIONS,
} from './common-info-display'

describe('TT 공통 정보 조회 표시', () => {
  it('type=offline 을 오프라인으로 표시하고 nested 라벨 부재를 - 로 만들지 않는다', () => {
    expect(educationFormLabelFromProgramType('offline')).toBe('오프라인')
    expect(educationFormLabelFromProgramType('OFFLINE')).toBe('오프라인')
    expect(educationFormLabelFromProgramType('HYBRID')).toBe('온/오프라인')
    expect(
      resolveTrainedTeachersEducationFormView({
        programType: 'offline',
        educationFormLabel: undefined,
      }).formLabel
    ).toBe('오프라인')
  })

  it('perSchedule 교육 형태만 차시 모드로 표시하고 모드 누락을 추정하지 않는다', () => {
    expect(
      resolveTrainedTeachersEducationFormView({
        programType: 'offline',
        educationFormScheduleDetail: 'perSchedule',
      }).formLabel
    ).toBe('일정 별 상이')
    expect(
      resolveTrainedTeachersEducationFormView({
        programType: 'offline',
      }).modeLabel
    ).toBeUndefined()
  })

  it('common IPS는 최상위 ips만 쓰고 perSchedule은 행 요약을 숨기지 않는다', () => {
    expect(
      resolveTrainedTeachersIpsTypeView({
        ipsScheduleDetail: 'common',
        ips: 'Succeed',
      }).ipsLabel
    ).toBe('Succeed')
    expect(
      shouldShowSessionIpsSummary({
        ipsScheduleDetail: 'perSchedule',
        ipsTypeSummary: 'Prepare | 해당없음',
      })
    ).toBe(true)
    expect(
      shouldShowSessionIpsSummary({
        ipsScheduleDetail: 'common',
        ipsTypeSummary: 'Prepare | 해당없음',
      })
    ).toBe(false)
    expect(
      shouldShowSessionIpsSummary({
        ipsTypeSummary: 'Succeed | Award (시상)',
      })
    ).toBe(true)
  })

  it('참여자 유형 누락을 전체 체크로 보정하지 않는다', () => {
    expect(participantTypeChecked(undefined, 'school_institution')).toBe(false)
    expect(participantTypeChecked(['school_institution'], 'school_institution')).toBe(true)
    expect(participantTypeChecked(['school_institution'], 'teacher_instructor')).toBe(false)
    expect(participantTypeChecked(['school_institution'], 'individual')).toBe(false)
    expect(participantTypeChecked(['school_institution'], 'volunteer')).toBe(false)
  })

  it('교육 과정 코드는 라벨로 매핑하고 미지원 코드는 raw를 노출하지 않는다', () => {
    expect(
      trainedTeacherOptionLabel(TRAINED_TEACHER_EDUCATION_PROCESS_OPTIONS, 'digital_computer')
    ).toBe('Digital (Computer)')
    expect(trainedTeacherOptionLabel(TRAINED_TEACHER_EDUCATION_PROCESS_OPTIONS, 'unknown_code')).toBe(
      '-'
    )
  })
})
