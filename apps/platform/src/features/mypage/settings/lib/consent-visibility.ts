import type { PlatformMemberProfile } from '../../model/types.ts'

/**
 * 약관 및 정책 동의 관리 — 강사 「동의서·서약서」섹션 노출 여부.
 * 일반회원·교사회원(겸직 아님)은 기본 동의 4항목만(동일 UI). 강사(순수·겸직)만 true.
 */
export function showSettingsInstructorConsentDocuments(profile: PlatformMemberProfile): boolean {
  return profile === 'instructor_only' || profile === 'instructor_dual'
}
