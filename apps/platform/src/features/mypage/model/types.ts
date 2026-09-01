/** 런타임 회원 프로필 — CMS UserRole + InstructorMemberProfile 정합 */
export type PlatformMemberProfile =
  | 'individual'
  | 'school_teacher'
  | 'instructor_only'
  | 'instructor_dual'

export type MypageHomeLnbItemKey =
  | 'home'
  | 'lectures'
  | 'settlement'
  | 'education'
  | 'volunteer'
  | 'inquiries'

export type MypageSettingsLnbItemKey = 'settingsProfile' | 'settingsConsents'

export type MypageLnbItemKey = MypageHomeLnbItemKey | MypageSettingsLnbItemKey

export type MypageLnbItem = {
  key: MypageLnbItemKey
  label: string
  /** 현재 활성 메뉴 여부 */
  active?: boolean
  /** 클릭 가능 여부 — 미구현 메뉴는 false */
  enabled?: boolean
  /** 메뉴 아래 구분선 (강사 LNB 상·하단 섹션) */
  dividerAfter?: boolean
  /** true면 아이콘 생략 (설정 LNB) */
  hideIcon?: boolean
}

export type MypageProgramStats = {
  applied: number
  inProgress: number
  completed: number
}

export type { MypageScheduleEvent, MypageScheduleEventType } from '../home/model/schedule-types'
