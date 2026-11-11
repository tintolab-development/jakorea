import dayjs from 'dayjs'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type { ProgramSurveyResponse } from '@/shared/api/generated/dashboard/schemas/programSurveyResponse'
import type { SurveyAnswerResponse } from '@/shared/api/generated/dashboard/schemas/surveyAnswerResponse'
import type { SurveyResponseDetailResponse } from '@/shared/api/generated/dashboard/schemas/surveyResponseDetailResponse'
import type { SurveyResponseListItemResponse } from '@/shared/api/generated/dashboard/schemas/surveyResponseListItemResponse'
import type { SurveySummaryResponse } from '@/shared/api/generated/dashboard/schemas/surveySummaryResponse'
import {
  GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE,
  type GeneralSatisfactionAudienceKey,
} from '@/features/program/general/lib/survey-audience'
import { SURVEY_ESSAY_QUESTION_TYPES } from '@/features/program/shared/lib/survey-management/aggregate-survey-poll-results'
import { LECTURE_EVAL_TEMPLATE_ID } from '@/features/program/shared/lib/survey-management/lecture-eval-survey'
import type {
  RegisteredSurvey,
  SurveyPollRawResponse,
  SurveyProgressStatus,
  SurveyQuestionOptionCount,
  SurveyResultQuestionSummary,
} from '@/features/program/shared/lib/survey-management/survey-management-types'
import {
  mapSatisfactionProgressStatus,
  readSatisfactionBindingFields,
} from '@/features/program/shared/lib/survey-management/satisfaction-binding-contract'

export type ClassifiedFormBindingKind = 'poll' | 'satisfaction' | 'lecture_evaluation'

export type ClassifiedFormBinding = {
  kind: ClassifiedFormBindingKind
  satisfactionAudience?: GeneralSatisfactionAudienceKey
  binding: ProgramFormBindingResponse
  survey: RegisteredSurvey
}

/** 설문 관리 탭에서 create/delete 시 사용하는 binding formType */
const PROGRAM_SURVEY_MANAGEMENT_FORM_TYPES = new Set([
  'SURVEY',
  'SATISFACTION',
  'SATISFACTION_SURVEY',
  'PROGRAM_SATISFACTION',
  'LECTURE_EVALUATION',
])

/** autoApplyDefaultFormBindings 등 프로그램 운영용 binding — 설문 목록에서 제외 */
const PROGRAM_OPERATIONAL_FORM_BINDING_TYPES = new Set([
  'REGISTRATION',
  'RECRUITMENT',
  'APPLICATION',
  'AGREEMENT',
  'ISSUANCE',
  // 강의보고서는 설문 관리 목록이 아닌 강의보고서 전용 화면에서 관리한다.
  'LECTURE_REPORT',
  'CERTIFICATE',
  'PROGRAM',
])

function normalizeProgramFormBindingType(formType: string | undefined): string {
  return formType?.trim().toUpperCase() ?? ''
}

/** 설문 관리(설문조사·만족도·강의평가) 대상 binding인지 */
export function isProgramSurveyManagementFormBinding(binding: ProgramFormBindingResponse): boolean {
  const formType = normalizeProgramFormBindingType(binding.formType)
  if (formType && PROGRAM_SURVEY_MANAGEMENT_FORM_TYPES.has(formType)) {
    return true
  }
  if (formType && PROGRAM_OPERATIONAL_FORM_BINDING_TYPES.has(formType)) {
    return false
  }
  // 서버가 제공한 formType이 없거나 알 수 없는 값이면 설문으로 추정하지 않는다.
  return false
}

type SurveyShareLinkClipboardSource = {
  shareToken?: string | null
  accessMode?: string | null
  formPath?: string | null
  submitPath?: string | null
}

function readPublicSurveyShareToken(response: SurveyShareLinkClipboardSource): string | null {
  const direct = response.shareToken?.trim()
  if (direct) return direct
  const formPath = response.formPath?.trim() ?? ''
  const match = /\/public\/surveys\/([^/?#]+)/i.exec(formPath)
  const fromPath = match?.[1]?.trim()
  if (!fromPath) return null
  try {
    return decodeURIComponent(fromPath)
  } catch {
    return fromPath
  }
}

export function resolveSurveyShareClipboardUrl(
  response: SurveyShareLinkClipboardSource,
  platformOrigin: string | null | undefined
): string | null {
  const accessMode = response.accessMode?.trim().toUpperCase()
  if (accessMode === 'MEMBER_AUTHENTICATED') return null
  const token = readPublicSurveyShareToken(response)
  if (!token) return null
  if (accessMode && accessMode !== 'PUBLIC_ANONYMOUS') return null
  const origin = platformOrigin?.trim().replace(/\/$/, '')
  if (!origin) return null
  return `${origin}/surveys/share/${encodeURIComponent(token)}`
}

export function describeSurveyShareClipboardFailure(
  response: SurveyShareLinkClipboardSource | null | undefined,
  platformOrigin: string | null | undefined,
  kind: 'survey' | 'satisfaction' = 'survey'
): string {
  const subject = kind === 'satisfaction' ? '만족도조사' : '설문'
  if (response?.accessMode?.trim().toUpperCase() === 'MEMBER_AUTHENTICATED') {
    const memberPaths = [response.formPath, response.submitPath]
      .map(path => path?.trim())
      .filter((path): path is string => Boolean(path))
    const pathHint =
      memberPaths.length > 0 ? ` 회원 전용 경로: ${memberPaths.join(' · ')}` : ''
    return `회원 전용 ${subject}는 비로그인 공유 링크를 만들 수 없습니다.${pathHint}`
  }
  const origin = platformOrigin?.trim()
  if (!origin) {
    return '사용자 홈페이지 주소(VITE_PLATFORM_PUBLIC_ORIGIN)가 없어 공유 링크를 만들지 못했습니다. CMS 환경 변수를 확인한 뒤 개발 서버를 다시 시작해 주세요.'
  }
  if (!response || !readPublicSurveyShareToken(response)) {
    return '공개 공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }
  return '공개 공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

type SurveyExpectedRespondentSource = {
  expectedRespondentCount?: number | null
}

export function readExpectedRespondentCount(source: unknown): number | null {
  if (source == null || typeof source !== 'object') return null
  const value = (source as SurveyExpectedRespondentSource).expectedRespondentCount
  if (value == null) return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.trunc(n)
}

export function resolveSurveyResultsParticipantTotal(
  survey: Pick<RegisteredSurvey, 'participantTotal' | 'expectedRespondentCount'>,
  programTotal: number | undefined
): number {
  if (survey.expectedRespondentCount != null) return survey.expectedRespondentCount
  if (programTotal != null && programTotal > 0) return programTotal
  return survey.participantTotal
}

function resolveSurveyStatusFromBinding(
  binding: ProgramFormBindingResponse | undefined
): SurveyProgressStatus {
  if (!binding) return 'in_progress'
  const now = dayjs()
  const start = binding.submissionStartAt ? dayjs(binding.submissionStartAt) : null
  const end = binding.submissionEndAt ? dayjs(binding.submissionEndAt) : null
  if (start?.isValid() && now.isBefore(start)) return 'before_start'
  if (end?.isValid() && now.isAfter(end)) return 'finished'
  return 'in_progress'
}

function resolveMappedExpectedRespondentCount(
  binding?: ProgramFormBindingResponse,
  dto?: ProgramSurveyResponse
): number | null {
  return readExpectedRespondentCount(binding) ?? readExpectedRespondentCount(dto)
}

export function mapProgramSurveyToRegisteredSurvey(
  dto: ProgramSurveyResponse,
  index: number,
  binding?: ProgramFormBindingResponse
): RegisteredSurvey {
  const expectedRespondentCount = resolveMappedExpectedRespondentCount(binding, dto)
  return {
    id: String(dto.templateVersionId ?? dto.templateId ?? index),
    title:
      dto.templateName?.trim() ||
      dto.versionLabel?.trim() ||
      binding?.templateName?.trim() ||
      '설문',
    templateId: String(dto.templateId ?? binding?.templateId ?? ''),
    status: mapSatisfactionProgressStatus(binding, resolveSurveyStatusFromBinding(binding)),
    responseCount: dto.responseCount ?? dto.submittedCount ?? binding?.submittedCount ?? 0,
    participantTotal: expectedRespondentCount ?? 0,
    expectedRespondentCount,
    bindingId:
      binding?.bindingId != null
        ? String(binding.bindingId)
        : dto.bindingId != null
          ? String(dto.bindingId)
          : undefined,
    ...satisfactionSurveyMeta(binding),
  }
}

function satisfactionSurveyMeta(
  binding?: ProgramFormBindingResponse
): Pick<
  RegisteredSurvey,
  | 'targetScope'
  | 'targetScopeId'
  | 'targetScopeLabel'
  | 'displayDeadlineAt'
  | 'submissionEndAt'
  | 'resultDownloadable'
  | 'satisfactionRunMode'
  | 'satisfactionWindowDays'
  | 'startAtLocked'
> {
  if (!binding) return {}
  const extra = readSatisfactionBindingFields(binding)
  return {
    targetScope: binding.targetScope ?? null,
    targetScopeId: binding.targetScopeId ?? null,
    targetScopeLabel: binding.targetScopeLabel ?? null,
    displayDeadlineAt: extra.displayDeadlineAt,
    ...(binding.submissionEndAt ? { submissionEndAt: binding.submissionEndAt } : {}),
    resultDownloadable: extra.resultDownloadable,
    satisfactionRunMode: extra.satisfactionRunMode ?? null,
    satisfactionWindowDays: extra.satisfactionWindowDays ?? null,
    startAtLocked: extra.startAtLocked ?? null,
  }
}

export function mapFormBindingToRegisteredSurvey(
  binding: ProgramFormBindingResponse,
  index: number
): RegisteredSurvey {
  const expectedRespondentCount = readExpectedRespondentCount(binding)
  return {
    id: String(binding.templateVersionId ?? binding.templateId ?? binding.bindingId ?? index),
    title: binding.templateName?.trim() || binding.versionLabel?.trim() || '설문',
    templateId: String(binding.templateId ?? ''),
    status: mapSatisfactionProgressStatus(binding, resolveSurveyStatusFromBinding(binding)),
    responseCount: binding.submittedCount ?? 0,
    participantTotal: expectedRespondentCount ?? 0,
    expectedRespondentCount,
    bindingId: binding.bindingId != null ? String(binding.bindingId) : undefined,
    ...satisfactionSurveyMeta(binding),
  }
}

const SATISFACTION_TEMPLATE_TO_AUDIENCE = (() => {
  const map = new Map<string, GeneralSatisfactionAudienceKey>()
  for (const [audience, templateId] of Object.entries(GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE)) {
    if (!map.has(templateId)) {
      map.set(templateId, audience as GeneralSatisfactionAudienceKey)
    }
  }
  return map
})()

export function classifyFormBindingByTemplateId(
  binding: ProgramFormBindingResponse
): ClassifiedFormBindingKind {
  // 등록 슬롯은 formType 기준이다. 템플릿 이름(만족도·강의평가)으로 빼면
  // 설문조사 탭은 비는데 같은 SURVEY 슬롯 재등록은 서버가 거절한다.
  const formType = normalizeProgramFormBindingType(binding.formType)
  if (formType === 'LECTURE_EVALUATION') return 'lecture_evaluation'
  if (
    formType === 'SATISFACTION' ||
    formType === 'SATISFACTION_SURVEY' ||
    formType === 'PROGRAM_SATISFACTION'
  ) {
    return 'satisfaction'
  }
  if (formType === 'SURVEY') return 'poll'

  const templateId = String(binding.templateId ?? '').trim()
  if (templateId === LECTURE_EVAL_TEMPLATE_ID) return 'lecture_evaluation'
  if (SATISFACTION_TEMPLATE_TO_AUDIENCE.has(templateId)) return 'satisfaction'
  const name = (binding.templateName ?? '').toLowerCase()
  if (name.includes('강의평가') || name.includes('lecture')) return 'lecture_evaluation'
  if (name.includes('만족도') || name.includes('satisfaction')) return 'satisfaction'
  return 'poll'
}

export function resolveSatisfactionAudienceFromBinding(
  binding: ProgramFormBindingResponse
): GeneralSatisfactionAudienceKey | undefined {
  const templateId = String(binding.templateId ?? '').trim()
  const byTemplate = SATISFACTION_TEMPLATE_TO_AUDIENCE.get(templateId)
  if (byTemplate) return byTemplate

  const role = (binding.targetRole ?? binding.targetType ?? '').toUpperCase()
  if (role.includes('TEACHER') || role.includes('INSTRUCTOR')) return 'teacher'
  if (role.includes('STUDENT')) return 'student'
  if (role.includes('VOLUNTEER')) {
    const termId = Number(binding.targetScopeId)
    if (binding.targetScope === 'TERM' && termId === 2) return 'volunteer_h2'
    if (binding.targetScope === 'TERM' && termId === 1) return 'volunteer_h1'
    if (role.includes('H2')) return 'volunteer_h2'
    if (role.includes('H1')) return 'volunteer_h1'
    return 'volunteer_h1'
  }
  if (role.includes('INDIVIDUAL') || role.includes('MEMBER')) return 'individual'
  if (role.includes('ORGANIZATION') || role.includes('SCHOOL')) return 'teacher'
  return undefined
}

export function classifyProgramFormBindings(
  bindings: ProgramFormBindingResponse[]
): ClassifiedFormBinding[] {
  return bindings
    .filter(b => b.active !== false && isProgramSurveyManagementFormBinding(b))
    .map((binding, index) => {
      const kind = classifyFormBindingByTemplateId(binding)
      return {
        kind,
        satisfactionAudience:
          kind === 'satisfaction' ? resolveSatisfactionAudienceFromBinding(binding) : undefined,
        binding,
        survey: mapFormBindingToRegisteredSurvey(binding, index),
      }
    })
}

export function groupSatisfactionSurveysByAudience(
  classified: readonly ClassifiedFormBinding[],
  fallbackAudience: GeneralSatisfactionAudienceKey
): Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey[]>> {
  const grouped: Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey[]>> = {}
  for (const item of classified) {
    if (item.kind !== 'satisfaction') continue
    const audience = item.satisfactionAudience ?? fallbackAudience
    const list = grouped[audience] ?? []
    list.push(item.survey)
    grouped[audience] = list
  }
  return grouped
}

export function parseAnswerPreviewJson(raw: string | undefined | null): Record<string, string> {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      // 서버 형식: [{ questionKey, questionLabel, answerDisplayText }] — 최대 5문항, PII 문항은 null
      const out: Record<string, string> = {}
      for (const row of parsed) {
        if (!row || typeof row !== 'object') continue
        const { questionKey, answerDisplayText } = row as {
          questionKey?: unknown
          answerDisplayText?: unknown
        }
        if (typeof questionKey !== 'string' || !questionKey.trim()) continue
        if (answerDisplayText == null) continue
        const text = String(answerDisplayText).trim()
        if (text) out[questionKey.trim()] = text
      }
      return out
    }
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value == null) continue
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        out[key] = String(value)
        continue
      }
      if (typeof value === 'object' && value !== null) {
        const obj = value as { displayText?: unknown; value?: unknown; answer?: unknown }
        const display = obj.displayText ?? obj.value ?? obj.answer ?? JSON.stringify(value)
        out[key] = String(display)
      }
    }
    return out
  } catch {
    return {}
  }
}

export function mapSurveyAnswersToRecord(
  answers: SurveyAnswerResponse[] | undefined | null
): Record<string, string> {
  if (!answers?.length) return {}
  const out: Record<string, string> = {}
  for (const answer of answers) {
    const key = answer.questionKey?.trim() || String(answer.questionId ?? '')
    if (!key) continue
    let text = answer.answerDisplayText?.trim() || ''
    if (!text && answer.answerValueJson?.trim()) {
      try {
        const parsed = JSON.parse(answer.answerValueJson) as unknown
        if (
          typeof parsed === 'string' ||
          typeof parsed === 'number' ||
          typeof parsed === 'boolean'
        ) {
          text = String(parsed)
        } else {
          text = answer.answerValueJson.trim()
        }
      } catch {
        text = answer.answerValueJson.trim()
      }
    }
    if (text) out[key] = text
  }
  return out
}

export function mapSurveyResponseListItemToPollResponse(
  item: SurveyResponseListItemResponse,
  detail?: SurveyResponseDetailResponse | null
): SurveyPollRawResponse {
  // `includeAnswers=true` 목록의 `item.answers`는 단건 상세 `answers`와 동일 — 같은 mapper로 전문을 채운다
  const fromDetail = mapSurveyAnswersToRecord(detail?.answers ?? item.answers)
  const fromPreview = parseAnswerPreviewJson(item.answerPreviewJson)
  const answers = Object.keys(fromDetail).length > 0 ? fromDetail : fromPreview
  const submittedByAdminId = item.submittedByAdminId ?? detail?.submittedByAdminId

  return {
    ...(submittedByAdminId != null ? { submittedByAdminId } : {}),
    respondentId: String(item.formResponseId ?? detail?.formResponseId ?? ''),
    respondentName:
      item.submittedByMemberName?.trim() ||
      item.submittedByAdminName?.trim() ||
      detail?.submittedByMemberName?.trim() ||
      detail?.submittedByAdminName?.trim() ||
      `응답 ${item.formResponseId ?? ''}`,
    addressRegion: '',
    answers,
  }
}

type ParsedSurveySummaryJson = {
  topAnswers?: unknown
  options?: unknown
}

function parseSurveySummaryJson(raw: string | undefined): ParsedSurveySummaryJson | null {
  if (raw == null || raw.trim() === '') return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed != null && typeof parsed === 'object' ? (parsed as ParsedSurveySummaryJson) : null
  } catch {
    return null
  }
}

function toSurveyQuestionOptionCount(raw: unknown): SurveyQuestionOptionCount | null {
  if (raw == null || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  if (row.value == null) return null
  const value = String(row.value)
  const label = typeof row.label === 'string' && row.label.trim() ? row.label : value
  const displayOrder = Number(row.displayOrder)
  const count = Number(row.count)
  return {
    value,
    label,
    displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
    count: Number.isFinite(count) ? count : 0,
  }
}

/** OpenAPI 재생성 전 — 백엔드 2026-10-07 추가 필드 */
type SurveySummaryRow = SurveySummaryResponse & {
  questionDisplayOrder?: number | null
  requiredYn?: boolean | null
}

/**
 * summary 행 → 결과 화면 문항 목록 (서버 정렬 = 게시 version 단락 순서, 그대로 유지).
 * `options`는 `summaryJson.options` 키가 있는 문항(공개 선택형)에만 채운다.
 */
export function mapSurveySummaryToQuestionSummaries(
  rows: SurveySummaryRow[] | null | undefined
): SurveyResultQuestionSummary[] {
  const questions: SurveyResultQuestionSummary[] = []
  for (const row of rows ?? []) {
    const questionKey = row.questionKey?.trim()
    if (!questionKey) continue
    const parsed = parseSurveySummaryJson(row.summaryJson)
    const displayOrder = row.questionDisplayOrder
    questions.push({
      questionKey,
      questionLabel: row.questionLabel?.trim() ?? '',
      questionType: row.questionType?.trim().toUpperCase() ?? '',
      displayOrder:
        typeof displayOrder === 'number' && Number.isFinite(displayOrder) ? displayOrder : null,
      required: row.requiredYn === true,
      ...(parsed != null && Array.isArray(parsed.options)
        ? {
            options: parsed.options
              .map(toSurveyQuestionOptionCount)
              .filter((option): option is SurveyQuestionOptionCount => option != null),
          }
        : {}),
    })
  }
  return questions
}

/** 주관식 답이 1건이라도 있을 때만(summary `topAnswers` 비어 있지 않음) 응답 상세로 주관식 표를 채운다 */
export function surveySummaryHasPublicTextAnswers(
  rows: SurveySummaryResponse[] | null | undefined
): boolean {
  return (rows ?? []).some(row => {
    if (!SURVEY_ESSAY_QUESTION_TYPES.has(row.questionType?.trim().toUpperCase() ?? '')) return false
    const parsed = parseSurveySummaryJson(row.summaryJson)
    return Array.isArray(parsed?.topAnswers) && parsed.topAnswers.length > 0
  })
}

export function isLectureEvalSurveyListRow(dto: ProgramSurveyResponse): boolean {
  const name = `${dto.templateName ?? ''} ${dto.versionLabel ?? ''}`.toLowerCase()
  return name.includes('강의평가') || name.includes('lecture eval')
}

export type SurveyTemplateOptionKind = 'survey' | 'satisfaction' | 'lecture'

const SATISFACTION_TEMPLATE_CODES = new Set<string>(
  Object.values(GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE)
)

type SurveyTemplateOptionRow = {
  id: string
  templateName: string
  /** 복제본의 최초 카탈로그 원본 code (양식 목록 API) */
  baseTemplateCode?: string
}

function resolveSurveyTemplateKindByCode(code: string): SurveyTemplateOptionKind | null {
  if (code === LECTURE_EVAL_TEMPLATE_ID) return 'lecture'
  if (SATISFACTION_TEMPLATE_CODES.has(code)) return 'satisfaction'
  return null
}

/** 양식 관리 「설문」 카테고리 행의 용도 — 원본 코드(`baseTemplateCode` 포함) 우선, 없으면 이름으로 판별 */
export function resolveSurveyTemplateOptionKind(
  row: SurveyTemplateOptionRow
): SurveyTemplateOptionKind {
  const byCode =
    resolveSurveyTemplateKindByCode(row.id.trim()) ??
    resolveSurveyTemplateKindByCode(row.baseTemplateCode?.trim() ?? '')
  if (byCode != null) return byCode
  if (row.baseTemplateCode?.trim() && row.baseTemplateCode.trim() !== row.id.trim()) {
    return 'survey'
  }
  const name = row.templateName.toLowerCase()
  if (name.includes('강의평가') || name.includes('lecture eval')) return 'lecture'
  if (name.includes('만족도') || name.includes('satisfaction')) return 'satisfaction'
  return 'survey'
}

/** 등록 모달 종류(설문조사·만족도조사·강의평가)에 맞는 템플릿만 후보로 둔다 */
export function isSurveyTemplateOptionForKind(
  row: SurveyTemplateOptionRow,
  kind: SurveyTemplateOptionKind
): boolean {
  return resolveSurveyTemplateOptionKind(row) === kind
}

export function resolveLectureEvalSubmitContext(input: {
  binding?: ProgramFormBindingResponse | null
  surveyDto?: ProgramSurveyResponse | null
}): { contextType: 'SCHEDULE' | 'PROGRAM'; contextId?: number } {
  const scope = input.binding?.targetScope ?? input.surveyDto?.targetScope
  const id = input.binding?.targetScopeId ?? input.surveyDto?.targetScopeId
  if (scope === 'SCHEDULE' && id != null && Number.isFinite(id) && id > 0) {
    return { contextType: 'SCHEDULE', contextId: Math.trunc(id) }
  }
  return {
    contextType: 'PROGRAM',
    contextId: id != null && Number.isFinite(id) && id > 0 ? Math.trunc(id) : undefined,
  }
}

export function pickLectureEvalSurveyFromRemote(input: {
  classified: ClassifiedFormBinding[]
  surveys: ProgramSurveyResponse[]
}): RegisteredSurvey | null {
  const lectureBindings = input.classified.filter(item => item.kind === 'lecture_evaluation')
  const programScope = lectureBindings.find(
    item => (item.binding.targetScope ?? '').trim().toUpperCase() === 'PROGRAM'
  )
  if (programScope) return programScope.survey
  const fromBinding = lectureBindings[0]
  if (fromBinding) return fromBinding.survey
  const dto = input.surveys.find(isLectureEvalSurveyListRow)
  if (dto == null) return null
  return mapProgramSurveyToRegisteredSurvey(dto, 0)
}

export function mergeSurveysWithBindings(
  surveys: ProgramSurveyResponse[],
  bindings: ProgramFormBindingResponse[]
): RegisteredSurvey[] {
  const surveyBindings = bindings.filter(
    binding => binding.active !== false && isProgramSurveyManagementFormBinding(binding)
  )

  const bindingByVersion = new Map<string, ProgramFormBindingResponse>()
  const bindingByTemplate = new Map<string, ProgramFormBindingResponse>()
  for (const binding of surveyBindings) {
    if (binding.templateVersionId != null) {
      bindingByVersion.set(String(binding.templateVersionId), binding)
    }
    if (binding.templateId != null) {
      bindingByTemplate.set(String(binding.templateId), binding)
    }
  }

  const fromSurveys = surveys
    .map((dto, index) => {
      const binding =
        (dto.templateVersionId != null
          ? bindingByVersion.get(String(dto.templateVersionId))
          : undefined) ??
        (dto.templateId != null ? bindingByTemplate.get(String(dto.templateId)) : undefined)
      return mapProgramSurveyToRegisteredSurvey(dto, index, binding)
    })

  // 설문 목록은 /surveys 응답을 단일 원천으로 사용한다.
  // /form-bindings에만 존재하는 운영 바인딩을 설문 목록으로 보강하지 않는다.
  return fromSurveys
}
