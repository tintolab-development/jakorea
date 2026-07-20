/** 런타임 회원 프로필 — CMS UserRole + InstructorMemberProfile 정합 */
export type PlatformMemberProfile =
  | 'individual'
  | 'school_teacher'
  | 'instructor_only'
  | 'instructor_dual'

export type MypageLnbItemKey = 'home' | 'education' | 'volunteer' | 'inquiries'

export type MypageLnbItem = {
  key: MypageLnbItemKey
  label: string
  /** 현재 활성 메뉴 여부 */
  active?: boolean
  /** 클릭 가능 여부 — 미구현 메뉴는 false */
  enabled?: boolean
}

export type MypageProgramStats = {
  applied: number
  inProgress: number
  completed: number
}
