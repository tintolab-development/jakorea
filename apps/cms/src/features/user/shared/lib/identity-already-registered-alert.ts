/**
 * 「회원 정보 중복 안내」 — 관리자 등록·회원 사전등록(개인·강사) 공통.
 * 시안: Figma U6QntWGwBOxMszahPxjmGX node 16909-166288 (QA '회원 등록 시'). 버튼은 알럿 기본 「확인」.
 */
import { isIdentityAlreadyRegisteredError } from '@/features/user/api/identity-already-registered-error'

export const IDENTITY_ALREADY_REGISTERED_ALERT = {
  title: '회원 정보 중복 안내',
  content: [
    '동일한 회원 정보(이름, 생년월일, 휴대폰 번호)의 회원이 이미 등록되어 있습니다.',
    '회원 목록에서 기존 회원 정보를 확인해 주세요.',
  ].join('\n'),
} as const

/**
 * 등록 실패가 본인 정보 중복이면 안내를 띄우고 true. 전역 알럿은 `screen-owned-api-errors`에서 제외되어 한 번만 뜬다.
 * 등록 모달은 실패 시 닫지 않으므로 입력값이 유지된다.
 */
export function showIdentityAlreadyRegisteredAlertIfNeeded(
  error: unknown,
  showAlert: (options: { title: string; content: string }) => void
): boolean {
  if (!isIdentityAlreadyRegisteredError(error)) return false
  showAlert({ ...IDENTITY_ALREADY_REGISTERED_ALERT })
  return true
}
