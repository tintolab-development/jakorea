import { describe, expect, it } from 'vitest'
import { buildPermissionNotificationResendMessage } from '@/features/user/permission-management/lib/permission-notification-resend'

describe('permission-notification-resend', () => {
  it('강사/승인 문구', () => {
    expect(buildPermissionNotificationResendMessage('instructor', '김회원', 'approved')).toBe(
      '**[김회원]** 님의 강사 권한 승인 여부에 대한 알림을 재발송하시겠습니까?\n확인 시 승인 알림이 재발송됩니다.'
    )
  })

  it('강사/반려 문구', () => {
    expect(buildPermissionNotificationResendMessage('instructor', '김회원', 'rejected')).toBe(
      '**[김회원]** 님의 강사 권한 승인 여부에 대한 알림을 재발송하시겠습니까?\n확인 시 반려 알림이 재발송됩니다.'
    )
  })

  it('관리자/승인 문구', () => {
    expect(buildPermissionNotificationResendMessage('admin', '김회원', 'approved')).toBe(
      '**[김회원]** 님의 관리자 권한 승인 여부에 대한 알림을 재발송하시겠습니까?\n확인 시 승인 알림이 재발송됩니다.'
    )
  })

  it('관리자/반려 문구', () => {
    expect(buildPermissionNotificationResendMessage('admin', '김회원', 'rejected')).toBe(
      '**[김회원]** 님의 관리자 권한 승인 여부에 대한 알림을 재발송하시겠습니까?\n확인 시 반려 알림이 재발송됩니다.'
    )
  })
})
