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
    // BE AvailableActions: INSTRUCTOR·APPROVAL_CANCELLED → CANCEL_REJECTION (시안 08-4 「반려 취소」)
    expect(next.availableActions).toContain('CANCEL_REJECTION')
    expect(next.availableActions).not.toContain('CANCEL_APPROVAL')
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

describe('buildInstructorCancelApprovalMessage — 일반(기관형) 시안 08-1·08-2', () => {
  it('알림 발송 전(08-1)', () => {
    expect(
      buildInstructorCancelApprovalMessage('김제이', 'pendingNotification', 'general-organization')
    ).toBe(
      '**[김제이]** 님의 프로그램 승인을 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.\n발송 예정인 승인 알림이 있는 경우, 자동으로 취소되며 해당 건만 발송됩니다.'
    )
  })

  it('알림 발송 후(08-2)', () => {
    expect(
      buildInstructorCancelApprovalMessage('김제이', 'alreadySent', 'general-organization')
    ).toBe(
      '**[김제이]** 님의 프로그램 승인을 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 회원은 자동으로 **반려 처리**됩니다.'
    )
  })
})
