import { describe, expect, it } from 'vitest'
import {
  buildInstitutionApproveAssignPlan,
  formatInstitutionApproveAssignFeeSubject,
  summarizeInstitutionApproveAssignSelection,
} from './institution-approve-assign-plan'

describe('buildInstitutionApproveAssignPlan', () => {
  it('강사 단위로 묶고 승인 전 강사는 신청 ID와 함께 계획한다', () => {
    const result = buildInstitutionApproveAssignPlan({
      schedules: [],
      rows: [
        {
          instructorId: '11',
          instructorName: '김제이',
          instructorMemberId: '11',
          instructorApplicationId: '501',
          programApprovalPending: true,
          instructorFeeGradeLabel: '3급 강사비',
          resolvedScheduleId: 900,
        },
        {
          instructorId: '11',
          instructorName: '김제이',
          instructorMemberId: '11',
          instructorApplicationId: '501',
          programApprovalPending: true,
          resolvedScheduleId: 901,
        },
        {
          instructorId: '12',
          instructorName: '곽도규',
          instructorMemberId: '12',
          instructorApplicationId: '502',
          resolvedScheduleId: 900,
        },
      ],
    })
    expect(result).toEqual({
      ok: true,
      instructors: [
        {
          instructorMemberId: 11,
          instructorName: '김제이',
          instructorApplicationId: 501,
          unapproved: true,
          instructorFeeGradeLabel: '3급 강사비',
          targets: [{ scheduleId: 900 }, { scheduleId: 901 }],
        },
        {
          instructorMemberId: 12,
          instructorName: '곽도규',
          instructorApplicationId: 502,
          unapproved: false,
          targets: [{ scheduleId: 900 }],
        },
      ],
    })
  })

  it('일정이 확정되지 않은 행이 있으면 API 호출 전에 막는다', () => {
    const result = buildInstitutionApproveAssignPlan({
      schedules: [],
      rows: [{ instructorId: '11', instructorName: '김제이', scheduleUnresolved: true }],
    })
    expect(result.ok).toBe(false)
  })

  it('승인 전 강사인데 신청 ID가 없으면 막는다', () => {
    const result = buildInstitutionApproveAssignPlan({
      schedules: [],
      rows: [
        {
          instructorId: '11',
          instructorName: '김제이',
          programApprovalPending: true,
          resolvedScheduleId: 900,
        },
      ],
    })
    expect(result).toEqual({ ok: false, message: '강사 신청 ID가 없어 승인할 수 없습니다. (김제이)' })
  })
})

describe('summarizeInstitutionApproveAssignSelection', () => {
  it('선택 강사 수와 승인 전 강사 수를 중복 없이 센다', () => {
    expect(
      summarizeInstitutionApproveAssignSelection([
        { instructorId: '1', instructorName: 'A', programApprovalPending: true },
        { instructorId: '1', instructorName: 'A', programApprovalPending: true },
        { instructorId: '2', instructorName: 'B' },
      ])
    ).toEqual({
      selectedInstructorCount: 2,
      unapprovedInstructorCount: 1,
      firstUnapprovedInstructorName: 'A',
    })
  })
})

describe('formatInstitutionApproveAssignFeeSubject', () => {
  it('단건·일괄 대상 문구', () => {
    expect(formatInstitutionApproveAssignFeeSubject(['김제이'])).toBe('**[김제이]** 님')
    expect(formatInstitutionApproveAssignFeeSubject(['김제이', '곽도규', '박민'])).toBe(
      '**[김제이]** 님 외 2명'
    )
  })
})
