import type { FormResponseAnswerResponse } from '@/shared/api/generated/forms-surveys/schemas/formResponseAnswerResponse'
import type { FormResponseResponse } from '@/shared/api/generated/forms-surveys/schemas/formResponseResponse'
import type { OrganizationApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationDetailResponse'
import type {
  ApplicantInstitutionDetailExtend,
  ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { formatPreviousYearParticipationLabel } from '@/features/program/general/api/adapters/general-applications-adapters'
import {
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_METHOD_OPTIONS,
  INSTITUTION_SEX_OFFENSE_CONSENT_SITE_SUBMISSION_OPTIONS,
  INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_OPTIONS,
} from '@/features/template/lib/institution-sex-offense-consent-field-definitions'

const BASIC_INFO_PARAGRAPH_KEYS = [
  'program-application-trained-teachers-seed-basic-info',
  'program-application-institution-seed-basic-info',
  'program-application-economy-seed-basic-info',
] as const

const GUIDANCE_PARAGRAPH_KEYS = [
  'program-application-institution-seed-guidance',
  'program-application-economy-seed-guidance',
] as const

const SEX_OFFENSE_SUBMISSION_KEYS = [
  'program-application-institution-seed-sex-offense-consent-submission',
  'program-application-economy-seed-sex-offense-consent-submission',
] as const

const SEX_OFFENSE_INQUIRY_KEYS = [
  'program-application-institution-seed-sex-offense-consent-inquiry',
  'program-application-economy-seed-sex-offense-consent-inquiry',
] as const

function isJsonContainer(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false
  try {
    const parsed: unknown = JSON.parse(trimmed)
    return parsed != null && typeof parsed === 'object'
  } catch {
    return false
  }
}

export function formatApplicantGradeLabel(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return ''
  if (trimmed.endsWith('학년')) return trimmed
  if (/^\d+$/.test(trimmed)) return `${trimmed}학년`
  return trimmed
}

/**
 * Admin form-response `answerValueJson` 정본 파서.
 * JSON 문자열(`"텍스트"` / `{...}` / `[...]`)을 파싱하고, 파싱 실패 시 원문을 반환한다.
 * `null`·빈 문자열은 값 없음으로 둔다. 기본값을 만들지 않는다.
 */
export function parseAnswerValue(answerValueJson: string | null | undefined): unknown {
  if (!answerValueJson || answerValueJson.trim() === '') return undefined
  try {
    const parsed: unknown = JSON.parse(answerValueJson)
    return parsed === null ? undefined : parsed
  } catch {
    return answerValueJson
  }
}

function serializeParsedAnswer(parsed: unknown): string | undefined {
  if (parsed == null) return undefined
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim()
    return trimmed || undefined
  }
  if (typeof parsed === 'number' && Number.isFinite(parsed)) return String(parsed)
  if (typeof parsed === 'boolean') return String(parsed)
  if (typeof parsed === 'object') return JSON.stringify(parsed)
  return undefined
}

/**
 * form_response answers → questionKey → 문자열 맵.
 * 구조화 답의 정본은 `answerValueJson`이다. displayText는 JSON 대체 소스로 쓰지 않는다.
 */
export function buildFormAnswerMap(
  answers: FormResponseAnswerResponse[] | undefined
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const answer of answers ?? []) {
    const key = answer.questionKeySnapshot?.trim()
    if (!key) continue
    const serialized = serializeParsedAnswer(parseAnswerValue(answer.answerValueJson))
    if (serialized) {
      map[key] = serialized
      continue
    }
    const display = answer.answerDisplayText?.trim()
    if (!display || isJsonContainer(display)) continue
    map[key] = display
  }
  return map
}

function pickAnswer(map: Record<string, string>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = map[key]?.trim()
    if (v) return v
  }
  return undefined
}

function pickAnswerWithNested(
  map: Record<string, string>,
  nested: Record<string, string>,
  ...keys: string[]
): string | undefined {
  return pickAnswer(map, ...keys) ?? pickAnswer(nested, ...keys)
}

function hasCanonicalField(
  canonicalDetail: OrganizationApplicationDetailResponse | null | undefined,
  field: keyof OrganizationApplicationDetailResponse
): boolean {
  return canonicalDetail != null && Object.prototype.hasOwnProperty.call(canonicalDetail, field)
}

function clearDetailFieldsWhenCanonicalValueIsEmpty(
  detail: ApplicantInstitutionDetailExtend,
  canonicalDetail: OrganizationApplicationDetailResponse | null | undefined,
  field: keyof OrganizationApplicationDetailResponse,
  detailFields: (keyof ApplicantInstitutionDetailExtend)[]
): void {
  if (!hasCanonicalField(canonicalDetail, field)) return
  const value = canonicalDetail?.[field]
  const isEmpty = value == null || (typeof value === 'string' && value.trim() === '')
  if (!isEmpty) return
  for (const detailField of detailFields) {
    delete detail[detailField]
  }
}

function parseJsonObject(raw: string | undefined): Record<string, unknown> | null {
  const text = raw?.trim()
  if (!text || !isJsonContainer(text) || !text.startsWith('{')) return null
  try {
    const parsed: unknown = JSON.parse(text)
    if (parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    /* ignore */
  }
  return null
}

function stringFieldsFromObject(object: Record<string, unknown> | null): Record<string, string> {
  if (!object) return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'string' && value.trim()) {
      out[key] = value.trim()
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      out[key] = String(value)
    }
  }
  return out
}

/** Platform/CMS 모집양식 nested basic-info 객체 (빈 detail만 채울 때 사용) */
function parseNestedBasicInfo(map: Record<string, string>): Record<string, string> {
  for (const key of BASIC_INFO_PARAGRAPH_KEYS) {
    const nested = stringFieldsFromObject(parseJsonObject(map[key]))
    if (Object.keys(nested).length > 0) return nested
  }
  for (const [key, raw] of Object.entries(map)) {
    if (!key.includes('seed-basic-info')) continue
    const nested = stringFieldsFromObject(parseJsonObject(raw))
    if (nested.applicationReason || nested.applicationGrade || nested.educationGrade) {
      return nested
    }
  }
  return {}
}

function parseGuidanceRows(map: Record<string, string>): {
  computer?: string
  waiting?: string
  meal?: string
  notes?: string
} {
  const computer = pickAnswer(map, 'computerAvailability', 'computer-in-room', 'computerInRoom')
  const waiting = pickAnswer(map, 'waitingAreaGuide', 'waiting-place', 'waitingRoomLocation')
  const meal = pickAnswer(map, 'mealGuide', 'meal', 'mealNotice')
  const notes = pickAnswer(map, 'otherNotes', 'other-notes', 'parkingInfo')
  if (computer || waiting || meal || notes) {
    return { computer, waiting, meal, notes }
  }

  for (const key of [
    ...GUIDANCE_PARAGRAPH_KEYS,
    ...Object.keys(map).filter(k => k.includes('seed-guidance')),
  ]) {
    const raw = map[key]?.trim()
    if (!raw) continue
    const object = parseJsonObject(raw)
    if (object) {
      const nested = stringFieldsFromObject(object)
      const fromObject = {
        computer:
          nested['computer-in-room'] || nested.computerInRoom || nested.computerAvailability,
        waiting: nested['waiting-place'] || nested.waitingRoomLocation || nested.waitingAreaGuide,
        meal: nested.meal || nested.mealNotice || nested.mealGuide,
        notes: nested['other-notes'] || nested.parkingInfo || nested.otherNotes,
      }
      if (fromObject.computer || fromObject.waiting || fromObject.meal || fromObject.notes) {
        return fromObject
      }
    }
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        return {
          computer: typeof parsed[0] === 'string' ? parsed[0] : undefined,
          waiting: typeof parsed[1] === 'string' ? parsed[1] : undefined,
          meal: typeof parsed[2] === 'string' ? parsed[2] : undefined,
          notes: typeof parsed[3] === 'string' ? parsed[3] : undefined,
        }
      }
    } catch {
      /* ignore */
    }
  }
  return {}
}

function optionLabel(options: readonly { value: string; label: string }[], raw: string): string {
  const trimmed = raw.trim()
  return options.find(option => option.value === trimmed)?.label ?? trimmed
}

function formatSexOffenseSubmissionLabel(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined
  return optionLabel(INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_OPTIONS, raw)
}

function formatSexOffenseInquiryParts(object: Record<string, unknown> | null): string[] {
  if (!object) return []
  const parts: string[] = []
  const method = typeof object.inquiryMethod === 'string' ? object.inquiryMethod : ''
  if (method.trim())
    parts.push(optionLabel(INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_METHOD_OPTIONS, method))

  const site = typeof object.siteSubmission === 'string' ? object.siteSubmission : ''
  if (site.trim())
    parts.push(optionLabel(INSTITUTION_SEX_OFFENSE_CONSENT_SITE_SUBMISSION_OPTIONS, site))

  const institutionId = typeof object.institutionId === 'string' ? object.institutionId.trim() : ''
  if (institutionId) parts.push(`기관 ID ${institutionId}`)
  const verificationNumber =
    typeof object.verificationNumber === 'string' ? object.verificationNumber.trim() : ''
  if (verificationNumber) parts.push(`검증번호 ${verificationNumber}`)
  return parts
}

export function parseSexOffenseCheckRequest(map: Record<string, string>): string | undefined {
  const submissionObject =
    SEX_OFFENSE_SUBMISSION_KEYS.map(key => parseJsonObject(map[key])).find(Boolean) ?? null
  const inquiryObject =
    SEX_OFFENSE_INQUIRY_KEYS.map(key => parseJsonObject(map[key])).find(Boolean) ?? null
  if (!submissionObject && !inquiryObject) return undefined

  const submissionLabel = formatSexOffenseSubmissionLabel(
    typeof submissionObject?.submissionRequest === 'string'
      ? submissionObject.submissionRequest
      : undefined
  )
  const parts = [
    ...(submissionLabel ? [submissionLabel] : []),
    ...formatSexOffenseInquiryParts(inquiryObject),
  ]
  return parts.length > 0 ? parts.join(' | ') : undefined
}

function parseEconomyDisplayFieldsFromForm(map: Record<string, string>): {
  previousYearParticipation?: string
  affiliatedFinancialCompany?: string
} {
  const previousYearParticipation = formatPreviousYearParticipationLabel(
    pickAnswer(map, 'previousYearParticipation', 'application.economy.previousYearParticipation')
  )
  const companyFlat = pickAnswer(
    map,
    'affiliatedFinancialCompany',
    'application.economy.affiliatedFinancialCompany',
    'application.economy.lessonReply.customCompanyName'
  )
  const lessonReply =
    parseJsonObject(map['program-application-economy-seed-lesson-reply']) ??
    parseJsonObject(map['application.economy.lessonReply'])
  const customCompanyName =
    typeof lessonReply?.customCompanyName === 'string' ? lessonReply.customCompanyName.trim() : ''
  const affiliatedFinancialCompany = companyFlat || customCompanyName || undefined
  return {
    ...(previousYearParticipation ? { previousYearParticipation } : {}),
    ...(affiliatedFinancialCompany ? { affiliatedFinancialCompany } : {}),
  }
}

function sessionsFromDesiredEducationDate(
  label: string | undefined
): ParticipatingSchoolSession[] | undefined {
  const text = label?.trim()
  if (!text) return undefined
  return [
    {
      round: 1,
      date: text,
      dayOfWeek: '',
      duration: '',
      format: '',
      classNum: '',
      timeRange: '',
    },
  ]
}

/** form_response answers → 신청 학년 표시문 (기관 기본정보 nested JSON 포함) */
export function readOrganizationApplicationGradeFromFormResponse(
  formResponse: FormResponseResponse | null | undefined
): string {
  const map = buildFormAnswerMap(formResponse?.answers)
  const nestedBasic = parseNestedBasicInfo(map)
  return formatApplicantGradeLabel(
    pickAnswerWithNested(map, nestedBasic, 'applicationGrade', 'educationGrade', 'grade')
  )
}

/**
 * ORGANIZATION_APPLICATION form_response → 기관 신청 상세 필드 hydrate.
 * 목록·상세 DTO 필드는 유지하고, 비어 있는 칸만 form/코멘트로 채운다.
 */
export function hydrateOrganizationApplicationRowFromForm(input: {
  row: ApplicantSchoolRow
  formResponse: FormResponseResponse | null | undefined
  adminComment?: string | null
  /** 기관 상세 DTO가 있으면 명시된 null/빈 값도 정본으로 취급한다. */
  canonicalDetail?: OrganizationApplicationDetailResponse | null
}): ApplicantSchoolRow {
  const { row, formResponse, adminComment, canonicalDetail } = input
  const map = buildFormAnswerMap(formResponse?.answers)
  const hasCanonicalDetailSnapshot = canonicalDetail != null
  /**
   * 상세 DTO가 있으면 선택 필드의 생략/null도 정본의 값 없음으로 취급한다.
   * form_response는 상세 DTO가 없는 레거시 경로에서만 화면 보조값으로 사용한다.
   */
  const nestedBasic = parseNestedBasicInfo(map)
  const guidance = parseGuidanceRows(map)
  const computerFromForm = hasCanonicalDetailSnapshot ? undefined : guidance.computer
  const waitingFromForm = hasCanonicalDetailSnapshot ? undefined : guidance.waiting
  const mealFromForm = hasCanonicalDetailSnapshot ? undefined : guidance.meal
  const notesFromForm = hasCanonicalDetailSnapshot ? undefined : guidance.notes

  const textbookName = hasCanonicalDetailSnapshot
    ? undefined
    : pickAnswerWithNested(map, nestedBasic, 'textbookName')
  const educationGradeFromForm = hasCanonicalDetailSnapshot
    ? undefined
    : formatApplicantGradeLabel(
        pickAnswerWithNested(map, nestedBasic, 'applicationGrade', 'educationGrade', 'grade')
      )
  const regionFromForm = hasCanonicalDetailSnapshot
    ? undefined
    : pickAnswer(map, 'organizationRegion', 'regionLabel')
  const addressDetailFromForm = hasCanonicalDetailSnapshot
    ? undefined
    : pickAnswer(map, 'addressDetail', 'detailAddress', 'address', 'organizationAddress')
  const applicationReason =
    row.detail?.applicationReason?.trim() ||
    (hasCanonicalDetailSnapshot
      ? undefined
      : pickAnswer(map, 'applicationReason') || nestedBasic.applicationReason)
  const otherRequests =
    row.detail?.otherRequests?.trim() ||
    (hasCanonicalDetailSnapshot
      ? undefined
      : pickAnswer(map, 'otherRequests') || nestedBasic.otherRequests)
  // 교육 형태는 canonical 상세 응답만 사용한다. 상세 응답이 없으면 UI에서 '-'로 표시한다.
  const educationType = row.detail?.educationType?.trim()
  const teacherNameFromForm = hasCanonicalDetailSnapshot
    ? undefined
    : pickAnswer(map, 'teacherName')
  const teacherMobileFromForm = hasCanonicalDetailSnapshot
    ? undefined
    : pickAnswer(map, 'teacherMobile', 'teacherPhone')
  const teacherTelFromForm = hasCanonicalDetailSnapshot
    ? undefined
    : pickAnswer(map, 'teacherTel')
  const teacherEmailFromForm = hasCanonicalDetailSnapshot
    ? undefined
    : pickAnswer(map, 'teacherEmail')
  const sexOffenseCheckRequest =
    row.detail?.sexOffenseCheckRequest?.trim() || parseSexOffenseCheckRequest(map)
  const desiredEducationDate = canonicalDetail
    ? undefined
    : pickAnswer(map, 'desiredEducationDate', 'requestedScheduleMemo')
  const economyFromForm = parseEconomyDisplayFieldsFromForm(map)

  const detail: ApplicantInstitutionDetailExtend = {
    ...row.detail,
    ...(textbookName && !row.detail?.textbookName ? { textbookName } : {}),
    ...(addressDetailFromForm && !row.detail?.addressDetail
      ? { addressDetail: addressDetailFromForm }
      : {}),
    ...(applicationReason ? { applicationReason } : {}),
    ...(otherRequests ? { otherRequests } : {}),
    ...(educationType ? { educationType } : {}),
    ...(teacherTelFromForm && !row.detail?.teacherTel
      ? { teacherTel: teacherTelFromForm }
      : {}),
    ...(teacherMobileFromForm && !row.detail?.teacherMobile
      ? { teacherMobile: teacherMobileFromForm }
      : {}),
    ...(teacherEmailFromForm && !row.detail?.teacherEmail
      ? { teacherEmail: teacherEmailFromForm }
      : {}),
    teacherInfo: undefined,
    ...(computerFromForm && !row.detail?.computerInSpace
      ? { computerInSpace: computerFromForm }
      : {}),
    ...(waitingFromForm && !row.detail?.waitingPlaceGuide && !row.detail?.waitingRoom
      ? { waitingPlaceGuide: waitingFromForm, waitingRoom: waitingFromForm }
      : {}),
    ...(mealFromForm && !row.detail?.mealInfo ? { mealInfo: mealFromForm } : {}),
    ...(notesFromForm && !row.detail?.otherSpecialNotes && !row.detail?.parkingInfo
      ? { otherSpecialNotes: notesFromForm, parkingInfo: notesFromForm }
      : {}),
    ...(sexOffenseCheckRequest ? { sexOffenseCheckRequest } : {}),
    ...(!row.detail?.previousYearParticipation &&
    !hasCanonicalDetailSnapshot &&
    economyFromForm.previousYearParticipation
      ? { previousYearParticipation: economyFromForm.previousYearParticipation }
      : {}),
    ...(!row.detail?.affiliatedFinancialCompany &&
    !hasCanonicalDetailSnapshot &&
    economyFromForm.affiliatedFinancialCompany
      ? { affiliatedFinancialCompany: economyFromForm.affiliatedFinancialCompany }
      : {}),
  }
  clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'organizationAddressDetail', [
    'addressDetail',
  ])
  clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'requestedEducationFormat', [
    'educationType',
  ])
  clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'applicationReason', [
    'applicationReason',
  ])
  clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'otherRequests', [
    'otherRequests',
  ])
  clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'computerInRoom', [
    'computerInSpace',
  ])
  clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'waitingRoomLocation', [
    'waitingPlaceGuide',
    'waitingRoom',
  ])
  if (
    !hasCanonicalDetailSnapshot
  ) {
    clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'mealNotice', ['mealInfo'])
  }
  clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'parkingInfo', [
    'parkingInfo',
    'otherSpecialNotes',
  ])
  clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'textbookName', [
    'textbookName',
  ])
  clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'teacherPhone', [
    'teacherPhone',
  ])
  clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'teacherTel', [
    'teacherTel',
  ])
  clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'teacherEmail', [
    'teacherEmail',
  ])
  clearDetailFieldsWhenCanonicalValueIsEmpty(detail, canonicalDetail, 'previousYearParticipation', [
    'previousYearParticipation',
  ])
  clearDetailFieldsWhenCanonicalValueIsEmpty(
    detail,
    canonicalDetail,
    'affiliatedFinancialCompany',
    ['affiliatedFinancialCompany']
  )

  /** 희망 일정 sessions는 Admin requested-schedules SSOT — form으로 채우지 않는다 */
  const sessions =
    row.sessions && row.sessions.length > 0
      ? row.sessions
      : sessionsFromDesiredEducationDate(desiredEducationDate)

  const classCountRaw = pickAnswerWithNested(map, nestedBasic, 'classCount')
  const studentCountRaw = pickAnswerWithNested(map, nestedBasic, 'studentCount', 'totalStudents')
  const classCountParsed = classCountRaw ? Number.parseInt(classCountRaw, 10) : NaN
  const studentCountParsed = studentCountRaw ? Number.parseInt(studentCountRaw, 10) : NaN

  return {
    ...row,
    educationGrade: row.educationGrade?.trim() || educationGradeFromForm || row.educationGrade,
    region: row.region?.trim() || regionFromForm || row.region,
    classCount:
      !hasCanonicalDetailSnapshot &&
      Number.isFinite(classCountParsed) &&
      classCountParsed > 0
        ? classCountParsed
        : row.classCount,
    studentCount:
      !hasCanonicalDetailSnapshot &&
      Number.isFinite(studentCountParsed) &&
      studentCountParsed > 0
        ? studentCountParsed
        : row.studentCount,
    teacherName: row.teacherName?.trim() || teacherNameFromForm || row.teacherName,
    contact: row.contact?.trim() || teacherMobileFromForm || row.contact,
    sessions,
    detail: Object.keys(detail).length > 0 ? detail : row.detail,
    adminComment: adminComment?.trim() || row.adminComment,
  }
}
