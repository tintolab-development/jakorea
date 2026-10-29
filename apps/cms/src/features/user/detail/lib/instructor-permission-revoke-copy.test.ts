import { describe, expect, it } from 'vitest'
import {
  INSTRUCTOR_PERMISSION_REVOKE_CONFIRM_LABEL,
  INSTRUCTOR_PERMISSION_REVOKE_HEADER_LABEL,
  INSTRUCTOR_PERMISSION_REVOKE_REASON_LABEL,
  INSTRUCTOR_PERMISSION_REVOKE_REASON_PLACEHOLDER,
  INSTRUCTOR_PERMISSION_REVOKE_TITLE,
  buildInstructorPermissionRevokeMessage,
} from './instructor-permission-revoke-copy'

describe('buildInstructorPermissionRevokeMessage', () => {
  it('스크린샷 안내 문구를 회원명과 함께 만든다', () => {
    expect(buildInstructorPermissionRevokeMessage('김제이')).toBe(
      [
        '**[김제이]** 님의 강사 권한을 종료하시겠습니까?',
        '종료 시 입력하신 사유가 회원에게 권한 종료 사유로 안내되며, 알림이 발송됩니다.',
        '해당 회원은 일반 회원(개인 또는 교사)으로 변경됩니다.',
      ].join('\n')
    )
  })

  it('이름이 없으면 회원으로 대체한다', () => {
    expect(buildInstructorPermissionRevokeMessage('   ')).toContain('**[회원]**')
  })

  it('모달 라벨은 종료 안내와 맞춘다', () => {
    expect(INSTRUCTOR_PERMISSION_REVOKE_TITLE).toBe('강사 권한 종료 안내')
    expect(INSTRUCTOR_PERMISSION_REVOKE_REASON_LABEL).toBe('권한 종료 사유')
    expect(INSTRUCTOR_PERMISSION_REVOKE_REASON_PLACEHOLDER).toBe(
      '권한 종료 사유를 입력해 주세요'
    )
    expect(INSTRUCTOR_PERMISSION_REVOKE_CONFIRM_LABEL).toBe('권한 종료')
    expect(INSTRUCTOR_PERMISSION_REVOKE_HEADER_LABEL).toBe('강사 권한 종료')
  })
})
