import { mapFormBindingToRegisteredSurvey } from '@/features/program/general/api/adapters/program-survey-adapters'
import { loadFormTemplateVersionDraftByVersionId } from '@/features/template/api/admin-form-templates-service'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import {
  buildProgramSurveyFormEditTarget,
  type ProgramSurveyFormEditTarget,
} from '@/features/program/shared/lib/survey-management/save-program-survey-form-edit'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

export type ProgramSurveyFormEditPayload = {
  target: ProgramSurveyFormEditTarget
  initialDraft: WritingFormDraft
}

export type LoadProgramSurveyFormEditResult =
  | { ok: true; edit: ProgramSurveyFormEditPayload }
  | { ok: false; message: string }

export async function loadProgramSurveyFormEditAfterBinding(
  programId: string,
  binding: ProgramFormBindingResponse,
  templateDefinitionId: string
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
  return {
    ok: true,
    edit: { target, initialDraft: record.draft },
  }
}

export function programSurveyFormEditTargetFromBinding(
  programId: string,
  binding: ProgramFormBindingResponse
): ProgramSurveyFormEditTarget | null {
  const survey = mapFormBindingToRegisteredSurvey(binding, 0)
  return buildProgramSurveyFormEditTarget(programId, survey)
}
