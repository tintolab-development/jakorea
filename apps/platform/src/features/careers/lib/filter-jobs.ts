import type { CareerJobListItem, CareersListParams } from '../model/types'

export function filterCareerJobs(
  jobs: readonly CareerJobListItem[],
  params: CareersListParams
): CareerJobListItem[] {
  /** 인재채용 탭 — 시안·기획 본문 없음 → 빈 목록 */
  if (params.tab === 'talent') {
    return []
  }

  const query = params.q.trim().toLowerCase()

  if (!query) {
    return [...jobs]
  }

  return jobs.filter(job => job.title.toLowerCase().includes(query))
}
