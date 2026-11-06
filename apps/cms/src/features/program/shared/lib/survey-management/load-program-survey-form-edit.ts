import { mapFormBindingToRegisteredSurvey } from '@/features/program/general/api/adapters/program-survey-adapters'
import { fetchProgramPlannedEducationSlots } from '@/features/program/general/lib/program-planned-education-slots'
import { loadFormTemplateVersionDraftByVersionId } from '@/features/template/api/admin-form-templates-service'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import {
  buildProgramSurveyFormEditTarget,
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

export function programSurveyFormEditTargetFromBinding(
  programId: string,
  binding: ProgramFormBindingResponse
): ProgramSurveyFormEditTarget | null {
  const survey = mapFormBindingToRegisteredSurvey(binding, 0)
  return buildProgramSurveyFormEditTarget(programId, survey)
}
