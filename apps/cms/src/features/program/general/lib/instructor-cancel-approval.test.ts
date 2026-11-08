import { describe, expect, it } from 'vitest'
import {
  buildInstructorCancelApprovalMessage,
  patchInstructorForCancelApproval,
  resolveInstructorCancelApprovalNotifyVariant,
  resolveInstructorCancelApprovalReasonLabel,
} from '@/features/program/general/lib/instructor-cancel-approval'
import { buildInstructorCancelApprovalCompleteDescription } from '@/features/program/shared/ui/detail-modal/components/instructor-cancel-approval-complete-modal'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'

const baseRow = {
  id: 'test',
  instructorName: '박틴토',
} as ApplicantInstructorRow

describe('instructor-cancel-approval', () => {
  it('즉시 승인 알림은 alreadySent 분기를 사용한다', () => {
    expect(
      resolveInstructorCancelApprovalNotifyVariant({
        ...baseRow,
        approvalNotifyTiming: 'immediate',
      })
    ).toBe('alreadySent')
  })

  it('예약 승인 알림은 pendingNotification 분기를 사용한다', () => {
    expect(
      resolveInstructorCancelApprovalNotifyVariant({
        ...baseRow,
        approvalNotifyTiming: 'on_announcement',
      })
    ).toBe('pendingNotification')
  })

  it('pendingNotification 메시지에 승인 알림 발송 취소·반려 처리 문구를 포함한다', () => {
    const message = buildInstructorCancelApprovalMessage('박틴토', 'pendingNotification')
    expect(message).toContain('기존의 승인 알림은 자동으로 **발송 취소**됩니다.')
    expect(message).toContain('자동으로 **반려 처리**됩니다.')
  })

  it('alreadySent 메시지에 반려 처리 문구를 포함한다', () => {
    expect(buildInstructorCancelApprovalMessage('박틴토', 'alreadySent')).toContain(
      '자동으로 **반려 처리**됩니다.'
    )
  })

  it('취소 사유 라벨은 반려 사유를 붙이지 않는다', () => {
    expect(resolveInstructorCancelApprovalReasonLabel('pendingNotification')).toBe('취소 사유')
    expect(resolveInstructorCancelApprovalReasonLabel('alreadySent')).toBe('취소 사유')
  })

  it('승인 취소 시 신청 반려로 바꾸고 배정 정보를 제거한다', () => {
    const next = patchInstructorForCancelApproval(
      {
        ...baseRow,
        approvalStatus: 'approved',
        assignedSchoolId: 'school-1',
        assignedLectures: [
          {
            slotKey: '1',
            dateKey: '2026-03-01',
            schoolId: 'school-1',
            schoolName: '강서초',
            sessionLabel: '1차시',
            timeRange: '9:00',
          },
        ],
      },
      {
        notifyTiming: 'immediate',
        rejectionReason: '인원 초과',
      }
    )
    expect(next.approvalStatus).toBe('rejected')
    expect(next.applicationStatus).toBe('APPROVAL_CANCELLED')
    expect(next.rejectionReason).toBe('인원 초과')
    expect(next.assignedSchoolId).toBeUndefined()
    expect(next.assignedLectures).toBeUndefined()
  })
})

describe('instructor-cancel-approval-complete-modal', () => {
  it('완료 메시지는 Figma 공통 완료 문구다', () => {
    expect(buildInstructorCancelApprovalCompleteDescription('박틴토', '인원 초과')).toBe(
      '취소되었습니다.'
    )
  })
})
