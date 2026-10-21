/**
 * 모집 유형별 「프로그램 운영 기간」 — 사업 `Program.startDate`/`endDate`와 분리
 */
import dayjs from 'dayjs'
import type { GeneralRecruitDetailAudience } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import type { ProgramDetailRecruitmentAudience } from '@/features/program/shared/lib/apply-recruitment-additional-content-html'
import { formatDateRange } from '@/features/program/shared/lib/program-detail-info-constants'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import type { Program, ProgramRecruitmentWindow } from '@/types/domain'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/** 모집 운영 기간 요청값. 날짜만 있는 값은 유지하고, 시각이 있으면 KST 달력일로 맞춘다. */
export function toOperationCalendarDate(
  value: string | Date | undefined | null
): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  }
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return undefined
  return new Date(time + KST_OFFSET_MS).toISOString().slice(0, 10)
}

/** 조회용 기간 라벨 → ISO (YYYY.MM.DD · YYYY-MM-DD 등) */
export function parseDisplayPeriodLabelToIsoRange(
  label: string | undefined
): { start?: string; end?: string } {
  if (!label?.trim() || label.trim() === '-') return {}
  const parts = label
    .split(/\s*[~\-–—]\s*/)
    .map(part => part.replace(/\([^)]*\)/g, '').trim())
    .filter(Boolean)
  if (parts.length < 2) return {}
  const start = dayjs(parts[0])
  const end = dayjs(parts[1])
  if (!start.isValid() || !end.isValid()) return {}
  return {
    start: start.startOf('day').toISOString(),
    end: end.startOf('day').toISOString(),
  }
}

function recruitmentTypeForAudience(
  audience: GeneralRecruitDetailAudience
): 'PARTICIPANT' | 'INSTRUCTOR' | 'VOLUNTEER' {
  if (audience === 'instructor') return 'INSTRUCTOR'
  if (audience === 'volunteer') return 'VOLUNTEER'
  return 'PARTICIPANT'
}

function nestedInfoForAudience(program: Program, audience: GeneralRecruitDetailAudience) {
  if (audience === 'instructor') return program.generalCommonInfo?.instructorRecruitmentInfo
  if (audience === 'volunteer') return program.generalCommonInfo?.volunteerRecruitmentInfo
  return program.generalCommonInfo?.participantRecruitmentInfo
}

function recruitmentRowForAudience(program: Program, audience: GeneralRecruitDetailAudience) {
  const type = recruitmentTypeForAudience(audience)
  return (program.programRecruitments ?? []).find(
    item => (item.recruitmentType ?? '').toUpperCase() === type
  )
}

/**
 * 조회 표시는 모집 행 operation 날짜가 정본이다.
 * `operationPeriodLabel`·programRangeSeal 은 행 날짜가 없을 때만 쓴다.
 */
export function audienceOperationPeriodLabelFromRecruitmentRow(
  program: Program,
  audience: GeneralRecruitDetailAudience
): string | undefined {
  const row = recruitmentRowForAudience(program, audience)
  if (!row?.operationStartDate && !row?.operationEndDate) return undefined
  const label = formatDateRange(
    row.operationStartDate ? String(row.operationStartDate) : undefined,
    row.operationEndDate ? String(row.operationEndDate) : undefined
  )
  return label === '-' ? undefined : label
}

/** 조회 SSOT 우선순위: recruitment 행 operation 날짜 → nested operationPeriodLabel */
export function resolveAudienceProgramOperationIsoRange(
  program: Program,
  audience: GeneralRecruitDetailAudience
): { start?: string; end?: string } {
  const row = recruitmentRowForAudience(program, audience)
  if (row?.operationStartDate) {
    return {
      start: String(row.operationStartDate),
      end: row.operationEndDate ? String(row.operationEndDate) : undefined,
    }
  }
  return parseDisplayPeriodLabelToIsoRange(nestedInfoForAudience(program, audience)?.operationPeriodLabel)
}

export function audienceOperationFormFieldNames(audience: ProgramDetailRecruitmentAudience): {
  start: 'participantProgramOperationStartDate' | 'instructorProgramOperationStartDate' | 'volunteerProgramOperationStartDate'
  end: 'participantProgramOperationEndDate' | 'instructorProgramOperationEndDate' | 'volunteerProgramOperationEndDate'
} {
  if (audience === 'instructor') {
    return {
      start: 'instructorProgramOperationStartDate',
      end: 'instructorProgramOperationEndDate',
    }
  }
  if (audience === 'volunteer') {
    return {
      start: 'volunteerProgramOperationStartDate',
      end: 'volunteerProgramOperationEndDate',
    }
  }
  return {
    start: 'participantProgramOperationStartDate',
    end: 'participantProgramOperationEndDate',
  }
}

export function seedAudienceProgramOperationFormFields(
  program: Program,
  audience: GeneralRecruitDetailAudience
): Pick<
  ProgramDetailEditFormValues,
  | 'participantProgramOperationStartDate'
  | 'participantProgramOperationEndDate'
  | 'instructorProgramOperationStartDate'
  | 'instructorProgramOperationEndDate'
  | 'volunteerProgramOperationStartDate'
  | 'volunteerProgramOperationEndDate'
> {
  const range = resolveAudienceProgramOperationIsoRange(program, audience)
  const start = range.start ?? ''
  const end = range.end ?? ''
  if (audience === 'instructor') {
    return {
      instructorProgramOperationStartDate: start,
      instructorProgramOperationEndDate: end,
    }
  }
  if (audience === 'volunteer') {
    return {
      volunteerProgramOperationStartDate: start,
      volunteerProgramOperationEndDate: end,
    }
  }
  return {
    participantProgramOperationStartDate: start,
    participantProgramOperationEndDate: end,
  }
}

export function applyAudienceProgramOperationToRecruitmentWindows(
  program: Program,
  values: ProgramDetailEditFormValues,
  audience: ProgramDetailRecruitmentAudience
): Pick<Program, 'programRecruitments'> | Record<string, never> {
  const { start: startKey, end: endKey } = audienceOperationFormFieldNames(audience)
  const start = toOperationCalendarDate(values[startKey])
  const end = toOperationCalendarDate(values[endKey])
  if (!start && !end) return {}

  const type = recruitmentTypeForAudience(audience)
  const rows = program.programRecruitments ?? []
  if (rows.length === 0) return {}

  const next: ProgramRecruitmentWindow[] = rows.map(row => {
    if ((row.recruitmentType ?? '').toUpperCase() !== type) return row
    return {
      ...row,
      operationStartDate: start || row.operationStartDate,
      operationEndDate: end || row.operationEndDate,
    }
  })
  return { programRecruitments: next }
}
