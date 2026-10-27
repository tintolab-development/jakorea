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
import {
  buildVolunteerInterviewConfigForRowSave,
  volunteerInterviewRequiredFromOverlay,
  type RecruitmentInterviewConfig,
} from '@/features/program/shared/lib/volunteer-interview-config'
import { normalizeVolunteerTargetList } from '@/features/program/shared/lib/program-detail-info-constants'
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
): string | null | undefined {
  const fromPatch = (key: keyof Program, value: DateValue | null | undefined) =>
    Object.prototype.hasOwnProperty.call(patch, key)
      ? (optionalDateToApiString(value) ?? null)
      : undefined
  if (audience === 'instructor') {
    const value = fromPatch('instructorApplicationStartDate', patch.instructorApplicationStartDate)
    return value !== undefined ? value : (row.startAt ?? undefined)
  }
  if (audience === 'volunteer') {
    const value = fromPatch('volunteerApplicationStartDate', patch.volunteerApplicationStartDate)
    return value !== undefined ? value : (row.startAt ?? undefined)
  }
  const value = fromPatch('applicationStartDate', patch.applicationStartDate)
  return value !== undefined ? value : (row.startAt ?? undefined)
}

function windowEndForAudience(
  audience: RecruitmentCopyAudience,
  patch: Partial<Program>,
  row: ProgramRecruitmentWindow
): string | null | undefined {
  const fromPatch = (key: keyof Program, value: DateValue | null | undefined) =>
    Object.prototype.hasOwnProperty.call(patch, key)
      ? (optionalDateToApiString(value) ?? null)
      : undefined
  if (audience === 'instructor') {
    const value = fromPatch('instructorApplicationEndDate', patch.instructorApplicationEndDate)
    return value !== undefined ? value : (row.endAt ?? undefined)
  }
  if (audience === 'volunteer') {
    const value = fromPatch('volunteerApplicationEndDate', patch.volunteerApplicationEndDate)
    return value !== undefined ? value : (row.endAt ?? undefined)
  }
  const value = fromPatch('applicationEndDate', patch.applicationEndDate)
  return value !== undefined ? value : (row.endAt ?? undefined)
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
  // 모집 행 계약에서 null은 유지, 빈 문자열은 비움이다.
  body[key] = value ?? ''
}

function assignOptionalDate(
  body: ProgramRecruitmentRequest,
  clearFields: string[],
  key: 'startAt' | 'endAt' | 'operationStartDate' | 'operationEndDate',
  value: string | null | undefined
): void {
  if (value === undefined) return
  if (value === null) {
    if (!clearFields.includes(key)) clearFields.push(key)
    return
  }
  body[key] = value
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/** ISO·날짜 문자열 → KST 달력 날짜(YYYY-MM-DD). 읽을 수 없으면 undefined. */
function kstDateKey(value: string | null | undefined): string | undefined {
  const text = value?.trim()
  if (!text) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const ms = Date.parse(text)
  if (Number.isNaN(ms)) return undefined
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 10)
}

/** 행 면접 기간 형식 — 시작 KST 00:00:00.000, 끝 KST 23:59:59.999(UTC ISO). */
function kstDateToRowIso(dateKey: string, edge: 'start' | 'end'): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const ms =
    edge === 'start'
      ? Date.UTC(y, m - 1, d, 0, 0, 0, 0) - KST_OFFSET_MS
      : Date.UTC(y, m - 1, d, 23, 59, 59, 999) - KST_OFFSET_MS
  return new Date(ms).toISOString()
}

type InterviewPeriodField = 'interviewStartDate' | 'interviewEndDate'

/**
 * 구 GENERAL 봉사 행(행 면접 기간 null) backfill 출처 — BE SQL backfill 과 같은 순서(keonhee 2026-10-25 23:1x):
 * 1. 조회 nested `volunteerInterviewScheduleInfo.periodStartDate/EndDate`(KST 날짜 → 행 형식)
 * 2. 없으면 nested `volunteerRecruitmentInfo.interviewStartDate/EndDate`
 * 둘 다 없으면 undefined — 화면 기본값 등으로 날짜를 새로 만들지 않는다.
 */
function volunteerInterviewBackfillSource(
  baseline: Program,
  field: InterviewPeriodField
): string | undefined {
  const schedule =
    baseline.volunteerInterviewScheduleInfoFromServer ??
    baseline.generalCommonInfo?.volunteerInterviewScheduleInfo
  const scheduleKey = kstDateKey(
    field === 'interviewStartDate' ? schedule?.periodStartDate : schedule?.periodEndDate
  )
  if (scheduleKey)
    return kstDateToRowIso(scheduleKey, field === 'interviewStartDate' ? 'start' : 'end')
  const info = baseline.generalCommonInfo?.volunteerRecruitmentInfo as
    | Partial<Record<InterviewPeriodField, string>>
    | undefined
  const nested = info?.[field]
  return typeof nested === 'string' && nested.trim() ? nested.trim() : undefined
}

/**
 * 행 PATCH 면접 기간. patch 에 값이 있으면 그 값, 없으면 행 값(null 은 생략 = BE 유지).
 * 일반 봉사 행이 비어 있을 때(구 GENERAL, 기간은 nested 에만 — keonhee 2026-10-25):
 * - 폼 기간이 비어 있으면('' / null) 보내지 않는다.
 * - 폼 기간이 조회 nested 값(폼 초기값) 그대로면 BE backfill 과 같은 출처(`volunteerInterviewBackfillSource`)로 채운다.
 * - 폼에서 날짜를 바꿨으면 그 값을 보낸다(사용자 입력).
 * 행에 값이 있을 때 비우면 '' 로 지운다.
 */
function volunteerInterviewPeriodForRowSave(
  audience: RecruitmentCopyAudience,
  patch: Partial<Program>,
  field: InterviewPeriodField,
  rowValue: string | null | undefined,
  isGeneralVolunteerRow: boolean,
  baseline: Program
): string | null | undefined {
  if (audience !== 'volunteer' || !Object.prototype.hasOwnProperty.call(patch, field)) {
    return rowValue ?? undefined
  }
  const next = optionalDateToApiString(patch[field]) ?? null
  if (!isGeneralVolunteerRow || rowValue?.trim()) return next
  if (next === null) return undefined
  const seeded = (
    baseline.generalCommonInfo?.volunteerRecruitmentInfo as
      | Partial<Record<InterviewPeriodField, string>>
      | undefined
  )?.[field]
  if (kstDateKey(next) !== kstDateKey(seeded)) return next
  return volunteerInterviewBackfillSource(baseline, field)
}

function normalizedVolunteerCodes(value: readonly string[] | null | undefined): string[] {
  if (!value?.length) return []
  return normalizeVolunteerTargetList(value)
}

function sameVolunteerCodes(
  left: readonly string[] | null | undefined,
  right: readonly string[] | null | undefined
): boolean {
  const a = normalizedVolunteerCodes(left)
  const b = normalizedVolunteerCodes(right)
  if (a.length !== b.length) return false
  return a.every((code, index) => code === b[index])
}

/**
 * 일반 봉사 탭은 폼 `volunteerTargets`를 행에 복사하지 않는다.
 * 행을 이번 저장에서 바꾸지 않았고 폼이 행과 다르면 폼 값을 보낸다.
 * UJAT는 저장 전에 행을 매핑해 두므로 그 행 값을 유지한다.
 */
function volunteerTargetsForRowSave(args: {
  row: ProgramRecruitmentWindow
  baseline: Program
  patch: Partial<Program>
  volunteerHalf?: 'h1' | 'h2'
}): ProgramRecruitmentWindow['volunteerTargets'] {
  const baselineRow = pickRecruitmentCopyRow(args.baseline, 'volunteer', args.volunteerHalf)
  const rowUntouched = sameVolunteerCodes(args.row.volunteerTargets, baselineRow?.volunteerTargets)
  const formTargets = args.patch.volunteerTargets
  const formDiffersFromRow =
    formTargets !== undefined && !sameVolunteerCodes(formTargets, args.row.volunteerTargets)
  if (rowUntouched && formDiffersFromRow) return formTargets
  return args.row.volunteerTargets
}

export function buildProgramRecruitmentRowSaveRequest(args: {
  baseline: Program
  draft: Program
  patch: Partial<Program>
  audience: RecruitmentCopyAudience
  volunteerHalf?: 'h1' | 'h2'
}): ProgramRecruitmentRowSaveRequest | null {
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
  // 면접 ON/OFF → 행 interviewEnabled. 폼 값이 patch 에 없으면 이번 저장 overlay 의 면접 여부(일반 봉사만, UJAT 반기 행은 제외).
  const isGeneralVolunteerRow =
    audience === 'volunteer' &&
    volunteerHalf == null &&
    (source.backendProgramType ?? '').toUpperCase() !== 'UJAT' &&
    row.recruitTerm !== ProgramRecruitmentRequestRecruitTerm.FIRST_HALF &&
    row.recruitTerm !== ProgramRecruitmentRequestRecruitTerm.SECOND_HALF
  const interviewStartAt = volunteerInterviewPeriodForRowSave(
    audience,
    patch,
    'interviewStartDate',
    row.interviewStartAt,
    isGeneralVolunteerRow,
    baseline
  )
  const interviewEndAt = volunteerInterviewPeriodForRowSave(
    audience,
    patch,
    'interviewEndDate',
    row.interviewEndAt,
    isGeneralVolunteerRow,
    baseline
  )
  const requestedInterviewEnabled =
    audience === 'volunteer'
      ? (patch.generalVolunteerInterviewEnabled ??
        (isGeneralVolunteerRow
          ? volunteerInterviewRequiredFromOverlay(patch.registrationOverlay)
          : undefined) ??
        row.interviewEnabled)
      : row.interviewEnabled
  // UJAT 봉사 운영 행은 면접을 끌 수 없다(keonhee 2026-10-25, BE UJAT_VOLUNTEER_INTERVIEW_REQUIRED) — false 는 행 값 유지.
  const interviewEnabled =
    audience === 'volunteer' &&
    requestedInterviewEnabled === false &&
    (source.backendProgramType ?? '').toUpperCase() === 'UJAT'
      ? row.interviewEnabled
      : requestedInterviewEnabled

  const body: ProgramRecruitmentRowSaveRequest = {
    id: row.id,
    recruitmentType,
  }
  const clearFields: string[] = []
  const applicationType = applicationTypeOf(row)
  if (applicationType) body.applicationType = applicationType
  if (row.targetType) body.targetType = row.targetType
  assignOptionalDate(body, clearFields, 'startAt', startAt)
  assignOptionalDate(body, clearFields, 'endAt', endAt)
  assignOptionalDate(
    body,
    clearFields,
    'operationStartDate',
    Object.prototype.hasOwnProperty.call(row, 'operationStartDate')
      ? row.operationStartDate
      : undefined
  )
  assignOptionalDate(
    body,
    clearFields,
    'operationEndDate',
    Object.prototype.hasOwnProperty.call(row, 'operationEndDate') ? row.operationEndDate : undefined
  )
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
  const typedBody = body as ProgramRecruitmentRequest & Record<string, unknown>
  if (row.announcementPublished != null) {
    typedBody.announcementPublished = row.announcementPublished
  }
  if (row.remarksNotApplicable != null) {
    typedBody.remarksNotApplicable = row.remarksNotApplicable
  }
  if (typeof row.contentRevision === 'number') {
    typedBody.expectedRevision = row.contentRevision
  }
  if (audience === 'volunteer') {
    if (row.documentPassAnnouncementAt !== undefined) {
      typedBody.documentPassAnnouncementAt = row.documentPassAnnouncementAt
    }
    if (row.finalPassAnnouncementAt !== undefined) {
      typedBody.finalPassAnnouncementAt = row.finalPassAnnouncementAt
    }
    if (row.noticeExposureTiming !== undefined) {
      typedBody.noticeExposureTiming = row.noticeExposureTiming
    }
    const volunteerTargets = volunteerTargetsForRowSave({
      row,
      baseline,
      patch,
      volunteerHalf,
    })
    if (volunteerTargets !== undefined) {
      typedBody.volunteerTargets = volunteerTargets
    }
    // 일반 봉사 행 interviewConfig 는 overlay+저장 typed 합본만 보낸다(객체 단위 교체).
    // UJAT·반기는 행 값을 유지한다.
    if (row.interviewConfig !== undefined && !isGeneralVolunteerRow) {
      const interviewConfig = row.interviewConfig
      typedBody.interviewConfig =
        interviewConfig == null
          ? null
          : {
              ...interviewConfig,
              exclusionState: interviewConfig.exclusionState ?? undefined,
            }
    }
  }
  const overlayInterviewConfig = volunteerInterviewConfigForRowSave({
    source,
    row,
    patch,
    audience,
    volunteerHalf,
    recruitmentType,
  })
  if (overlayInterviewConfig) typedBody.interviewConfig = overlayInterviewConfig
  if (clearFields.length > 0) body.clearFields = clearFields
  return body
}

/** 생성 타입에 아직 없는 BE V80 `interviewConfig`(봉사 행 전용)를 더한 행 PATCH 본문 */
export type ProgramRecruitmentRowSaveRequest = ProgramRecruitmentRequest & {
  interviewConfig?: RecruitmentInterviewConfig
}

/**
 * 일반 봉사 행 저장 — 저장된 typed(`volunteerInterviewConfigFromServer`)에 이번 저장 overlay 의 면접 키를 합친 전체
 * interviewConfig 를 함께 보낸다. UJAT 반기 행·overlay 가 없거나 면접 키가 없는 저장에는 넣지 않는다(서버 typed 값 유지).
 */
function volunteerInterviewConfigForRowSave(args: {
  source: Program
  row: ProgramRecruitmentWindow
  patch: Partial<Program>
  audience: RecruitmentCopyAudience
  volunteerHalf?: 'h1' | 'h2'
  recruitmentType: string
}): RecruitmentInterviewConfig | undefined {
  if (args.audience !== 'volunteer' || args.volunteerHalf) return undefined
  if (args.recruitmentType !== ProgramRecruitmentRequestRecruitmentType.VOLUNTEER) return undefined
  if (args.row.recruitTerm === 'FIRST_HALF' || args.row.recruitTerm === 'SECOND_HALF')
    return undefined
  if ((args.source.backendProgramType ?? '').toUpperCase() === 'UJAT') return undefined
  const overlay = args.patch.registrationOverlay
  if (!overlay || typeof overlay !== 'object') return undefined
  // 저장 typed + 폼 변경을 합친 전체 객체(BE 는 객체 단위 교체). overlay 에 면접 키가 없으면 보내지 않는다.
  return buildVolunteerInterviewConfigForRowSave(
    overlay as Record<string, unknown>,
    args.source.volunteerInterviewConfigFromServer as RecruitmentInterviewConfig | null | undefined
  )
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
  'announcementPublished',
  'documentPassAnnouncementAt',
  'finalPassAnnouncementAt',
  'noticeExposureTiming',
  'volunteerTargets',
  'remarksNotApplicable',
  'interviewConfig',
  'contentRevision',
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
    if (value === undefined) continue
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
    audienceColumnOntoRow(
      overlayDefinedRowFields(base, patchRow, AUDIENCE_ROW_KEYS),
      patch,
      audience
    ),
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
    // 재조회 컬럼이 옛 targetLevels면 다음 편집 시드가 방금 저장한 교육 대상을 되돌린다.
    ...(Object.prototype.hasOwnProperty.call(patch, 'targetLevels')
      ? {
          targetLevels: Array.isArray(patch.targetLevels) ? patch.targetLevels : [],
          targetLevel: Array.isArray(patch.targetLevels) ? patch.targetLevels[0] : undefined,
        }
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
    // 면접 일정 표시 객체는 재조회한 프로그램 GET 값이 정본(BE가 typed interviewConfig 로 만든다).
    // patch 의 overlay 계산 값으로 덮지 않는다.
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
