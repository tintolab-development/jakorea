import type { EducationApplicationListItem } from '../model/types'

/** 일반회원 봉사현황 대상. UJAT 봉사는 교육현황에 남김 */
export function isGeneralVolunteerApplication(item: EducationApplicationListItem): boolean {
  return item.detailCase === 'volunteer'
}

export function filterEducationStatusApplications(
  items: EducationApplicationListItem[],
): EducationApplicationListItem[] {
  return items.filter(item => !isGeneralVolunteerApplication(item))
}

export function filterVolunteerStatusApplications(
  items: EducationApplicationListItem[],
): EducationApplicationListItem[] {
  return items.filter(isGeneralVolunteerApplication)
}
