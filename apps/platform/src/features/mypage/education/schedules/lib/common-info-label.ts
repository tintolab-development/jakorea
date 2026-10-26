import type {
  PortalEducationStructure,
  PortalSessionRound,
} from '../../applications/api/activity-client'

export const EDUCATION_SCHEDULE_EMPTY_LABEL = '-'

const OPERATIONAL_SLOT_TITLE_RE = /^공통 교육 예정/

export type EducationScheduleCommonInfoLabelInput = {
  educationStructure?: PortalEducationStructure | null
  sessionRound?: PortalSessionRound | null
  unitName?: string | null
  scheduleName?: string | null
  title?: string | null
  sessionLabel?: string | null
}

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function isOperationalSlotTitle(value: string): boolean {
  return OPERATIONAL_SLOT_TITLE_RE.test(value)
}

/** 운영 슬롯 기본명(공통 교육 예정…)은 공통정보가 아니다. */
function asCommonInfoText(value: string | null | undefined): string | undefined {
  const text = optionalText(value)
  if (!text || isOperationalSlotTitle(text)) return undefined
  return text
}

/**
 * CMS `formatGeneralProgramProgressSessionDisplay` 와 동일.
 * `1` / `1차시` → `1차시`. `1회차`·단원명·운영 기본명은 제외.
 */
function formatProgressSession(value: string | null | undefined): string | undefined {
  const text = asCommonInfoText(value)
  if (!text) return undefined
  const n = text.replace(/차시\s*$/u, '').trim()
  if (!/^\d+$/u.test(n)) return undefined
  return `${n}차시`
}

export type EducationScheduleRowLabelInput = {
  educationStructure?: PortalEducationStructure | null
  sessionLabel?: string | null
  scheduleName?: string | null
}

/**
 * 교육일정 카드 회차/일정 라벨 — CMS `resolveSchoolDetailAttendanceSessionLeadLabel` 기준.
 * 커리큘럼형: 회차명(`sessionLabel`), 일정형: 일정명(`scheduleName`). 없으면 `-`.
 */
export function resolveEducationScheduleRowLabel(input: EducationScheduleRowLabelInput): string {
  const sessionLabel = optionalText(input.sessionLabel)
  const scheduleName = optionalText(input.scheduleName)
  if (input.educationStructure === 'CURRICULUM') {
    return sessionLabel ?? EDUCATION_SCHEDULE_EMPTY_LABEL
  }
  if (input.educationStructure === 'SCHEDULE') {
    return scheduleName ?? EDUCATION_SCHEDULE_EMPTY_LABEL
  }
  return sessionLabel ?? scheduleName ?? EDUCATION_SCHEDULE_EMPTY_LABEL
}

/**
 * 교육현황 일정 카드 청록 라벨 — 프로그램 공통정보.
 * 커리큘럼 복수: 차시, 커리큘럼 단일: 단원명, 일정형: 일정명.
 */
export function resolveEducationScheduleCommonInfoLabel(
  input: EducationScheduleCommonInfoLabelInput,
): string {
  const structure = input.educationStructure
  const round = input.sessionRound

  if (structure === 'CURRICULUM' && round === 'MULTI') {
    return (
      formatProgressSession(input.unitName) ||
      formatProgressSession(input.title) ||
      formatProgressSession(input.sessionLabel) ||
      EDUCATION_SCHEDULE_EMPTY_LABEL
    )
  }

  if (structure === 'CURRICULUM') {
    return (
      asCommonInfoText(input.unitName) ||
      asCommonInfoText(input.title) ||
      EDUCATION_SCHEDULE_EMPTY_LABEL
    )
  }

  if (structure === 'SCHEDULE') {
    return (
      asCommonInfoText(input.scheduleName) ||
      asCommonInfoText(input.title) ||
      EDUCATION_SCHEDULE_EMPTY_LABEL
    )
  }

  return (
    asCommonInfoText(input.unitName) ||
    asCommonInfoText(input.scheduleName) ||
    asCommonInfoText(input.title) ||
    EDUCATION_SCHEDULE_EMPTY_LABEL
  )
}
