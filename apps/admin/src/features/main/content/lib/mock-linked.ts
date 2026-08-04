import type { ImpactStoryOption, LinkedProgram } from '../model/types'

/** 프로그램 관리 연동 mock — 최신순 8개 노출용 */
export const MOCK_LINKED_PROGRAMS: LinkedProgram[] = [
  { id: 'prog-1', title: 'JA 경제교육 캠프', publishedAt: '2026-07-10' },
  { id: 'prog-2', title: '금융 리터러시 교실', publishedAt: '2026-07-08' },
  { id: 'prog-3', title: '창업 체험 워크숍', publishedAt: '2026-07-01' },
  { id: 'prog-4', title: '글로벌 시민교육', publishedAt: '2026-06-28' },
  { id: 'prog-5', title: '진로 탐색 프로그램', publishedAt: '2026-06-20' },
  { id: 'prog-6', title: '디지털 경제 교실', publishedAt: '2026-06-15' },
  { id: 'prog-7', title: '사회혁신 프로젝트', publishedAt: '2026-06-10' },
  { id: 'prog-8', title: '리더십 아카데미', publishedAt: '2026-06-01' },
  { id: 'prog-9', title: '(미노출) 9번째', publishedAt: '2026-05-20' },
]

/** 임팩트 스토리 연동 mock — 최신순 셀렉트 */
export const MOCK_IMPACT_STORIES: ImpactStoryOption[] = [
  { id: 'story-1', title: '청소년의 가능성을 키운 한 해', publishedAt: '2026-07-12' },
  { id: 'story-2', title: '기업과 함께한 교육 현장', publishedAt: '2026-07-05' },
  { id: 'story-3', title: '봉사자가 전한 변화의 이야기', publishedAt: '2026-06-22' },
  { id: 'story-4', title: '지역 사회와 만든 임팩트', publishedAt: '2026-06-01' },
]

export function getLatestPrograms(limit = 8): LinkedProgram[] {
  return [...MOCK_LINKED_PROGRAMS]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)
}

export function getImpactStoryOptions(): ImpactStoryOption[] {
  return [...MOCK_IMPACT_STORIES].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  )
}
