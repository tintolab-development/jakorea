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

function nonempty(value: string | null | undefined): string | undefined {
  if (value == null) return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
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
  if (recruitLabel) next.recruitmentPeriodLabel = recruitLabel
  const operationLabel = operationPeriodLabelFromWindow(row)
  if (operationLabel) next.operationPeriodLabel = operationLabel
  const contactName = nonempty(row.contactName)
  if (contactName) {
    next.contactOrganizationName = contactName
    next.contactName = contactName
  }
  const phone = nonempty(row.contactPhone)
  if (phone) {
    next.inquiryTel = phone
    next.contactPhone = phone
  }
  const email = nonempty(row.contactEmail)
  if (email) {
    next.inquiryEmail = email
    next.contactEmail = email
  }
  if (options?.interview) {
    if (row.interviewEnabled != null) next.volunteerInterviewEnabled = row.interviewEnabled
    if (row.interviewStartAt) next.interviewStartDate = row.interviewStartAt
    if (row.interviewEndAt) next.interviewEndDate = row.interviewEndAt
  }
  return next
}

export function hydrateRecruitmentWindowsOntoProgram(program: Program): Program {
  if (!program.programRecruitments?.length) return program

  const participant = pickRecruitmentCopyRow(program, 'participant')
  const instructor = pickRecruitmentCopyRow(program, 'instructor')
  const volunteer = pickRecruitmentCopyRow(program, 'volunteer')

  return {
    ...program,
    ...(nonempty(participant?.startAt) ? { applicationStartDate: participant!.startAt! } : {}),
    ...(nonempty(participant?.endAt) ? { applicationEndDate: participant!.endAt! } : {}),
    ...(nonempty(instructor?.startAt)
      ? { instructorApplicationStartDate: instructor!.startAt! }
      : {}),
    ...(nonempty(instructor?.endAt) ? { instructorApplicationEndDate: instructor!.endAt! } : {}),
    ...(nonempty(volunteer?.startAt)
      ? { volunteerApplicationStartDate: volunteer!.startAt! }
      : {}),
    ...(nonempty(volunteer?.endAt) ? { volunteerApplicationEndDate: volunteer!.endAt! } : {}),
    generalCommonInfo: {
      ...program.generalCommonInfo,
      participantRecruitmentInfo: patchNestedFromRow(
        program.generalCommonInfo?.participantRecruitmentInfo as Record<string, unknown> | undefined,
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
