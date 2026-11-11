import { mapFormBindingToRegisteredSurvey } from '@/features/program/general/api/adapters/program-survey-adapters'
import { fetchProgramPlannedEducationSlots } from '@/features/program/general/lib/program-planned-education-slots'
import { loadFormTemplateVersionDraftByVersionId } from '@/features/template/api/admin-form-templates-service'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  buildProgramSurveyFormEditTarget,
  type ProgramSurveyFormCreatePlan,
  type ProgramSurveyFormEditTarget,
} from '@/features/program/shared/lib/survey-management/save-program-survey-form-edit'
import { isSatisfactionPerScheduleWritingPeriodLocked } from '@/features/program/shared/lib/survey-management/satisfaction-binding-contract'
import {
  applySurveyTitleCustomPeriodToDraft,
  resolveSatisfactionFormEditPeriod,
  type ResolveSatisfactionFormEditPeriodContext,
  type SatisfactionFormEditPeriod,
  type SatisfactionFormEditSchedule,
} from '@/features/program/shared/lib/survey-management/satisfaction-form-edit-period'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

export type ProgramSurveyFormEditPayload = {
  target: ProgramSurveyFormEditTarget
  initialDraft: WritingFormDraft
  displayPeriod?: SatisfactionFormEditPeriod | null
  lockWritingPeriodInput?: boolean
  /** 신규 등록 — 에디터 「저장」 때 프로그램 전용 양식을 게시하고 이 요청으로 바인딩을 만든다. */
  create?: ProgramSurveyFormCreatePlan
}

export type LoadProgramSurveyFormEditResult =
  | { ok: true; edit: ProgramSurveyFormEditPayload }
  | { ok: false; message: string }

export async function loadProgramSurveyFormEditAfterBinding(
  programId: string,
  binding: ProgramFormBindingResponse,
  templateDefinitionId: string,
  options?: {
    schedules?: ReadonlyArray<SatisfactionFormEditSchedule>
  } & ResolveSatisfactionFormEditPeriodContext
): Promise<LoadProgramSurveyFormEditResult> {
  const survey = mapFormBindingToRegisteredSurvey(binding, 0)
  const target = buildProgramSurveyFormEditTarget(programId, survey)
  if (target == null) {
    return {
      ok: false,
      message: '등록된 설문을 편집할 수 없습니다. 목록을 확인해 주세요.',
    }
  }
  const versionId = target.sourceVersionId
  const record = await loadFormTemplateVersionDraftByVersionId(
    templateDefinitionId,
    versionId
  )
  if (record?.draft == null) {
    return {
      ok: false,
      message: '설문 양식을 불러오지 못했습니다. 다시 시도해 주세요.',
    }
  }
  let schedules = options?.schedules ?? []
  const isSatisfaction =
    binding.formType?.trim().toUpperCase() === 'SATISFACTION' || options?.windowDays != null
  if (isSatisfaction && schedules.length === 0) {
    schedules = await fetchProgramPlannedEducationSlots(programId)
  }
  const period = resolveSatisfactionFormEditPeriod(binding, schedules, {
    windowDays: options?.windowDays,
    targetScope: options?.targetScope,
    targetScopeId: options?.targetScopeId,
  })
  return {
    ok: true,
    edit: {
      target,
      initialDraft: applySurveyTitleCustomPeriodToDraft(record.draft, period),
      displayPeriod: period,
      lockWritingPeriodInput: isSatisfactionPerScheduleWritingPeriodLocked({
        formType: binding.formType,
        runMode: binding.satisfactionRunMode,
        targetScope: options?.targetScope ?? binding.targetScope,
      }),
    },
  }
}

/**
 * 설문조사·만족도조사·강의평가 신규 등록 — 바인딩을 만들지 않고 에디터만 연다.
 * 등록 모달에서 고른 템플릿 version을 원본으로 쓰고, 바인딩 요청은 저장 때까지 들고 있는다.
 * 기간: 만족도조사는 일정 기준 기간을 미리 채우고, 설문조사·강의평가는 양식에 저장된 기간을 그대로 보여 준다.
 */
export async function loadProgramSurveyFormEditForCreate(
  programId: string,
  bindings: ReadonlyArray<ProgramFormBindingRequest>,
  templateDefinitionId: string,
  createBinding: ProgramSurveyFormCreatePlan['createBinding'],
  options?: {
    title?: string
    schedules?: ReadonlyArray<SatisfactionFormEditSchedule>
  } & ResolveSatisfactionFormEditPeriodContext
): Promise<LoadProgramSurveyFormEditResult> {
  const last = bindings.at(-1)
  const sourceVersionId = Number(last?.templateVersionId)
  if (last == null || !Number.isInteger(sourceVersionId) || sourceVersionId <= 0) {
    return { ok: false, message: '설문 양식 버전을 찾지 못했습니다. 다시 시도해 주세요.' }
  }
  const record = await loadFormTemplateVersionDraftByVersionId(templateDefinitionId, sourceVersionId)
  if (record?.draft == null) {
    return { ok: false, message: '설문 양식을 불러오지 못했습니다. 다시 시도해 주세요.' }
  }
  const formType = last.formType?.trim().toUpperCase()
  const bindingLike = last as unknown as ProgramFormBindingResponse
  let period: SatisfactionFormEditPeriod | null = null
  if (formType === 'SATISFACTION') {
    let schedules = options?.schedules ?? []
    if (schedules.length === 0) schedules = await fetchProgramPlannedEducationSlots(programId)
    period = resolveSatisfactionFormEditPeriod(bindingLike, schedules, {
      windowDays: options?.windowDays,
      targetScope: options?.targetScope ?? last.targetScope ?? undefined,
      targetScopeId: options?.targetScopeId ?? last.targetScopeId ?? undefined,
    })
  }
  const lockWritingPeriodInput = isSatisfactionPerScheduleWritingPeriodLocked({
    formType: last.formType,
    runMode: (last as { satisfactionRunMode?: string | null }).satisfactionRunMode,
    targetScope: options?.targetScope ?? last.targetScope,
  })
  const title =
    options?.title?.trim() ||
    findWritingTemplateRowByDefinitionId(templateDefinitionId)?.templateName?.trim() ||
    '설문'
  return {
    ok: true,
    edit: {
      target: { programId, bindingId: '', sourceVersionId, title },
      initialDraft:
        period != null ? applySurveyTitleCustomPeriodToDraft(record.draft, period) : record.draft,
      displayPeriod: period,
      lockWritingPeriodInput,
      create: {
        bindings: [...bindings],
        keepBindingPeriods: lockWritingPeriodInput,
        createBinding,
      },
    },
  }
}

export function programSurveyFormEditTargetFromBinding(
  programId: string,
  binding: ProgramFormBindingResponse
): ProgramSurveyFormEditTarget | null {
  const survey = mapFormBindingToRegisteredSurvey(binding, 0)
  return buildProgramSurveyFormEditTarget(programId, survey)
}
