import {
  getUjatInstitutionApplicationDetail,
  getUjatInstitutionApplicationRowById,
} from '@/data/mock/ujat-institution-application-mock'
import { formatUjatInstitutionFridayDisplay } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import { formatGradeClassSectionLabel } from '@/features/program/ujat/ui/detail-modal/application-institution/list/grade-class-sections'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import { UJAT_INSTITUTION_APPLICATION_REGIONS } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import { UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import { getUjatScheduleAssignRegionState } from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-assign/store'
import { parseGradeClassSectionValue } from '@/features/program/ujat/ui/detail-modal/application-institution/list/grade-class-sections'
import { resolveEducationSemesterForIsoDate } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type {
  UjatEducationProgressInstitutionConfirmedScheduleRow,
  UjatEducationProgressInstitutionDetail,
  UjatEducationProgressInstitutionGuidance,
} from './types'

const GUIDANCE_BY_INSTITUTION_ID: Record<string, UjatEducationProgressInstitutionGuidance> = {
  'gwangju-jinwol': {
    deviceAvailability: '6학년 개별 태블릿 사용 가능',
    waitingAreaGuide:
      '후관2층 1-4 옆 강사대기실(늘봄교실1)에서 대기, 정수기는 후관2층 2학년 연구실 이용하시면 됩니다.',
    leftoverTextbookDisposal:
      "후관1층 세면대 옆 '종이 쓰레기 분리장' 이용 부탁드립니다.",
    parkingAndNotes:
      "본교 주차장이 협소한 관계로 학교 바로 옆 '운남동 공영주차장' 이용 부탁드립니다.",
    snackAvailability: '가능',
    criminalRecordCheckRequest:
      '범죄경력회보서 사이트 이용 : 온라인 제출 | ID : tinto | 검증번호 : 940412',
  },
}

const DEFAULT_GUIDANCE: UjatEducationProgressInstitutionGuidance = {
  deviceAvailability: '-',
  waitingAreaGuide: '-',
  leftoverTextbookDisposal: '-',
  parkingAndNotes: '-',
  snackAvailability: '-',
  criminalRecordCheckRequest: '-',
}

function regionLabel(regionKey: UjatInstitutionApplicationRegionKey): string {
  return (
    UJAT_INSTITUTION_APPLICATION_REGIONS.find(r => r.key === regionKey)?.label ?? regionKey
  )
}

function buildConfirmedEducationScheduleRows(
  institutionId: string,
  regionKey: UjatInstitutionApplicationRegionKey,
  half: EducationProgressHalfKey
): UjatEducationProgressInstitutionConfirmedScheduleRow[] {
  const state = getUjatScheduleAssignRegionState(regionKey)
  const rows: UjatEducationProgressInstitutionConfirmedScheduleRow[] = []

  for (const { isoDate } of UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES) {
    if (resolveEducationSemesterForIsoDate(isoDate) !== half) continue
    const day = state.days[isoDate]
    if (!day) continue

    const classLabels: string[] = []
    for (const assignRow of day.rows) {
      if (assignRow.institutionRowId !== institutionId) continue
      for (const value of assignRow.gradeValues) {
        const parsed = parseGradeClassSectionValue(value)
        if (!parsed) continue
        classLabels.push(formatGradeClassSectionLabel(parsed))
      }
    }

    if (classLabels.length === 0) continue

    rows.push({
      id: `${institutionId}-${isoDate}`,
      dateDisplay: formatUjatInstitutionFridayDisplay(isoDate),
      classLabels,
    })
  }

  return rows
}

export function getUjatEducationProgressInstitutionDetail(
  _programId: string,
  half: EducationProgressHalfKey,
  institutionId: string
): UjatEducationProgressInstitutionDetail | null {
  const row = getUjatInstitutionApplicationRowById(institutionId)
  if (!row) return null

  const applicationDetail = getUjatInstitutionApplicationDetail(row)
  const guidance = GUIDANCE_BY_INSTITUTION_ID[institutionId] ?? DEFAULT_GUIDANCE

  return {
    institutionId,
    half,
    institutionName: row.institutionName,
    educationRegion: regionLabel(row.regionKey),
    adminComment: '',
    applicationDetail,
    confirmedScheduleRows: buildConfirmedEducationScheduleRows(
      institutionId,
      row.regionKey,
      half
    ),
    guidance,
  }
}

export function getUjatEducationProgressInstitutionName(
  institutionId: string
): string | null {
  return getUjatInstitutionApplicationRowById(institutionId)?.institutionName ?? null
}
