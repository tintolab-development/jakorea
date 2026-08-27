import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import type {
  EducationApplicationListItem,
  EducationApplicationListParams,
  EducationApplicationTab,
} from '../model/education-application-types'
import { EDUCATION_APPLICATION_PAGE_SIZE } from '../model/education-application-types'
import {
  EDUCATION_DISPLAY_STATUS_SORT_ORDER,
  resolveEducationApplicationTab,
} from './education-display-status'

/** 모집중 → 모집 완료 (모집 예정은 그 사이) */
const RECRUITMENT_STATUS_SORT_ORDER: Record<RecruitmentStatus, number> = {
  recruiting: 0,
  scheduled: 1,
  closed: 2,
}

export function matchesEducationApplicationTab(
  item: EducationApplicationListItem,
  tab: EducationApplicationTab,
): boolean {
  if (tab === 'all') {
    return true
  }

  return resolveEducationApplicationTab(item.displayStatus) === tab
}

export function compareEducationApplicationItems(
  a: EducationApplicationListItem,
  b: EducationApplicationListItem,
): number {
  const recruitmentDiff =
    RECRUITMENT_STATUS_SORT_ORDER[a.recruitmentStatus] -
    RECRUITMENT_STATUS_SORT_ORDER[b.recruitmentStatus]
  if (recruitmentDiff !== 0) {
    return recruitmentDiff
  }

  return (
    EDUCATION_DISPLAY_STATUS_SORT_ORDER[a.displayStatus] -
    EDUCATION_DISPLAY_STATUS_SORT_ORDER[b.displayStatus]
  )
}

type ListEducationApplicationsOptions = Pick<EducationApplicationListParams, 'tab' | 'page'> & {
  pageSize?: number
}

export function listEducationApplications(
  items: EducationApplicationListItem[],
  { tab, page, pageSize = EDUCATION_APPLICATION_PAGE_SIZE }: ListEducationApplicationsOptions,
) {
  const filtered = items.filter(item => matchesEducationApplicationTab(item, tab))
  const sorted = [...filtered].sort(compareEducationApplicationItems)
  const totalElements = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * pageSize
  const pageItems = sorted.slice(start, start + pageSize)

  return {
    items: pageItems,
    totalElements,
    totalPages,
    currentPage: safePage,
  }
}
