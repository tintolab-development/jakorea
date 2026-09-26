import type { CareerPostingDetail } from '../model/types'
import { formatCareerRecruitPeriodLabel } from '../api/mappers'
import { getMockCareerJobs } from './mock-data'

const MOCK_RECRUIT_PERIOD: Record<string, { start: string; end: string }> = {
  'job-1': { start: '2026-04-03', end: '2026-11-20' },
  'job-2': { start: '2026-04-22', end: '2026-06-30' },
}

/** API 미설정일 때만. 본문은 제목 한 단락. 모집중만 모집 기간을 둔다. */
export function getMockCareerPostingDetail(id: string): CareerPostingDetail | null {
  const job = getMockCareerJobs().find(item => item.id === id)
  if (!job || job.status === 'closed') return null

  const period = job.status === 'recruiting' ? MOCK_RECRUIT_PERIOD[job.id] : undefined

  return {
    ...job,
    content: `<p>${job.title}</p>`,
    contentFormat: 'html',
    publishedAtDetailLabel: job.publishedAtLabel,
    recruitPeriodLabel: formatCareerRecruitPeriodLabel(period?.start, period?.end),
    viewCount: null,
    attachments: [],
  }
}
