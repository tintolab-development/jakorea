import { describe, expect, it } from 'vitest'
import {
  INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_BLOCKED_ALERT,
  INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_REASON_PLACEHOLDER,
  INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_TITLE,
  buildInstructorPermissionCancelApprovalMessage,
} from './instructor-permission-cancel-approval-copy'

describe('buildInstructorPermissionCancelApprovalMessage', () => {
  it('CASE 1 원문을 유지하고 회원명만 치환한다', () => {
    expect(buildInstructorPermissionCancelApprovalMessage('CASE_1', '김제이')).toBe(
      [
        '**[김제이]** 님의 강사 권한 승인을 취소하시겠습니까?',
        '취소 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.',
        '발송 예정인 승인 알림이 있는 경우, 자동으로 취소되며 해당 건만 발송됩니다.',
      ].join('\n')
    )
  })

  it('CASE 2는 발송 보류·권한 회수 문구를 쓰고 CASE 1과 섞지 않는다', () => {
    const message = buildInstructorPermissionCancelApprovalMessage('CASE_2', '이회원')
    expect(message).toBe(
      [
        '**[이회원]** 님의 강사 권한 승인을 취소하시겠습니까?',
        '취소 시 입력하신 사유는 취소 사유로 기록되며, 승인 취소 알림은 현재 발송 보류 중입니다.',
        '해당 회원의 강사 권한이 회수되며, 기존 개인 또는 교사 역할은 유지됩니다.',
      ].join('\n')
    )
    expect(message).not.toContain('반려 사유')
    expect(message).not.toContain('일반 회원')
    expect(message).not.toContain('알림톡')
    expect(message).not.toContain('발송 완료')
  })

  it('빈 이름은 회원으로 대체한다', () => {
    expect(buildInstructorPermissionCancelApprovalMessage('CASE_1', '  ')).toContain(
      '**[회원]** 님의'
    )
  })

  it('제목·placeholder 문구를 고정한다', () => {
    expect(INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_TITLE).toBe('강사 권한 승인 취소 안내')
    expect(INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_REASON_PLACEHOLDER).toBe(
      '취소 사유를 입력해 주세요'
    )
  })

  it('승인 취소 불가 안내는 권한 종료 불가 문구와 구분한다', () => {
    expect(INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_BLOCKED_ALERT.title).not.toContain('종료')
    expect(INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_BLOCKED_ALERT.content).toContain(
      '강사 권한 승인 취소가 불가합니다'
    )
    expect(INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_BLOCKED_ALERT.content).not.toContain(
      '강사 권한 종료가 불가합니다'
    )
  })
})
