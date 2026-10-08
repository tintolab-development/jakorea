import { getUjatInstitutionApplicationDetail } from '@/features/program/ujat/model/ujat-institution-application'
import type { UjatInstitutionApplicationRow } from '../list/types'
import type { UjatInstitutionApplicationDetail } from '../detail/detail-types'
import {
  formatGradeClassSectionLabel,
  parseGradeClassSectionValue,
} from '../list/grade-class-sections'
import { formatUjatInstitutionFridayDisplay } from '../education-schedule'
import { getUjatScheduleAssignRegionState } from '../schedule-assign/store'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import { getUjatInstitutionScheduleConfirmConfirmedDetailExtras } from '@/features/program/ujat/model/ujat-institution-application'
import type {
  UjatScheduleConfirmConfirmedDetail,
  UjatScheduleConfirmGuidanceNotes,
  ScheduleConfirmTextbookInfo,
} from './confirmed-detail-types'

const DEFAULT_TEXTBOOK: ScheduleConfirmTextbookInfo = {
  textbookName: '우리경제',
  kitSummary: '1키트',
  deliveryStatus: 'before_shipping',
}

const DEFAULT_GUIDANCE: UjatScheduleConfirmGuidanceNotes = {
  searchDeviceGrade6: '-',
  waitingArea: '-',
  textbookDisposalLocation: '-',
  otherSpecialNotes: '-',
  snackAvailability: '-',
  sexOffenderCheck: '-',
}

function buildEducationScheduleDays(
  institutionId: string,
  regionKey: UjatInstitutionApplicationRegionKey
): UjatScheduleConfirmConfirmedDetail['educationScheduleDays'] {
  const state = getUjatScheduleAssignRegionState(regionKey)
  const days: UjatScheduleConfirmConfirmedDetail['educationScheduleDays'] = []

  for (const isoDate of Object.keys(state.days).sort()) {
    const day = state.days[isoDate]
    if (!day) continue
    const classLabels: string[] = []
    for (const row of day.rows) {
      if (row.institutionRowId !== institutionId) continue
      for (const value of row.gradeValues) {
        const parsed = parseGradeClassSectionValue(value)
        if (!parsed) continue
        classLabels.push(formatGradeClassSectionLabel(parsed))
      }
    }
    if (classLabels.length === 0) continue
    const sortedLabels = [...classLabels].sort((a, b) => {
      const parse = (label: string) => {
        const gradeMatch = label.match(/^(\d+)학년/)
        const classMatch = label.match(/(\d+)반$/)
        return {
          grade: gradeMatch ? Number(gradeMatch[1]) : 0,
          classNo: classMatch ? Number(classMatch[1]) : 0,
        }
      }
      const left = parse(a)
      const right = parse(b)
      return left.grade - right.grade || left.classNo - right.classNo
    })
    days.push({
      dateLabel: formatUjatInstitutionFridayDisplay(isoDate),
      classLabels: sortedLabels,
    })
  }

  return days
}

export function buildUjatScheduleConfirmConfirmedDetail(
  row: UjatInstitutionApplicationRow | null,
  baseDetail?: UjatInstitutionApplicationDetail | null
): UjatScheduleConfirmConfirmedDetail | null {
  if (!row) return null
  const institutionId = row.id

  const base = baseDetail ?? getUjatInstitutionApplicationDetail(row)
  const extras = getUjatInstitutionScheduleConfirmConfirmedDetailExtras(institutionId) ?? {}
  const scheduleConfirmStatus = row.scheduleConfirmStatus ?? null

  const gradeEducationBlocks = base.gradeBlocks.map(block => ({
    ...block,
    textbook: extras.gradeTextbooks?.[block.gradeLabel] ?? {
      ...DEFAULT_TEXTBOOK,
      kitSummary: `${block.classCount}키트`,
    },
  }))

  const guidanceNotes: UjatScheduleConfirmGuidanceNotes = {
    ...DEFAULT_GUIDANCE,
    ...extras.guidanceNotes,
  }

  return {
    scheduleConfirmStatus,
    institutionName: base.institutionName,
    regionLabel: base.regionLabel,
    address: base.address,
    addressDetail: base.addressDetail,
    teacherContact: base.teacherContact,
    otherRequests: base.otherRequests,
    gradeEducationBlocks,
    classTimeRows: base.classTimeRows,
    educationScheduleDays: buildEducationScheduleDays(institutionId, row.regionKey),
    guidanceNotes,
  }
}
