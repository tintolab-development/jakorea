/**
 * 기관 신청·일정 확인 상태 색 정본 (UJAT 기관 배정 14804:19750 · 일정 확인 14804:19740).
 * 같은 상태라도 표시 종류(Text / Tag)마다 Figma 색이 다를 수 있어 종류별로 둔다.
 * 라벨은 호출처 정의를 쓰고, 여기서는 색만 정한다. 모르는 key는 중립.
 */

const NEUTRAL_TEXT = 'var(--Netural-black, #3d3d3d)'
const NEUTRAL_TAG = 'rgba(61, 61, 61, 0.8)'
const GREEN = 'var(--Status-green-main, #1e8c29)'
const BLUE = 'var(--Status-blue-main, #017eaf)'
const RED = 'var(--Status-red-main, #c32f4a)'
const PURPLE = 'var(--Status-purple-main, #8457ce)'
const PINK = 'var(--Status-pink-main, #e8007c)'

/** Status / Text — 목록·상세 테이블 */
const INSTITUTION_APPLICATION_TEXT_COLOR: Record<string, string> = {
  evaluation_pending: GREEN,
  temp_rejected: RED,
  temp_assigned: NEUTRAL_TEXT,
  application_rejected: RED,
  institution_checking: GREEN,
  institution_confirmed: BLUE,
  approval_completed: NEUTRAL_TEXT,
  revision_requested: PURPLE,
}

/** Status / Tag — 캘린더 일별 리스트 (`StatusOutlineTag`) */
const INSTITUTION_APPLICATION_TAG_COLOR: Record<string, string> = {
  evaluation_pending: GREEN,
  temp_rejected: PINK,
  temp_assigned: NEUTRAL_TAG,
  application_rejected: RED,
  institution_checking: GREEN,
  institution_confirmed: BLUE,
  approval_completed: NEUTRAL_TAG,
  revision_requested: PURPLE,
}

export function getInstitutionApplicationStatusColor(
  statusKey: string,
  kind: 'text' | 'tag'
): string {
  if (kind === 'tag') return INSTITUTION_APPLICATION_TAG_COLOR[statusKey] ?? NEUTRAL_TAG
  return INSTITUTION_APPLICATION_TEXT_COLOR[statusKey] ?? NEUTRAL_TEXT
}
