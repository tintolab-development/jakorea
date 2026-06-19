/**
 * UJAT 교육 진행 현황 — 참여 기관 목록 mock
 */

import { buildUjatScheduleConfirmRows } from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-confirm/build-confirm-rows'
import {
  UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES,
  resolveEducationSemesterForIsoDate,
} from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import {
  getUjatEducationRegionLabel,
  listUjatEducationRegionsActive,
} from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type { UjatEducationProgressInstitutionRow } from '@/features/program/ujat/ui/detail-modal/progress/institutions/types'

export function getUjatEducationProgressScheduleFilterOptions(half: EducationProgressHalfKey) {
  return UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES.filter(entry => entry.semester === half).map(
    ({ isoDate, title }) => ({ label: title, value: isoDate })
  )
}

function regionLabel(regionKey: string): string {
  return getUjatEducationRegionLabel(regionKey, regionKey)
}

function rowMatchesHalf(row: UjatEducationProgressInstitutionRow, half: EducationProgressHalfKey): boolean {
  if (row.educationScheduleIsoDates.length === 0) {
    return half === 'h1'
  }
  return row.educationScheduleIsoDates.some(
    iso => resolveEducationSemesterForIsoDate(iso) === half
  )
}

function buildBaseRows(half: EducationProgressHalfKey): UjatEducationProgressInstitutionRow[] {
  const rows: UjatEducationProgressInstitutionRow[] = []

  for (const { key: regionKey } of listUjatEducationRegionsActive()) {
    const confirmRows = buildUjatScheduleConfirmRows(regionKey as UjatInstitutionApplicationRegionKey)
    for (const confirm of confirmRows) {
      if (
        confirm.scheduleConfirmStatus !== 'institution_confirmed' &&
        confirm.scheduleConfirmStatus !== 'approval_completed'
      ) {
        continue
      }
      if (
        confirm.totalEducationClassCount === 0 &&
        (confirm.confirmedScheduleDisplay === '-' || !confirm.confirmedScheduleDisplay)
      ) {
        continue
      }

      const candidate: UjatEducationProgressInstitutionRow = {
        id: `${half}-${confirm.id}`,
        sourceInstitutionId: confirm.id,
        regionKey: confirm.regionKey,
        no: 0,
        institutionName: confirm.institutionName,
        educationRegion: regionLabel(confirm.regionKey),
        educationScheduleDisplay: confirm.confirmedScheduleDisplay,
        educationScheduleIsoDates: confirm.confirmedScheduleIsoDates,
        gradeClassCounts: { ...confirm.assignedGradeCounts },
        totalEducationClassCount: confirm.totalEducationClassCount,
        teacherName: confirm.teacherName,
        half,
      }

      if (rowMatchesHalf(candidate, half)) {
        rows.push(candidate)
      }
    }
  }

  return rows
    .sort((a, b) => a.institutionName.localeCompare(b.institutionName, 'ko'))
    .map((row, index, arr) => ({
      ...row,
      no: arr.length - index,
    }))
}

const cache = new Map<string, UjatEducationProgressInstitutionRow[]>()

export function getUjatEducationProgressInstitutions(
  programId: string,
  half: EducationProgressHalfKey
): UjatEducationProgressInstitutionRow[] {
  const key = `${programId}:${half}`
  const existing = cache.get(key)
  if (existing) return existing.map(row => ({ ...row }))

  let rows = buildBaseRows(half)

  if (rows.length < 30) {
    const padded = [...rows]
    let seed = 0
    for (let i = 0; i < programId.length; i += 1) {
      seed = (seed * 31 + programId.charCodeAt(i)) | 0
    }
    while (padded.length < 30 && rows.length > 0) {
      const source = rows[Math.abs(seed + padded.length) % rows.length]
      padded.push({
        ...source,
        id: `${source.id}-dup-${padded.length}`,
        sourceInstitutionId: source.sourceInstitutionId,
        no: 0,
      })
    }
    rows = padded
  }

  rows = rows.slice(0, 30).map((row, index, arr) => ({
    ...row,
    no: arr.length - index,
  }))

  cache.set(key, rows)
  return rows.map(row => ({ ...row }))
}
