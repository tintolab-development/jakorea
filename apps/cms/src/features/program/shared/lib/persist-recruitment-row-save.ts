import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { patchProgramRecruitment } from '@/features/program/shared/api/program-recruitment-rows'
import {
  pickRecruitmentCopyRow,
  type RecruitmentCopyAudience,
} from '@/features/program/shared/lib/recruitment-row-copy'
import { resolveRecruitmentApplicationType } from '@/features/program/shared/lib/recruitment-row-request'
import type { ProgramRecruitmentRequest } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequest'
import { ProgramRecruitmentRequestApplicationType } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequestApplicationType'
import { ProgramRecruitmentRequestRecruitmentType } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequestRecruitmentType'
import { ProgramRecruitmentRequestRecruitTerm } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequestRecruitTerm'
import type { DateValue } from '@/types'
import type { Program, ProgramRecruitmentWindow } from '@/types/domain'

function optionalDateToApiString(value: DateValue | null | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

/** 모집 탭 PATCH에서 일정 교체로 해석되는 키를 뺀다. 빈 `rounds: []`도 보내지 않는다. */
export function omitRecruitmentTabScheduleFields(patch: Partial<Program>): Partial<Program> {
  const { rounds: _rounds, ...rest } = patch
  return rest
}

export function parseAdminProgramNumericId(
  programId: string | number | null | undefined
): number | null {
  if (programId == null || programId === '') return null
  const parsed = typeof programId === 'number' ? programId : Number(programId)
  return Number.isFinite(parsed) ? parsed : null
}

/** 1사1교·교육받은 교사는 기존 프로그램 PATCH 유지. 일반·UJAT 모집 탭은 행 단건. */
export function canSaveRecruitmentAsRowPatch(program: Program): boolean {
  if (isCompanySchoolProgram(program)) return false
  if (isTrainedTeachersDetailProgram(program)) return false
  return true
}

function recruitmentTypeForAudience(
  audience: RecruitmentCopyAudience
): ProgramRecruitmentRequestRecruitmentType {
  if (audience === 'instructor') return ProgramRecruitmentRequestRecruitmentType.INSTRUCTOR
  if (audience === 'volunteer') return ProgramRecruitmentRequestRecruitmentType.VOLUNTEER
  return ProgramRecruitmentRequestRecruitmentType.PARTICIPANT
}

function applicationTypeOf(
  row: ProgramRecruitmentWindow
): ProgramRecruitmentRequestApplicationType | undefined {
  const raw = row.applicationType?.toUpperCase()
  if (
    raw === ProgramRecruitmentRequestApplicationType.INDIVIDUAL ||
    raw === ProgramRecruitmentRequestApplicationType.ORGANIZATION ||
    raw === ProgramRecruitmentRequestApplicationType.INSTRUCTOR ||
    raw === ProgramRecruitmentRequestApplicationType.VOLUNTEER
  ) {
    return raw
  }
  const resolved = resolveRecruitmentApplicationType(row.recruitmentType, row.targetType)
  return resolved
}

function windowStartForAudience(
  audience: RecruitmentCopyAudience,
  patch: Partial<Program>,
  row: ProgramRecruitmentWindow
): string | undefined {
  if (audience === 'instructor') {
    return optionalDateToApiString(patch.instructorApplicationStartDate) ?? row.startAt ?? undefined
  }
  if (audience === 'volunteer') {
    return optionalDateToApiString(patch.volunteerApplicationStartDate) ?? row.startAt ?? undefined
  }
  return optionalDateToApiString(patch.applicationStartDate) ?? row.startAt ?? undefined
}

function windowEndForAudience(
  audience: RecruitmentCopyAudience,
  patch: Partial<Program>,
  row: ProgramRecruitmentWindow
): string | undefined {
  if (audience === 'instructor') {
    return optionalDateToApiString(patch.instructorApplicationEndDate) ?? row.endAt ?? undefined
  }
  if (audience === 'volunteer') {
    return optionalDateToApiString(patch.volunteerApplicationEndDate) ?? row.endAt ?? undefined
  }
  return optionalDateToApiString(patch.applicationEndDate) ?? row.endAt ?? undefined
}

function maxCountFromPatch(
  audience: RecruitmentCopyAudience,
  patch: Partial<Program>
): number | undefined {
  if (audience === 'instructor') {
    const value = patch.instructorCapacity ?? patch.instructors
    return typeof value === 'number' ? value : undefined
  }
  if (audience === 'volunteer') {
    const value = patch.generalVolunteers
    return typeof value === 'number' ? value : undefined
  }
  const value = patch.totalParticipants ?? patch.approvedStudentCount
  return typeof value === 'number' ? value : undefined
}

function assignOptionalString(
  body: ProgramRecruitmentRequest,
  key:
    | 'announcementTitle'
    | 'summary'
    | 'programDescription'
    | 'recruitmentGuide'
    | 'applicationMethod'
    | 'learningSupportContent'
    | 'additionalContentHtml'
    | 'remarks'
    | 'otherMatters'
    | 'contactName'
    | 'contactPhone'
    | 'contactEmail'
    | 'interviewStartAt'
    | 'interviewEndAt',
  value: string | null | undefined
): void {
  if (value === undefined) return
  body[key] = value
}

export function buildProgramRecruitmentRowSaveRequest(args: {
  baseline: Program
  draft: Program
  patch: Partial<Program>
  audience: RecruitmentCopyAudience
  volunteerHalf?: 'h1' | 'h2'
}): ProgramRecruitmentRequest | null {
  const { baseline, draft, patch, audience, volunteerHalf } = args
  const source: Program = {
    ...baseline,
    ...draft,
    programRecruitments: draft.programRecruitments ?? baseline.programRecruitments,
  }
  const row =
    pickRecruitmentCopyRow(source, audience, volunteerHalf) ??
    pickRecruitmentCopyRow(baseline, audience, volunteerHalf)
  if (row?.id == null) return null

  const recruitmentTypeRaw = (row.recruitmentType ?? '').toUpperCase()
  const recruitmentType =
    recruitmentTypeRaw === ProgramRecruitmentRequestRecruitmentType.INSTRUCTOR ||
    recruitmentTypeRaw === ProgramRecruitmentRequestRecruitmentType.VOLUNTEER ||
    recruitmentTypeRaw === ProgramRecruitmentRequestRecruitmentType.PARTICIPANT
      ? recruitmentTypeRaw
      : recruitmentTypeForAudience(audience)

  const startAt = windowStartForAudience(audience, patch, row)
  const endAt = windowEndForAudience(audience, patch, row)
  const interviewStartAt =
    audience === 'volunteer'
      ? (optionalDateToApiString(patch.interviewStartDate) ?? row.interviewStartAt ?? undefined)
      : (row.interviewStartAt ?? undefined)
  const interviewEndAt =
    audience === 'volunteer'
      ? (optionalDateToApiString(patch.interviewEndDate) ?? row.interviewEndAt ?? undefined)
      : (row.interviewEndAt ?? undefined)
  const interviewEnabled =
    audience === 'volunteer'
      ? (patch.generalVolunteerInterviewEnabled ?? row.interviewEnabled)
      : row.interviewEnabled

  const body: ProgramRecruitmentRequest = {
    id: row.id,
    recruitmentType,
  }
  const applicationType = applicationTypeOf(row)
  if (applicationType) body.applicationType = applicationType
  if (row.targetType) body.targetType = row.targetType
  if (startAt) body.startAt = String(startAt)
  if (endAt) body.endAt = String(endAt)
  if (row.operationStartDate) body.operationStartDate = String(row.operationStartDate)
  if (row.operationEndDate) body.operationEndDate = String(row.operationEndDate)
  const maxCount = maxCountFromPatch(audience, patch)
  if (typeof maxCount === 'number') body.maxCount = maxCount
  if (
    row.recruitTerm === ProgramRecruitmentRequestRecruitTerm.FIRST_HALF ||
    row.recruitTerm === ProgramRecruitmentRequestRecruitTerm.SECOND_HALF
  ) {
    body.recruitTerm = row.recruitTerm
  }
  assignOptionalString(body, 'announcementTitle', row.announcementTitle)
  assignOptionalString(body, 'summary', row.summary)
  assignOptionalString(body, 'programDescription', row.programDescription)
  assignOptionalString(body, 'recruitmentGuide', row.recruitmentGuide)
  assignOptionalString(body, 'applicationMethod', row.applicationMethod)
  assignOptionalString(body, 'learningSupportContent', row.learningSupportContent)
  assignOptionalString(body, 'additionalContentHtml', row.additionalContentHtml)
  assignOptionalString(body, 'remarks', row.remarks)
  assignOptionalString(body, 'otherMatters', row.otherMatters)
  assignOptionalString(body, 'contactName', row.contactName)
  assignOptionalString(body, 'contactPhone', row.contactPhone)
  assignOptionalString(body, 'contactEmail', row.contactEmail)
  if (interviewEnabled !== undefined && interviewEnabled !== null) {
    body.interviewEnabled = interviewEnabled
  }
  assignOptionalString(body, 'interviewStartAt', interviewStartAt)
  assignOptionalString(body, 'interviewEndAt', interviewEndAt)
  return body
}

export async function persistRecruitmentTabSave(args: {
  baseline: Program
  draft: Program
  patch: Partial<Program>
  audience: RecruitmentCopyAudience
  volunteerHalf?: 'h1' | 'h2'
  refetchProgram: (programId: string) => Promise<Program>
}): Promise<{ mode: 'row'; program: Program } | { mode: 'fallback'; patch: Partial<Program> }> {
  const patch = omitRecruitmentTabScheduleFields(args.patch)
  if (!canSaveRecruitmentAsRowPatch(args.baseline)) {
    return { mode: 'fallback', patch }
  }
  const programNumericId = parseAdminProgramNumericId(args.draft.id ?? args.baseline.id)
  const body = buildProgramRecruitmentRowSaveRequest({ ...args, patch })
  if (programNumericId == null || body?.id == null) {
    return { mode: 'fallback', patch }
  }
  await patchProgramRecruitment(programNumericId, body.id, body)
  const program = await args.refetchProgram(String(args.draft.id ?? args.baseline.id))
  return { mode: 'row', program }
}
