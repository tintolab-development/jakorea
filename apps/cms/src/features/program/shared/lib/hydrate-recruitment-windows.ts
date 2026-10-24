/**
 * GET `recruitments[]` 행이 모집기간·운영기간·문의처·면접 시각 SSOT다.
 * nested `*RecruitmentInfo` 라벨·프로그램 컬럼이 옛값이면 행으로 맞춘다.
 */
import type { Program, ProgramRecruitmentWindow } from '@/types/domain'
import { formatDateRange } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  pickRecruitmentCopyRow,
  type RecruitmentCopyAudience,
} from '@/features/program/shared/lib/recruitment-row-copy'

function hasOwnField(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function rowString(
  row: ProgramRecruitmentWindow | undefined,
  key: keyof Pick<
    ProgramRecruitmentWindow,
    | 'startAt'
    | 'endAt'
    | 'operationStartDate'
    | 'operationEndDate'
    | 'contactName'
    | 'contactPhone'
    | 'contactEmail'
    | 'interviewStartAt'
    | 'interviewEndAt'
  >
): string | undefined {
  if (!row || !hasOwnField(row, key) || row[key] === undefined) return undefined
  return row[key] ?? ''
}

export function recruitmentPeriodLabelFromWindow(
  row: ProgramRecruitmentWindow | undefined
): string | undefined {
  if (!row?.startAt || !row?.endAt) return undefined
  const label = formatDateRange(row.startAt, row.endAt)
  return label === '-' ? undefined : label
}

export function operationPeriodLabelFromWindow(
  row: ProgramRecruitmentWindow | undefined
): string | undefined {
  if (!row?.operationStartDate || !row?.operationEndDate) return undefined
  const label = formatDateRange(row.operationStartDate, row.operationEndDate)
  return label === '-' ? undefined : label
}

function patchNestedFromRow(
  info: Record<string, unknown> | undefined,
  row: ProgramRecruitmentWindow | undefined,
  options?: { interview?: boolean }
): Record<string, unknown> | undefined {
  if (!row) return info
  const next: Record<string, unknown> = { ...(info ?? {}) }
  const recruitLabel = recruitmentPeriodLabelFromWindow(row)
  if (hasOwnField(row, 'startAt') || hasOwnField(row, 'endAt')) {
    next.recruitmentPeriodLabel = recruitLabel ?? ''
  }
  const operationLabel = operationPeriodLabelFromWindow(row)
  if (hasOwnField(row, 'operationStartDate') || hasOwnField(row, 'operationEndDate')) {
    next.operationPeriodLabel = operationLabel ?? ''
  }
  const contactName = rowString(row, 'contactName')
  if (contactName !== undefined) {
    next.contactOrganizationName = contactName
    next.contactName = contactName
  }
  const phone = rowString(row, 'contactPhone')
  if (phone !== undefined) {
    next.inquiryTel = phone
    next.contactPhone = phone
  }
  const email = rowString(row, 'contactEmail')
  if (email !== undefined) {
    next.inquiryEmail = email
    next.contactEmail = email
  }
  if (options?.interview) {
    if (row.interviewEnabled != null) next.volunteerInterviewEnabled = row.interviewEnabled
    const interviewStart = rowString(row, 'interviewStartAt')
    const interviewEnd = rowString(row, 'interviewEndAt')
    if (interviewStart !== undefined) next.interviewStartDate = interviewStart
    if (interviewEnd !== undefined) next.interviewEndDate = interviewEnd
  }
  return next
}

export function hydrateRecruitmentWindowsOntoProgram(program: Program): Program {
  if (!program.programRecruitments?.length) return program

  const participant = pickRecruitmentCopyRow(program, 'participant')
  const instructor = pickRecruitmentCopyRow(program, 'instructor')
  const volunteer = pickRecruitmentCopyRow(program, 'volunteer')

  const participantStart = rowString(participant, 'startAt')
  const participantEnd = rowString(participant, 'endAt')
  const instructorStart = rowString(instructor, 'startAt')
  const instructorEnd = rowString(instructor, 'endAt')
  const volunteerStart = rowString(volunteer, 'startAt')
  const volunteerEnd = rowString(volunteer, 'endAt')

  return {
    ...program,
    ...(participantStart !== undefined ? { applicationStartDate: participantStart } : {}),
    ...(participantEnd !== undefined ? { applicationEndDate: participantEnd } : {}),
    ...(instructorStart !== undefined ? { instructorApplicationStartDate: instructorStart } : {}),
    ...(instructorEnd !== undefined ? { instructorApplicationEndDate: instructorEnd } : {}),
    ...(volunteerStart !== undefined ? { volunteerApplicationStartDate: volunteerStart } : {}),
    ...(volunteerEnd !== undefined ? { volunteerApplicationEndDate: volunteerEnd } : {}),
    generalCommonInfo: {
      ...program.generalCommonInfo,
      participantRecruitmentInfo: patchNestedFromRow(
        program.generalCommonInfo?.participantRecruitmentInfo as
          | Record<string, unknown>
          | undefined,
        participant
      ),
      instructorRecruitmentInfo: patchNestedFromRow(
        program.generalCommonInfo?.instructorRecruitmentInfo as Record<string, unknown> | undefined,
        instructor
      ),
      volunteerRecruitmentInfo: patchNestedFromRow(
        program.generalCommonInfo?.volunteerRecruitmentInfo as Record<string, unknown> | undefined,
        volunteer,
        { interview: true }
      ),
    } as Program['generalCommonInfo'],
  }
}

export function pickAudienceRecruitmentWindow(
  program: Program,
  audience: RecruitmentCopyAudience
): ProgramRecruitmentWindow | undefined {
  return pickRecruitmentCopyRow(program, audience)
}

/** GET에 recruitments[]가 있으면 nested 라벨은 표시에 쓰지 않는다. */
export function hasRecruitmentWindows(program: Program): boolean {
  return (program.programRecruitments?.length ?? 0) > 0
}
