import {
  getUjatInstitutionApplicationDetail,
  getUjatInstitutionApplicationRowById,
  getUjatInstitutionScheduleConfirmStatus,
} from '@/data/mock/ujat-institution-application-mock'
import {
  formatGradeClassSectionLabel,
  parseGradeClassSectionValue,
} from '../list/grade-class-sections'
import {
  UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES,
  formatUjatInstitutionFridayDisplay,
} from '../education-schedule'
import { getUjatScheduleAssignRegionState } from '../schedule-assign/store'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import { getUjatInstitutionScheduleConfirmConfirmedDetailExtras } from '@/data/mock/ujat-institution-application-mock'
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

  for (const { isoDate } of UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES) {
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
  institutionId: string
): UjatScheduleConfirmConfirmedDetail | null {
  const row = getUjatInstitutionApplicationRowById(institutionId)
  if (!row) return null

  const base = getUjatInstitutionApplicationDetail(row)
  const extras = getUjatInstitutionScheduleConfirmConfirmedDetailExtras(institutionId) ?? {}
  const scheduleConfirmStatus = getUjatInstitutionScheduleConfirmStatus(institutionId)

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
