import { describe, expect, it } from 'vitest'
import {
  isWithinStudentCertificateIssuancePeriod,
  resolveStudentCertificateKind,
} from './resolve-student-certificate-kind'
import type { LectureAttendanceSession } from '../model/school-detail-types'

const fourSessionProgram = (
  statuses: Array<LectureAttendanceSession['status']>
): LectureAttendanceSession[] =>
  statuses.map((status, index) => ({
    roundNumber: index + 1,
    status,
  }))

describe('resolveStudentCertificateKind', () => {
  it('마지막 회차까지 결석 없이 참여하고 만족도 조사를 완료하면 수료증을 발급한다', () => {
    expect(
      resolveStudentCertificateKind({
        sessions: fourSessionProgram(['attended', 'attended', 'attended', 'attended']),
        satisfactionSurveyRequired: true,
        satisfactionSurveyCompleted: true,
      })
    ).toBe('completion')
  })

  it('사유 불참은 결격 사유가 아니다', () => {
    expect(
      resolveStudentCertificateKind({
        sessions: fourSessionProgram(['attended', 'attended', 'attended', 'late']),
        satisfactionSurveyRequired: true,
        satisfactionSurveyCompleted: true,
      })
    ).toBe('completion')
  })

  it('결석이 있으면 참여인증서를 발급한다', () => {
    expect(
      resolveStudentCertificateKind({
        sessions: fourSessionProgram(['attended', 'absent', 'attended', 'attended']),
        satisfactionSurveyRequired: false,
        satisfactionSurveyCompleted: false,
      })
    ).toBe('participation')
  })

  it('만족도 조사가 필요한데 미완료이면 참여인증서를 발급한다', () => {
    expect(
      resolveStudentCertificateKind({
        sessions: fourSessionProgram(['attended', 'attended', 'attended', 'attended']),
        satisfactionSurveyRequired: true,
        satisfactionSurveyCompleted: false,
      })
    ).toBe('participation')
  })

  it('마지막 교육 일정에 도달하지 못하면 참여인증서를 발급한다', () => {
    expect(
      resolveStudentCertificateKind({
        sessions: fourSessionProgram(['attended', 'attended', 'not_held', 'not_held']),
        satisfactionSurveyRequired: false,
        satisfactionSurveyCompleted: false,
      })
    ).toBe('participation')
  })
})

describe('isWithinStudentCertificateIssuancePeriod', () => {
  it('참여 신청일로부터 3년 이내면 발급 가능하다', () => {
    expect(
      isWithinStudentCertificateIssuancePeriod('2024-01-01', new Date('2026-12-31'))
    ).toBe(true)
  })

  it('참여 신청일로부터 3년이 지나면 발급할 수 없다', () => {
    expect(
      isWithinStudentCertificateIssuancePeriod('2020-01-01', new Date('2026-01-02'))
    ).toBe(false)
  })
})
