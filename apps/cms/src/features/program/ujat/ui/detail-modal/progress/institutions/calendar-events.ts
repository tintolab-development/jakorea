import {
  UJAT_EDU_PROGRESS_INSTITUTION_GRADE_LABELS,
  type UjatEducationProgressInstitutionRow,
} from './types'

export type UjatEducationProgressInstitutionCalendarOriginalItem =
  UjatEducationProgressInstitutionRow & {
    schoolName: string
    /** 피그마 참여 기관 카드·툴팁 2행 왼쪽 — 교육 지역명 */
    calendarRegionLabel: string
    /** 피그마 2행 오른쪽 — `3학년 2학급, 5학년 4학급` (학급 0인 학년 제외) */
    calendarGradeClassDetail: string
  }

export type UjatEducationProgressInstitutionCalendarEvent = {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: UjatEducationProgressInstitutionCalendarOriginalItem
}

export function formatEducationProgressGradeClassDetail(
  gradeClassCounts: UjatEducationProgressInstitutionRow['gradeClassCounts']
): string {
  return UJAT_EDU_PROGRESS_INSTITUTION_GRADE_LABELS.flatMap(label => {
    const count = gradeClassCounts[label] ?? 0
    return count > 0 ? [`${label} ${count}학급`] : []
  }).join(', ')
}

function formatCalendarMeta(row: UjatEducationProgressInstitutionRow): {
  calendarRegionLabel: string
  calendarGradeClassDetail: string
} {
  const region = row.educationRegion.trim()
  return {
    calendarRegionLabel: region && region !== '-' ? region : '',
    calendarGradeClassDetail: formatEducationProgressGradeClassDetail(row.gradeClassCounts),
  }
}

export function buildUjatEducationProgressInstitutionCalendarEvents(
  rows: UjatEducationProgressInstitutionRow[]
): UjatEducationProgressInstitutionCalendarEvent[] {
  const events: UjatEducationProgressInstitutionCalendarEvent[] = []

  for (const row of rows) {
    const meta = formatCalendarMeta(row)
    for (const isoDate of row.educationScheduleIsoDates) {
      events.push({
        id: `${row.id}-${isoDate}`,
        title: row.institutionName,
        startDate: `${isoDate}T00:00:00`,
        endDate: `${isoDate}T00:00:00`,
        originalItem: {
          ...row,
          schoolName: row.institutionName,
          ...meta,
        },
      })
    }
  }

  return events
}

export function toEducationProgressInstitutionCalendarListRow(
  item: UjatEducationProgressInstitutionCalendarOriginalItem
): {
  id: string
  institutionName: string
  statusLabel: string
  statusKey: string
  totalClassSummary: string
  gradeDetail: string
} {
  return {
    id: item.id,
    institutionName: item.institutionName,
    // 활동 포기 상태는 아직 행 데이터에 없어 태그를 그리지 않는다.
    statusLabel: '',
    statusKey: '',
    totalClassSummary: item.calendarRegionLabel,
    gradeDetail: item.calendarGradeClassDetail,
  }
}
