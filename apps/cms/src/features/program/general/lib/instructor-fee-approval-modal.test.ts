import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  buildInstructorFeeApprovalConfirmDetail,
  canConfirmInstructorFeeApproval,
  resolveDefaultInstructorFeeGrade,
} from './use-instructor-fee-approval-modal'

describe('instructor-fee-approval-modal', () => {
  it('프로그램 기준 시 강사 등록 등급을 자동 선택한다', () => {
    expect(resolveDefaultInstructorFeeGrade('3급 강사비')).toBe('3급 강사비')
    expect(resolveDefaultInstructorFeeGrade('unknown')).toBe('1급 강사비')
  })

  it('특강/기타는 금액 없으면 승인할 수 없다', () => {
    expect(
      canConfirmInstructorFeeApproval({
        lectureFeeBasisType: 'special_lecture',
        lectureFeeMeasure: '출강 1회당',
        lectureFeeAmount: '',
        notifyTiming: 'immediate',
        manualNotifyAt: null,
      })
    ).toBe(false)

    expect(
      canConfirmInstructorFeeApproval({
        lectureFeeBasisType: 'other_labor',
        lectureFeeMeasure: '1시간 당',
        lectureFeeAmount: '250000',
        notifyTiming: 'immediate',
        manualNotifyAt: null,
      })
    ).toBe(true)
  })

  it('직접 설정 알림은 일시가 있어야 승인할 수 있다', () => {
    expect(
      canConfirmInstructorFeeApproval({
        lectureFeeBasisType: 'program',
        lectureFeeMeasure: '',
        lectureFeeAmount: '',
        notifyTiming: 'manual',
        manualNotifyAt: null,
      })
    ).toBe(false)

    expect(
      canConfirmInstructorFeeApproval({
        lectureFeeBasisType: 'program',
        lectureFeeMeasure: '',
        lectureFeeAmount: '',
        notifyTiming: 'manual',
        manualNotifyAt: dayjs('2026-03-23 10:00'),
      })
    ).toBe(true)
  })

  it('확정 payload에 강의비 표시 문자열을 포함한다', () => {
    const detail = buildInstructorFeeApprovalConfirmDetail({
      lectureFeeBasisType: 'special_lecture',
      instructorFeeGrade: '3급 강사비',
      lectureFeeMeasure: '출강 1회당',
      lectureFeeAmount: '915000',
      notifyTiming: 'immediate',
      manualNotifyAt: null,
    })

    expect(detail.lectureFeeBasisDisplay).toBe('특강 강사비 | 출강 1회당 | 915,000원')
    expect(detail.instructorFeeGradeLabel).toBeNull()
    expect(detail.lectureFeeAmount).toBe('915000')
  })

  it('프로그램 기준 확정 payload는 등급만 포함한다', () => {
    const detail = buildInstructorFeeApprovalConfirmDetail({
      lectureFeeBasisType: 'program',
      instructorFeeGrade: '2급 강사비',
      lectureFeeMeasure: '',
      lectureFeeAmount: '',
      notifyTiming: 'on_announcement',
      manualNotifyAt: null,
    })

    expect(detail.instructorFeeGradeLabel).toBe('2급 강사비')
    expect(detail.lectureFeeBasisDisplay).toBe('프로그램 기준')
    expect(detail.lectureFeeMeasure).toBeNull()
    expect(detail.lectureFeeAmount).toBeNull()
  })
})
