import {
  fetchAdminProgramFormBindingsRemote,
  updateAdminProgramFormBindingRemote,
} from '@/features/program/general/api/programs-api-client'
import { readSurveySubmissionPeriodFromSchema } from '@/features/program/shared/lib/survey-management/resolve-published-survey-binding'
import {
  isSameSeoulCalendarDay,
  resolveSurveyBindingPeriodForFormSave,
  seoulStartOfNextCalendarDayIso,
} from '@/features/program/shared/lib/survey-management/survey-binding-period'
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
import dayjs from 'dayjs'
import {
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { formatAppDatepickerDisplay } from '@/shared/ui/cms-datepicker'

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

function bindingHasSubmissionPeriod(
  binding: Pick<ProgramFormBindingResponse, 'submissionStartAt' | 'submissionEndAt'>
): boolean {
  return Boolean(binding.submissionStartAt?.trim() || binding.submissionEndAt?.trim())
}

function snapshotBindingSubmissionPeriod(
  binding: ProgramFormBindingResponse
): { submissionStartAt?: string; submissionEndAt?: string } {
  return {
    ...(binding.submissionStartAt != null ? { submissionStartAt: binding.submissionStartAt } : {}),
    ...(binding.submissionEndAt != null ? { submissionEndAt: binding.submissionEndAt } : {}),
  }
}

async function restoreBindingSubmissionPeriod(
  programId: string,
  bindingId: string,
  previous: { submissionStartAt?: string; submissionEndAt?: string }
): Promise<void> {
  if (previous.submissionStartAt == null && previous.submissionEndAt == null) return
  try {
    await updateAdminProgramFormBindingRemote(programId, bindingId, previous)
  } catch (error) {
    console.warn('[program-survey-form-edit] restore submission period failed', error)
  }
}

function bindingAlreadyReboundToEditedTemplate(
  binding: ProgramFormBindingResponse,
  sourceVersionId: number
): boolean {
  const boundVersion = Number(binding.templateVersionId)
  return Number.isInteger(boundVersion) && boundVersion > 0 && boundVersion !== sourceVersionId
}

/**
 * 등록 직후 최초 양식 저장만 기간을 열어 준다.
 * SATISFACTION·LECTURE_EVALUATION은 기간 null + IN_PROGRESS.
 * SURVEY는 서버가 submissionStartAt을 채워 IN_PROGRESS가 되므로, 응답 0건·시작일·생성일이 Asia/Seoul 오늘인 경우만 동일하게 본다.
 * 이미 시작된 과거 기간(IN_PROGRESS)과, 최초 저장으로 version이 바뀐 바인딩은 열지 않는다.
 */
function canUnlockBindingPeriodForFirstSurveyFormSave(
  binding: ProgramFormBindingResponse
): boolean {
  if ((binding.submittedCount ?? 0) > 0) return false
  if (binding.progressStatus === 'FINISHED') return false
  if (!bindingHasSubmissionPeriod(binding)) return true

  const startRaw = binding.submissionStartAt?.trim()
  if (!startRaw) return true

  const start = dayjs(startRaw)
  if (!start.isValid()) return false
  if (dayjs().isBefore(start)) return false
  if (!isSameSeoulCalendarDay(startRaw)) return false

  const createdRaw = binding.createdAt?.trim()
  if (!createdRaw) return true
  const created = dayjs(createdRaw)
  if (!created.isValid()) return true
  return isSameSeoulCalendarDay(createdRaw)
}

/** 서버 `availableActions` 우선, 없으면 progressStatus·응답 수로 판단 */
export function canSwapProgramSurveyFormBinding(
  binding: ProgramFormBindingResponse | undefined
): boolean {
  if (!binding) return false
  if ((binding.submittedCount ?? 0) > 0) return false
  const actions = binding.availableActions
  if (Array.isArray(actions) && actions.length > 0) {
    return actions.includes('UPDATE_TEMPLATE')
  }
  return binding.progressStatus === 'BEFORE_START'
}

/** @deprecated `canSwapProgramSurveyFormBinding` 사용 */
export function isProgramSurveyFormEditable(
  binding: Pick<ProgramFormBindingResponse, 'progressStatus' | 'submittedCount' | 'availableActions'> | undefined
): boolean {
  return canSwapProgramSurveyFormBinding(binding as ProgramFormBindingResponse | undefined)
}

export function resolveProgramSurveyFormSaveBlockedMessage(
  binding: ProgramFormBindingResponse | undefined
): string {
  if (!binding) {
    return '설문 연결 정보를 찾을 수 없습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.'
  }
  const submitted = binding.submittedCount ?? 0
  if (submitted > 0) {
    return `응답이 ${submitted}건 있는 설문은 양식을 수정할 수 없습니다.`
  }
  if (binding.progressStatus === 'FINISHED') {
    return '종료된 설문은 양식을 수정할 수 없습니다.'
  }
  const start = binding.submissionStartAt ? dayjs(binding.submissionStartAt) : null
  if (start?.isValid() && !dayjs().isBefore(start)) {
    return `작성 기간이 시작된 설문(${formatAppDatepickerDisplay(start)}~)은 양식을 수정할 수 없습니다. 시작일을 오늘 이후로 바꾼 뒤 저장해 주세요.`
  }
  return PROGRAM_SURVEY_FORM_EDIT_LOCKED_MESSAGE
}

type PreparedSurveyFormBinding =
  | {
      ok: true
      binding: ProgramFormBindingResponse
      periodUnlock?: { previous: { submissionStartAt?: string; submissionEndAt?: string } }
    }
  | { ok: false; message: string; refetchBindings: boolean }

async function prepareBindingForSurveyFormSave(
  programId: string,
  bindingId: string,
  draft: WritingFormDraft,
  initialBinding: ProgramFormBindingResponse | undefined,
  sourceVersionId: number
): Promise<PreparedSurveyFormBinding> {
  let binding = initialBinding
  if (canSwapProgramSurveyFormBinding(binding)) {
    return { ok: true, binding: binding! }
  }
  if ((binding?.submittedCount ?? 0) > 0) {
    return {
      ok: false,
      message: resolveProgramSurveyFormSaveBlockedMessage(binding),
      refetchBindings: true,
    }
  }
  if (
    binding != null &&
    bindingAlreadyReboundToEditedTemplate(binding, sourceVersionId)
  ) {
    return {
      ok: false,
      message: resolveProgramSurveyFormSaveBlockedMessage(binding),
      refetchBindings: true,
    }
  }
  if (binding == null || !canUnlockBindingPeriodForFirstSurveyFormSave(binding)) {
    return {
      ok: false,
      message: resolveProgramSurveyFormSaveBlockedMessage(binding),
      refetchBindings: true,
    }
  }

  // 등록 직후: 기간 null이거나 SURVEY 서버 기본 오늘 시작이면 IN_PROGRESS라 양식 교체가 막힌다.
  // 진행 상태 정책은 유지하고, 최초 1회만 기간을 미래로 열어 UPDATE_TEMPLATE을 탄다.
  const previous = snapshotBindingSubmissionPeriod(binding)
  const schemaJson = writingFormDraftToSchemaJson(normalizeWritingFormDraft(draft))
  const period = readSurveySubmissionPeriodFromSchema(schemaJson)
  const draftStart = period.submissionStartAt ? dayjs(period.submissionStartAt) : null
  const draftStartIsFuture =
    draftStart?.isValid() === true && dayjs().isBefore(draftStart)
  const periodPayload = draftStartIsFuture
    ? {
        submissionStartAt: period.submissionStartAt!,
        ...(period.submissionEndAt != null ? { submissionEndAt: period.submissionEndAt } : {}),
      }
    : {
        submissionStartAt: seoulStartOfNextCalendarDayIso(),
      }

  try {
    await updateAdminProgramFormBindingRemote(programId, bindingId, periodPayload)
    const bindings = await fetchAdminProgramFormBindingsRemote(programId)
    binding = bindings.find(item => String(item.bindingId) === bindingId)
    if (canSwapProgramSurveyFormBinding(binding)) {
      return { ok: true, binding: binding!, periodUnlock: { previous } }
    }
    await restoreBindingSubmissionPeriod(programId, bindingId, previous)
    return {
      ok: false,
      message: resolveProgramSurveyFormSaveBlockedMessage(binding),
      refetchBindings: true,
    }
  } catch (error) {
    await restoreBindingSubmissionPeriod(programId, bindingId, previous)
    throw error
  }
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

  const bindings = await fetchAdminProgramFormBindingsRemote(target.programId)
  const binding = bindings.find(item => String(item.bindingId) === target.bindingId)
  const prepared = await prepareBindingForSurveyFormSave(
    target.programId,
    target.bindingId,
    draft,
    binding,
    target.sourceVersionId
  )
  if (!prepared.ok) {
    return {
      ok: false,
      message: prepared.message,
      refetchBindings: prepared.refetchBindings,
    }
  }

  const restoreUnlockPeriod = () =>
    prepared.periodUnlock
      ? restoreBindingSubmissionPeriod(
          target.programId,
          target.bindingId,
          prepared.periodUnlock.previous
        )
      : Promise.resolve()

  try {
    const source = await fetchFormTemplateVersionRemote(target.sourceVersionId)
    if (source.templateId == null) {
      await restoreUnlockPeriod()
      return { ok: false, message: '바인딩된 양식의 템플릿 ID를 찾을 수 없습니다.' }
    }

    // ownerProgramId → template_scope=PROGRAM: 양식 관리 목록·등록 후보에 나오지 않는다.
    // versionLabel은 새 템플릿 이름이 되므로 보내지 않는다.
    const copied = await copyFormTemplateVersionRemote(source.templateId, {
      sourceVersionId: target.sourceVersionId,
      ownerProgramId: Number(target.programId),
    })
    if (copied.templateVersionId == null) {
      await restoreUnlockPeriod()
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
      ...resolveSurveyBindingPeriodForFormSave(readSurveySubmissionPeriodFromSchema(schemaJson)),
    })

    return { ok: true, templateId, templateVersionId }
  } catch (error) {
    await restoreUnlockPeriod()
    throw error
  }
}
