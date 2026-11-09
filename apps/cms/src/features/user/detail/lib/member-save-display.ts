import type { User } from '@/types/user'

type MemberUser = Omit<User, 'password'>

/** 기본 정보(profile) 저장은 연락처·이메일·주소 등 원문을 다룬다. 다른 범위는 개인정보를 바꾸지 않는다. */
export type MemberSaveScope = 'profile' | 'instructor_fee_ja' | 'comment' | 'none'

/**
 * 회원 정보 저장 후 화면·공용 캐시·목록에 넘길 사용자.
 *
 * 저장 응답에는 관리자가 입력한 원문이 덧씌워져 있다(applySavedBasicInfoPatchToUser). 원격 모드의
 * profile 저장이면 그 객체를 넘기지 않고 기존 마스킹 상세 GET 결과만 넘긴다(DB 저장값은 그대로).
 * 마스킹 재조회가 실패하면 원문 대신 저장 전 마스킹 사용자를 넘기고 `refetchNeeded`로 재조회를 요청한다.
 */
export async function resolveMemberDisplayAfterSave(params: {
  saved: MemberUser
  before: MemberUser
  scope: MemberSaveScope
  membersRemote: boolean
  fetchMaskedDetail: (before: MemberUser) => Promise<MemberUser>
}): Promise<{ user: MemberUser; refetchNeeded: boolean }> {
  const { saved, before, scope, membersRemote, fetchMaskedDetail } = params
  if (!membersRemote || scope !== 'profile') return { user: saved, refetchNeeded: false }
  try {
    return { user: await fetchMaskedDetail(before), refetchNeeded: false }
  } catch {
    return { user: before, refetchNeeded: true }
  }
}
