/**
 * CMS 관리자 사전등록 — 임시 비밀번호는 계정 아이디(로그인 이메일)와 동일.
 * 개인·강사·관리자·학교(계정 있는 경우) 등 모든 회원 유형에 공통 적용.
 */
export function resolveAdminProvisionedTempPassword(accountId: string): string {
  const id = accountId.trim()
  if (!id) {
    throw new Error('계정 아이디가 필요합니다.')
  }
  return id
}
