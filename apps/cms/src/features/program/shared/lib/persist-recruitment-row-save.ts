import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { patchProgramRecruitment } from '@/features/program/shared/api/program-recruitment-rows'
import {
  pickRecruitmentCopyRow,
  type RecruitmentCopyAudience,
} from '@/features/program/shared/lib/recruitment-row-copy'
import { resolveRecruitmentApplicationType } from '@/features/program/shared/lib/recruitment-row-request'
import type { ProgramRecruitmentRequest } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequest'
import type { ProgramRecruitmentResponse } from '@/shared/api/generated/dashboard/schemas/programRecruitmentResponse'
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

const AUDIENCE_ROW_KEYS = [
  'startAt',
  'endAt',
  'operationStartDate',
  'operationEndDate',
  'contactName',
  'contactPhone',
  'contactEmail',
  'remarks',
  'otherMatters',
  'announcementTitle',
  'summary',
  'programDescription',
  'recruitmentGuide',
  'applicationMethod',
  'learningSupportContent',
  'additionalContentHtml',
  'interviewEnabled',
  'interviewStartAt',
  'interviewEndAt',
] as const satisfies ReadonlyArray<keyof ProgramRecruitmentWindow>

function nestedInfoKey(
  audience: RecruitmentCopyAudience
): 'participantRecruitmentInfo' | 'instructorRecruitmentInfo' | 'volunteerRecruitmentInfo' {
  if (audience === 'instructor') return 'instructorRecruitmentInfo'
  if (audience === 'volunteer') return 'volunteerRecruitmentInfo'
  return 'participantRecruitmentInfo'
}

function overlayDefinedRowFields(
  row: ProgramRecruitmentWindow,
  source: Partial<ProgramRecruitmentWindow> | ProgramRecruitmentResponse | undefined,
  keys: ReadonlyArray<keyof ProgramRecruitmentWindow>
): ProgramRecruitmentWindow {
  if (!source) return row
  const next: ProgramRecruitmentWindow = { ...row }
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue
    const value = source[key as keyof typeof source]
    if (value === undefined) continue
    ;(next as Record<string, unknown>)[key] = value
  }
  return next
}

function responseRowFields(
  response: ProgramRecruitmentResponse | undefined
): Partial<ProgramRecruitmentWindow> | undefined {
  if (!response) return undefined
  const next: Partial<ProgramRecruitmentWindow> = {}
  for (const key of AUDIENCE_ROW_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(response, key)) continue
    const value = response[key as keyof ProgramRecruitmentResponse]
    if (value === undefined || value === null) continue
    ;(next as Record<string, unknown>)[key] = value
  }
  return next
}

function audienceColumnOntoRow(
  row: ProgramRecruitmentWindow,
  patch: Partial<Program>,
  audience: RecruitmentCopyAudience
): ProgramRecruitmentWindow {
  const next = { ...row }
  if (audience === 'volunteer') {
    const start = optionalDateToApiString(patch.volunteerApplicationStartDate)
    const end = optionalDateToApiString(patch.volunteerApplicationEndDate)
    const interviewStart = optionalDateToApiString(patch.interviewStartDate)
    const interviewEnd = optionalDateToApiString(patch.interviewEndDate)
    if (start) next.startAt = start
    if (end) next.endAt = end
    if (interviewStart) next.interviewStartAt = interviewStart
    if (interviewEnd) next.interviewEndAt = interviewEnd
    if (patch.generalVolunteerInterviewEnabled != null) {
      next.interviewEnabled = patch.generalVolunteerInterviewEnabled
    }
    return next
  }
  if (audience === 'instructor') {
    const start = optionalDateToApiString(patch.instructorApplicationStartDate)
    const end = optionalDateToApiString(patch.instructorApplicationEndDate)
    if (start) next.startAt = start
    if (end) next.endAt = end
    return next
  }
  const start = optionalDateToApiString(patch.applicationStartDate)
  const end = optionalDateToApiString(patch.applicationEndDate)
  if (start) next.startAt = start
  if (end) next.endAt = end
  return next
}

function mergeSavedAudienceRow(
  fetched: Program,
  patch: Partial<Program>,
  audience: RecruitmentCopyAudience,
  volunteerHalf: 'h1' | 'h2' | undefined,
  response: ProgramRecruitmentResponse | undefined
): ProgramRecruitmentWindow[] | undefined {
  const patchProgram: Program = {
    ...fetched,
    programRecruitments: patch.programRecruitments ?? fetched.programRecruitments,
  }
  const patchRow = patch.programRecruitments
    ? pickRecruitmentCopyRow(patchProgram, audience, volunteerHalf)
    : undefined
  const fetchedRow = pickRecruitmentCopyRow(fetched, audience, volunteerHalf)
  const base = fetchedRow ?? patchRow
  const rows = fetched.programRecruitments ?? patch.programRecruitments
  if (!base || !rows?.length) return rows
  const saved = overlayDefinedRowFields(
    audienceColumnOntoRow(overlayDefinedRowFields(base, patchRow, AUDIENCE_ROW_KEYS), patch, audience),
    responseRowFields(response),
    AUDIENCE_ROW_KEYS
  )
  const rowId = response?.id ?? base.id
  const found = rows.some(row => row.id != null && row.id === rowId)
  if (!found) return [...rows, { ...saved, ...(rowId != null ? { id: rowId } : {}) }]
  return rows.map(row => (row.id != null && row.id === rowId ? { ...saved, id: rowId } : row))
}

function audienceScalarPatch(
  patch: Partial<Program>,
  audience: RecruitmentCopyAudience
): Partial<Program> {
  if (audience === 'volunteer') {
    return {
      ...(patch.volunteerApplicationStartDate !== undefined
        ? { volunteerApplicationStartDate: patch.volunteerApplicationStartDate }
        : {}),
      ...(patch.volunteerApplicationEndDate !== undefined
        ? { volunteerApplicationEndDate: patch.volunteerApplicationEndDate }
        : {}),
      ...(patch.generalVolunteerInterviewEnabled !== undefined
        ? { generalVolunteerInterviewEnabled: patch.generalVolunteerInterviewEnabled }
        : {}),
      ...(patch.volunteerTargets !== undefined ? { volunteerTargets: patch.volunteerTargets } : {}),
      ...(patch.volunteerTarget !== undefined ? { volunteerTarget: patch.volunteerTarget } : {}),
      ...(patch.volunteerTargetDetail !== undefined
        ? { volunteerTargetDetail: patch.volunteerTargetDetail }
        : {}),
    }
  }
  if (audience === 'instructor') {
    return {
      ...(patch.instructorApplicationStartDate !== undefined
        ? { instructorApplicationStartDate: patch.instructorApplicationStartDate }
        : {}),
      ...(patch.instructorApplicationEndDate !== undefined
        ? { instructorApplicationEndDate: patch.instructorApplicationEndDate }
        : {}),
      ...(patch.instructorTargets !== undefined
        ? { instructorTargets: patch.instructorTargets }
        : {}),
      ...(patch.instructorTarget !== undefined ? { instructorTarget: patch.instructorTarget } : {}),
      ...(patch.instructorTargetDetail !== undefined
        ? { instructorTargetDetail: patch.instructorTargetDetail }
        : {}),
      ...(patch.finalPassAnnouncementDate !== undefined
        ? { finalPassAnnouncementDate: patch.finalPassAnnouncementDate }
        : {}),
      ...(patch.finalPassAnnouncementMethod !== undefined
        ? { finalPassAnnouncementMethod: patch.finalPassAnnouncementMethod }
        : {}),
    }
  }
  return {
    ...(patch.applicationStartDate !== undefined
      ? { applicationStartDate: patch.applicationStartDate }
      : {}),
    ...(patch.applicationEndDate !== undefined
      ? { applicationEndDate: patch.applicationEndDate }
      : {}),
    ...(patch.resultAnnouncementDate !== undefined
      ? { resultAnnouncementDate: patch.resultAnnouncementDate }
      : {}),
    ...(patch.resultAnnouncementMethod !== undefined
      ? { resultAnnouncementMethod: patch.resultAnnouncementMethod }
      : {}),
    ...(patch.generalParticipantInterviewEnabled !== undefined
      ? { generalParticipantInterviewEnabled: patch.generalParticipantInterviewEnabled }
      : {}),
  }
}

/**
 * 행 PATCH 응답·폼 nested는 저장 정본이다.
 * 직후 프로그램 GET이 옛 `volunteerRecruitmentInfo`를 주면 CMS만 수정 전 값을 보여 준다.
 */
export function applySavedRecruitmentOntoProgram(args: {
  fetched: Program
  draft: Program
  patch: Partial<Program>
  audience: RecruitmentCopyAudience
  volunteerHalf?: 'h1' | 'h2'
  row?: ProgramRecruitmentResponse
}): Program {
  const { fetched, draft, patch, audience, volunteerHalf, row } = args
  const infoKey = nestedInfoKey(audience)
  const fetchedCommon = fetched.generalCommonInfo
  const patchCommon = patch.generalCommonInfo
  const patchInfo = patchCommon?.[infoKey]
  const generalCommonInfo = {
    ...fetchedCommon,
    ...(patchInfo
      ? {
          [infoKey]: {
            ...(fetchedCommon?.[infoKey] ?? {}),
            ...patchInfo,
          },
        }
      : {}),
    ...(audience === 'volunteer' &&
    patchCommon &&
    Object.prototype.hasOwnProperty.call(patchCommon, 'volunteerInterviewScheduleInfo')
      ? { volunteerInterviewScheduleInfo: patchCommon.volunteerInterviewScheduleInfo }
      : {}),
  } as Program['generalCommonInfo']

  return {
    ...fetched,
    ...audienceScalarPatch(patch, audience),
    ...(Object.prototype.hasOwnProperty.call(patch, 'registrationOverlay')
      ? { registrationOverlay: patch.registrationOverlay }
      : {}),
    ujatRegistrationOverlay:
      patch.ujatRegistrationOverlay ??
      draft.ujatRegistrationOverlay ??
      fetched.ujatRegistrationOverlay,
    programRecruitments: mergeSavedAudienceRow(fetched, patch, audience, volunteerHalf, row),
    generalCommonInfo,
  }
}

export async function persistRecruitmentTabSave(args: {
  baseline: Program
  draft: Program
  patch: Partial<Program>
  audience: RecruitmentCopyAudience
  volunteerHalf?: 'h1' | 'h2'
  refetchProgram: (programId: string) => Promise<Program>
  /** 원격 SSOT 모드에서는 재조회한 API 응답을 로컬 draft/patch와 병합하지 않는다. */
  remoteResponsePriority?: boolean
  /** 행 PATCH 이후·재조회 전. nested·overlay를 프로그램에 남긴다. 실패해도 행 저장은 유지한다. */
  beforeRefetch?: () => Promise<void>
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
  const row = await patchProgramRecruitment(programNumericId, body.id, body)
  try {
    await args.beforeRefetch?.()
  } catch (error) {
    console.error('[program] recruitment nested snapshot save failed', error)
  }
  const fetched = await args.refetchProgram(String(args.draft.id ?? args.baseline.id))
  if (args.remoteResponsePriority) {
    return { mode: 'row', program: fetched }
  }
  return {
    mode: 'row',
    program: applySavedRecruitmentOntoProgram({
      fetched,
      draft: args.draft,
      patch,
      audience: args.audience,
      volunteerHalf: args.volunteerHalf,
      row,
    }),
  }
}
