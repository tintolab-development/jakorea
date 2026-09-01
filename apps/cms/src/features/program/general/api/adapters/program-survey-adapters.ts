import dayjs from 'dayjs'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type { ProgramSurveyResponse } from '@/shared/api/generated/dashboard/schemas/programSurveyResponse'
import type { SurveyAnswerResponse } from '@/shared/api/generated/dashboard/schemas/surveyAnswerResponse'
import type { SurveyResponseDetailResponse } from '@/shared/api/generated/dashboard/schemas/surveyResponseDetailResponse'
import type { SurveyResponseListItemResponse } from '@/shared/api/generated/dashboard/schemas/surveyResponseListItemResponse'
import {
  GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE,
  type GeneralSatisfactionAudienceKey,
} from '@/features/program/general/lib/survey-audience'
import { LECTURE_EVAL_TEMPLATE_ID } from '@/features/program/shared/lib/survey-management/lecture-eval-survey'
import type {
  RegisteredSurvey,
  SurveyPollRawResponse,
  SurveyProgressStatus,
} from '@/features/program/shared/lib/survey-management/survey-management-types'

export type ClassifiedFormBindingKind = 'poll' | 'satisfaction' | 'lecture_evaluation'

export type ClassifiedFormBinding = {
  kind: ClassifiedFormBindingKind
  satisfactionAudience?: GeneralSatisfactionAudienceKey
  binding: ProgramFormBindingResponse
  survey: RegisteredSurvey
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

export function mapProgramSurveyToRegisteredSurvey(
  dto: ProgramSurveyResponse,
  index: number,
  binding?: ProgramFormBindingResponse
): RegisteredSurvey {
  return {
    id: String(dto.templateVersionId ?? dto.templateId ?? index),
    title: dto.templateName?.trim() || dto.versionLabel?.trim() || binding?.templateName?.trim() || '설문',
    templateId: String(dto.templateId ?? binding?.templateId ?? ''),
    status: resolveSurveyStatusFromBinding(binding),
    responseCount: dto.responseCount ?? dto.submittedCount ?? binding?.submittedCount ?? 0,
    participantTotal: binding?.submittedCount ?? dto.submittedCount ?? 0,
    bindingId: binding?.bindingId != null ? String(binding.bindingId) : undefined,
  }
}

export function mapFormBindingToRegisteredSurvey(
  binding: ProgramFormBindingResponse,
  index: number
): RegisteredSurvey {
  return {
    id: String(binding.templateVersionId ?? binding.templateId ?? binding.bindingId ?? index),
    title: binding.templateName?.trim() || binding.versionLabel?.trim() || '설문',
    templateId: String(binding.templateId ?? ''),
    status: resolveSurveyStatusFromBinding(binding),
    responseCount: binding.submittedCount ?? 0,
    participantTotal: binding.submittedCount ?? 0,
    bindingId: binding.bindingId != null ? String(binding.bindingId) : undefined,
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
  const templateId = String(binding.templateId ?? '').trim()
  if (templateId === LECTURE_EVAL_TEMPLATE_ID) return 'lecture_evaluation'
  if (SATISFACTION_TEMPLATE_TO_AUDIENCE.has(templateId)) return 'satisfaction'
  // code-style ids (survey-teacher 등) may arrive as numeric BE ids — also check templateName
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
  if (role.includes('VOLUNTEER') && role.includes('H2')) return 'volunteer_h2'
  if (role.includes('VOLUNTEER')) return 'volunteer_h1'
  if (role.includes('INDIVIDUAL') || role.includes('MEMBER')) return 'individual'
  return undefined
}

export function classifyProgramFormBindings(
  bindings: ProgramFormBindingResponse[]
): ClassifiedFormBinding[] {
  return bindings
    .filter(b => b.active !== false)
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

export function parseAnswerPreviewJson(raw: string | undefined | null): Record<string, string> {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value == null) continue
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        out[key] = String(value)
        continue
      }
      if (typeof value === 'object' && value !== null) {
        const obj = value as { displayText?: unknown; value?: unknown; answer?: unknown }
        const display =
          obj.displayText ?? obj.value ?? obj.answer ?? JSON.stringify(value)
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
        if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean') {
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
  const fromDetail = mapSurveyAnswersToRecord(detail?.answers)
  const fromPreview = parseAnswerPreviewJson(item.answerPreviewJson)
  const answers = Object.keys(fromDetail).length > 0 ? fromDetail : fromPreview

  return {
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

/** preview answers가 비어 있으면 detail fetch가 필요 */
export function surveyResponseNeedsDetail(item: SurveyResponseListItemResponse): boolean {
  const preview = parseAnswerPreviewJson(item.answerPreviewJson)
  return Object.keys(preview).length === 0 && item.formResponseId != null
}

export function mergeSurveysWithBindings(
  surveys: ProgramSurveyResponse[],
  bindings: ProgramFormBindingResponse[]
): RegisteredSurvey[] {
  const bindingByVersion = new Map<string, ProgramFormBindingResponse>()
  const bindingByTemplate = new Map<string, ProgramFormBindingResponse>()
  for (const binding of bindings) {
    if (binding.active === false) continue
    if (binding.templateVersionId != null) {
      bindingByVersion.set(String(binding.templateVersionId), binding)
    }
    if (binding.templateId != null) {
      bindingByTemplate.set(String(binding.templateId), binding)
    }
  }

  const fromSurveys = surveys.map((dto, index) => {
    const binding =
      (dto.templateVersionId != null
        ? bindingByVersion.get(String(dto.templateVersionId))
        : undefined) ??
      (dto.templateId != null ? bindingByTemplate.get(String(dto.templateId)) : undefined)
    return mapProgramSurveyToRegisteredSurvey(dto, index, binding)
  })

  // surveys에 없고 binding만 있는 poll 항목 보강
  const seenVersions = new Set(fromSurveys.map(s => s.id))
  const seenTemplates = new Set(fromSurveys.map(s => s.templateId).filter(Boolean))
  const extras: RegisteredSurvey[] = []
  for (const classified of classifyProgramFormBindings(bindings)) {
    if (classified.kind !== 'poll') continue
    const versionId = String(classified.binding.templateVersionId ?? '')
    const templateId = String(classified.binding.templateId ?? '')
    if (versionId && seenVersions.has(versionId)) continue
    if (templateId && seenTemplates.has(templateId)) continue
    extras.push(classified.survey)
  }

  return [...fromSurveys, ...extras]
}
