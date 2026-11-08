import { describe, expect, it } from 'vitest'
import {
  INSTRUCTOR_PERMISSION_REVOKE_BLOCKED_ALERT,
  INSTRUCTOR_PERMISSION_REVOKE_COMPLETE_TITLE,
  buildInstructorPermissionRevokeCompleteMessage,
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
    expect(INSTRUCTOR_PERMISSION_REVOKE_TITLE).toBe('강사 권한 종료 처리 안내')
    expect(INSTRUCTOR_PERMISSION_REVOKE_REASON_LABEL).toBe('권한 종료 사유')
    expect(INSTRUCTOR_PERMISSION_REVOKE_REASON_PLACEHOLDER).toBe(
      '권한 종료 사유를 입력해 주세요'
    )
    expect(INSTRUCTOR_PERMISSION_REVOKE_CONFIRM_LABEL).toBe('권한 종료')
    expect(INSTRUCTOR_PERMISSION_REVOKE_HEADER_LABEL).toBe('강사 권한 종료')
  })

  it('진행 중 프로그램 차단 안내는 승인 취소 문구와 구분한다', () => {
    expect(INSTRUCTOR_PERMISSION_REVOKE_BLOCKED_ALERT.title).toBe('강사 권한 종료 불가 안내')
    expect(INSTRUCTOR_PERMISSION_REVOKE_BLOCKED_ALERT.content).toBe(
      [
        '해당 회원은 현재 진행 중인 프로그램이 있습니다.',
        '진행 중인 프로그램이 있는 경우, 강사 권한 종료가 불가합니다.',
      ].join('\n')
    )
    expect(INSTRUCTOR_PERMISSION_REVOKE_BLOCKED_ALERT.confirmLabel).toBe('확인')
  })
})

describe('강사 권한 종료 완료 안내', () => {
  it('시안 제목·본문을 회원명과 함께 만든다', () => {
    expect(INSTRUCTOR_PERMISSION_REVOKE_COMPLETE_TITLE).toBe('강사 권한 종료 완료')
    expect(buildInstructorPermissionRevokeCompleteMessage('김제이')).toBe(
      '**[김제이]** 님의 강사 권한이 종료되었습니다.'
    )
  })
})
