/**
 * 알림 버튼 → 프로그램 상세 진행 현황 탭 (시안 「시스템 안내 팝업」).
 * 유형별 상세 URL(기본 정보 탭)이 확정된 뒤 `lnb`·`tab`만 바꾼다.
 *
 * - 일반 프로그램(`/programs/general`): `lnb=progress` + `progress_participants|progress_instructors|progress_posts`.
 *   유형(기관·개인)에 없는 탭이면 상세 모달이 진행 현황 첫 탭으로 돌린다.
 * - 1사1교·교육 받은 교사(`program-detail-fullpage-modal`): `lnb=progress` + `institutions|instructors`.
 * - 그 밖(UJAT 등): 탭 구성이 달라 기본 정보 탭 그대로 연다.
 */

import type { ProgramDetailSection } from './admin-notification-navigation'

const GENERAL_SECTION_TABS: Readonly<Record<ProgramDetailSection, string>> = {
  participants: 'progress_participants',
  instructors: 'progress_instructors',
  posts: 'progress_posts',
}

const SHARED_MODAL_SECTION_TABS: Readonly<Partial<Record<ProgramDetailSection, string>>> = {
  participants: 'institutions',
  instructors: 'instructors',
}

const SHARED_MODAL_PATHS: ReadonlySet<string> = new Set([
  '/programs/company-school',
  '/programs/trained-teachers',
])

export function applyProgramDetailSection(url: string, section: ProgramDetailSection): string {
  const [path, query = ''] = url.split('?')
  const tab =
    path === '/programs/general'
      ? GENERAL_SECTION_TABS[section]
      : SHARED_MODAL_PATHS.has(path)
        ? SHARED_MODAL_SECTION_TABS[section]
        : undefined
  if (!tab) return url
  const params = new URLSearchParams(query)
  params.set('lnb', 'progress')
  params.set('tab', tab)
  return `${path}?${params.toString()}`
}
