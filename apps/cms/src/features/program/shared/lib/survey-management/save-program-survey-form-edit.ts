import {
  fetchAdminProgramFormBindingsRemote,
  updateAdminProgramFormBindingRemote,
} from '@/features/program/general/api/programs-api-client'
import { readSurveySubmissionPeriodFromSchema } from '@/features/program/shared/lib/survey-management/resolve-published-survey-binding'
import { validateSurveyWritingDraft } from '@/features/program/shared/lib/survey-management/survey-writing-draft'
import { writingFormDraftToSchemaJson } from '@/features/template/api/adapters/form-template-draft-adapters'
import { publishFormTemplateVersionById } from '@/features/template/api/admin-form-templates-service'
import {
  copyFormTemplateVersionRemote,
  fetchFormTemplateVersionRemote,
  updateFormTemplateRemote,
  updateFormTemplateVersionRemote,
} from '@/features/template/api/form-templates-api-client'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas'
import {
  extractApiErrorMessage,
  getApiErrorCode,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'
import {
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

/** 프로그램 설문 바인딩 1건의 양식 수정 대상 */
export type ProgramSurveyFormEditTarget = {
  programId: string
  bindingId: string
  /** 현재 바인딩된 PUBLISHED version */
  sourceVersionId: number
  title: string
}

/** 원격 바인딩(bindingId + 숫자 version id)이 있을 때만 프로그램 전용 수정 대상이 된다 */
export function buildProgramSurveyFormEditTarget(
  programId: string,
  survey: { id: string; title: string; bindingId?: string }
): ProgramSurveyFormEditTarget | null {
  const bindingId = survey.bindingId?.trim()
  const sourceVersionId = Number(survey.id)
  if (!bindingId || !Number.isInteger(sourceVersionId) || sourceVersionId <= 0) return null
  return { programId, bindingId, sourceVersionId, title: survey.title }
}

export const PROGRAM_SURVEY_FORM_EDIT_LOCKED_MESSAGE =
  '진행 중이거나 응답이 있는 설문은 양식을 수정할 수 없습니다.'

/** 서버 교체 가드와 동일: 진행 전 + 응답 0건 */
export function isProgramSurveyFormEditable(
  binding: Pick<ProgramFormBindingResponse, 'progressStatus' | 'submittedCount'> | undefined
): boolean {
  return binding?.progressStatus === 'BEFORE_START' && (binding.submittedCount ?? 0) === 0
}

/** 목록 행 기준 「양식 수정」 노출 — 진행 전 + 응답 0건 */
export function canEditRegisteredSurveyForm(
  survey: { status: string; responseCount: number }
): boolean {
  return survey.status === 'before_start' && survey.responseCount === 0
}

export type ProgramSurveyFormEditFailure = {
  message: string
  /** 서버 바인딩 상태가 화면과 달라졌으므로 목록 재조회가 필요하다. */
  refetchBindings: boolean
}

/** `undefined`면 공통 저장 실패 문구를 쓴다. */
export function resolveProgramSurveyFormEditFailure(
  error: unknown
): ProgramSurveyFormEditFailure | undefined {
  const code = getApiErrorCode(error)
  if (code === 'FORM_BINDING_TEMPLATE_LOCKED') {
    return {
      message: extractApiErrorMessage(
        (error as { response?: { data?: unknown } }).response?.data,
        { fallback: PROGRAM_SURVEY_FORM_EDIT_LOCKED_MESSAGE }
      ),
      refetchBindings: true,
    }
  }
  if (code === 'FORM_BINDING_FORM_TYPE_IMMUTABLE') {
    return { message: '같은 유형의 양식으로만 교체할 수 있습니다.', refetchBindings: false }
  }
  if (code === 'FORM_TEMPLATE_COPY_OWNER_CONFLICT') {
    console.error('[program-survey-form-edit] copy owner conflict', error)
    return { message: '양식 저장 중 오류가 발생했습니다. 다시 시도해 주세요.', refetchBindings: false }
  }
  if (getApiErrorHttpStatus(error) === 403) {
    return { message: '이 프로그램의 양식을 수정할 권한이 없습니다.', refetchBindings: false }
  }
  return undefined
}

export type ProgramSurveyFormEditResult =
  | { ok: true; templateId: number; templateVersionId: number }
  | { ok: false; message: string; refetchBindings?: boolean; incompleteKeys?: readonly string[] }

/**
 * 프로그램 설문 양식 수정 — 바인딩된 PUBLISHED version은 수정 불가(409)이고,
 * 같은 템플릿에 새 version을 게시하면 다른 프로그램이 쓰는 version이 ARCHIVED된다.
 * 그래서 바인딩 version을 프로그램 전용 DRAFT 복제본으로 만들어 저장·게시하고 이 바인딩만 교체한다.
 * 양식 관리 원본 템플릿은 바꾸지 않는다.
 */
export async function saveProgramSurveyFormEdit(
  target: ProgramSurveyFormEditTarget,
  draft: WritingFormDraft
): Promise<ProgramSurveyFormEditResult> {
  const validation = validateSurveyWritingDraft(draft)
  if (!validation.ok) return validation

  // PATCH가 409(FORM_BINDING_TEMPLATE_LOCKED)면 게시된 복제본만 남으므로 copy 전에 확인한다.
  const bindings = await fetchAdminProgramFormBindingsRemote(target.programId)
  const binding = bindings.find(item => String(item.bindingId) === target.bindingId)
  if (!isProgramSurveyFormEditable(binding)) {
    return { ok: false, message: PROGRAM_SURVEY_FORM_EDIT_LOCKED_MESSAGE, refetchBindings: true }
  }

  const source = await fetchFormTemplateVersionRemote(target.sourceVersionId)
  if (source.templateId == null) {
    return { ok: false, message: '바인딩된 양식의 템플릿 ID를 찾을 수 없습니다.' }
  }

  // ownerProgramId → template_scope=PROGRAM: 양식 관리 목록·등록 후보에 나오지 않는다.
  // versionLabel은 새 템플릿 이름이 되므로 보내지 않는다.
  const copied = await copyFormTemplateVersionRemote(source.templateId, {
    sourceVersionId: target.sourceVersionId,
    ownerProgramId: Number(target.programId),
  })
  if (copied.templateVersionId == null) {
    return { ok: false, message: '프로그램 전용 양식 초안을 만들지 못했습니다.' }
  }
  const templateId = copied.templateId ?? source.templateId

  const schemaJson = writingFormDraftToSchemaJson(normalizeWritingFormDraft(draft))
  await updateFormTemplateVersionRemote(copied.templateVersionId, { schemaJson })
  const templateVersionId = await publishFormTemplateVersionById(copied.templateVersionId)

  const templateName = target.title.trim()
  if (templateId !== source.templateId && templateName !== '') {
    try {
      // 복제 템플릿명은 서버가 「… 복사본」으로 만든다 — 설문 제목이 바뀌지 않게 원래 이름으로 되돌린다.
      await updateFormTemplateRemote(templateId, { templateName })
    } catch (error) {
      console.warn('[program-survey-form-edit] restore template name failed', error)
    }
  }

  await updateAdminProgramFormBindingRemote(target.programId, target.bindingId, {
    templateId,
    templateVersionId,
    ...readSurveySubmissionPeriodFromSchema(schemaJson),
  })

  return { ok: true, templateId, templateVersionId }
}
