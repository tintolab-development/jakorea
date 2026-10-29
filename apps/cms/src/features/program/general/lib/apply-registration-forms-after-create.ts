import type { Program } from '@/types/domain'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import { fetchGeneralProgramFormBindings } from '@/features/program/general/api/admin-general-programs-service'
import {
  loadFormTemplateVersionDraftByVersionId,
  resolveFormTemplateCatalogIds,
} from '@/features/template/api/admin-form-templates-service'
import {
  getOperationalFormSpec,
  getRegistrationFormSpec,
  listRecruitmentRowApplicationBindings,
  pickOperationalFormBinding,
} from '@/features/program/general/lib/operational-form-bindings'
import {
  invalidateProgramFormBindingsCache,
  saveProgramScopedOperationalFormVersion,
} from '@/features/program/general/lib/sync-registration-form-bindings'
import type {
  RegistrationCreateFormBindingsPayload,
  RegistrationFormApplyItem,
} from '@/features/program/general/lib/build-registration-create-form-bindings'
import { createSeedDraftForOperationalCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export type RegistrationFormApplyFailure = {
  templateCode: string
  /** 모집 행 신청 양식이면 행 id */
  recruitmentId?: number
  message: string
  code?: string
}

export type RegistrationFormApplyResult = {
  applied: { templateCode: string; recruitmentId?: number }[]
  failed: RegistrationFormApplyFailure[]
}

type ApplyTarget = {
  program: Program
  versionId: number
  recruitmentId?: number
  bindingId?: number
}

type FormApplyServerError = {
  message: string
  code?: string
}

function parseFormApplyError(error: unknown): FormApplyServerError {
  if (error && typeof error === 'object') {
    const data = (
      error as { response?: { data?: { error?: { code?: string; message?: string } } } }
    ).response?.data?.error
    const code = data?.code?.trim() || undefined
    const message = data?.message?.trim()
    if (message) return { message, code }
    if (code) return { message: code, code }
  }
  if (error instanceof Error && error.message.trim()) return { message: error.message }
  return { message: '양식 적용에 실패했습니다.' }
}

function recruitmentAudienceLabel(templateCode: string): string {
  const spec = getOperationalFormSpec(templateCode) ?? getRegistrationFormSpec(templateCode)
  if (spec?.targetRole === 'INSTRUCTOR') return '강사'
  if (spec?.targetRole === 'VOLUNTEER') return '봉사자'
  if (spec?.targetRole === 'INDIVIDUAL') return '참여자'
  if (spec?.targetRole === 'ORGANIZATION') return '참여기관'
  return '프로그램 등록'
}

function formDisplayName(templateCode: string): string {
  const spec = getOperationalFormSpec(templateCode) ?? getRegistrationFormSpec(templateCode)
  return spec?.nameHints[0] ?? templateCode
}

export function formatRegistrationFormApplyFailureContent(
  failed: readonly RegistrationFormApplyFailure[]
): string {
  const groups = new Map<string, string[]>()
  for (const item of failed) {
    const audience = recruitmentAudienceLabel(item.templateCode)
    const name = formDisplayName(item.templateCode)
    const detail = [item.message, item.code].filter(Boolean).join(' · ')
    const line = `- ${name}: ${detail}`
    const lines = groups.get(audience) ?? []
    lines.push(line)
    groups.set(audience, lines)
  }
  const body = [...groups.entries()]
    .map(([audience, lines]) => `${audience}\n${lines.join('\n')}`)
    .join('\n\n')
  return `프로그램은 등록되었지만 일부 양식을 적용하지 못했습니다.\n\n${body}\n\n실패한 양식만 다시 적용할 수 있습니다. 임시저장본은 남겨 둡니다.`
}

function programWithRecruitmentRow(program: Program, binding: ProgramFormBindingResponse): Program {
  const recruitmentId = binding.targetScopeId as number
  return {
    ...program,
    activeRecruitmentId: recruitmentId,
    programRecruitments: [
      { id: recruitmentId, applicationFormBindingId: binding.bindingId },
    ] as unknown as Program['programRecruitments'],
  }
}

async function resolveApplyTargets(
  program: Program,
  bindings: readonly ProgramFormBindingResponse[],
  item: RegistrationFormApplyItem,
  claimedBindingIds: ReadonlySet<number>
): Promise<ApplyTarget[]> {
  const spec =
    getOperationalFormSpec(item.templateCode) ?? getRegistrationFormSpec(item.templateCode)
  if (spec == null) throw new Error(`양식 스펙을 찾을 수 없습니다: ${item.templateCode}`)

  // GENERAL·UJAT 신청 양식: BE fan-out으로 모집 행마다 바인딩이 있다 → 행마다 적용한다.
  const rows = listRecruitmentRowApplicationBindings(program, bindings, spec)
  const rowTargets = rows
    .filter(row => row.templateVersionId != null)
    .map(row => ({
      program: programWithRecruitmentRow(program, row),
      versionId: row.templateVersionId as number,
      recruitmentId: row.targetScopeId as number,
      bindingId: row.bindingId,
    }))
  if (rowTargets.length > 0) {
    const unclaimed = rowTargets.filter(
      target => target.bindingId == null || !claimedBindingIds.has(Number(target.bindingId))
    )
    if (unclaimed.length > 0) return unclaimed
  }

  const catalog = await resolveFormTemplateCatalogIds(item.templateCode).catch(() => null)
  const picked = pickOperationalFormBinding(
    bindings,
    {
      ...spec,
      catalogTemplateId: catalog?.templateId,
    },
    { claimedBindingIds }
  )
  // 이미 다른 스펙이 쓰는 바인딩은 덮지 않고 카탈로그 원본에서 COPY한다(1사1교 기관·강사).
  const existing =
    picked?.bindingId == null || !claimedBindingIds.has(Number(picked.bindingId))
      ? picked
      : undefined
  const versionId = existing?.templateVersionId ?? catalog?.templateVersionId
  if (versionId == null) {
    throw new Error(`적용할 기본 양식 버전을 찾을 수 없습니다: ${item.templateCode}`)
  }
  return [{ program, versionId, bindingId: existing?.bindingId }]
}

async function applyOne(
  target: ApplyTarget,
  item: RegistrationFormApplyItem,
  claimedBindingIds: Set<number>
): Promise<void> {
  const draft =
    item.draft ??
    (await loadFormTemplateVersionDraftByVersionId(item.templateCode, target.versionId))?.draft ??
    createSeedDraftForOperationalCatalogId(item.templateCode)
  if (draft == null) {
    throw new Error(`양식 본문을 찾을 수 없습니다: ${item.templateCode}`)
  }
  const ownerProgramId = Number(target.program.id)
  if (!Number.isSafeInteger(ownerProgramId) || ownerProgramId <= 0) {
    // fail-closed: 프로그램 소유 COPY를 보장할 수 없으면 공용 버전에 쓰지 않는다.
    throw new Error(
      `프로그램 ID가 올바르지 않아 양식을 적용할 수 없습니다: ${String(target.program.id)}`
    )
  }
  const saved = await saveProgramScopedOperationalFormVersion({
    program: target.program,
    templateCode: item.templateCode,
    versionId: target.versionId,
    draft,
    overlay: item.overlay,
    editorState: item.editorState,
    settingsJson: item.settingsJson,
    ownerProgramId,
    // 모집 행 신청 양식(행마다 다른 바인딩)은 행 바인딩을 그대로 쓴다.
    excludeBindingIds: target.recruitmentId == null ? claimedBindingIds : undefined,
  })
  if (saved?.bindingId != null) claimedBindingIds.add(saved.bindingId)
}

/**
 * CREATE 직후 위저드 양식을 프로그램 전용 COPY로 적용한다(방안 C).
 * COPY(ownerProgramId) → PUT → publish → 바인딩 교체를 양식마다 순차 실행한다.
 * 원자성이 없으므로 실패는 모아서 반환하고, 호출부는 부분 성공 안내·재시도를 보여 준다.
 */
export async function applyRegistrationFormsAfterCreate(args: {
  program: Program
  forms: readonly RegistrationFormApplyItem[]
}): Promise<RegistrationFormApplyResult> {
  const result: RegistrationFormApplyResult = { applied: [], failed: [] }
  if (args.forms.length === 0) return result

  invalidateProgramFormBindingsCache(args.program.id)
  let bindings: ProgramFormBindingResponse[] = []
  try {
    bindings = await fetchGeneralProgramFormBindings(args.program.id)
  } catch (error) {
    for (const item of args.forms) {
      result.failed.push({
        templateCode: item.templateCode,
        message: parseFormApplyError(error).message,
      })
    }
    return result
  }

  // 한 실행 안에서 바인딩 1개는 양식 1개만 차지한다(덮어쓰기 방지).
  const claimedBindingIds = new Set<number>()
  for (const item of args.forms) {
    let targets: ApplyTarget[]
    try {
      targets = await resolveApplyTargets(args.program, bindings, item, claimedBindingIds)
    } catch (error) {
      result.failed.push({
        templateCode: item.templateCode,
        message: parseFormApplyError(error).message,
      })
      continue
    }
    for (const target of targets) {
      try {
        await applyOne(target, item, claimedBindingIds)
        result.applied.push({
          templateCode: item.templateCode,
          recruitmentId: target.recruitmentId,
        })
      } catch (error) {
        const parsed = parseFormApplyError(error)
        result.failed.push({
          templateCode: item.templateCode,
          recruitmentId: target.recruitmentId,
          message: parsed.message,
          code: parsed.code,
        })
      }
    }
  }
  invalidateProgramFormBindingsCache(args.program.id)
  return result
}

type PendingFormApply = {
  program: Program
  forms: RegistrationFormApplyItem[]
}

let pendingFormApply: PendingFormApply | null = null

/** 양식 적용 실패가 남아 있으면 등록 완료 후에도 localStorage 임시저장본을 지우지 않는다. */
export function hasPendingRegistrationFormApplyFailures(): boolean {
  return pendingFormApply != null && pendingFormApply.forms.length > 0
}

export function clearPendingRegistrationFormApply(): void {
  pendingFormApply = null
}

function failedItems(
  forms: readonly RegistrationFormApplyItem[],
  result: RegistrationFormApplyResult
): RegistrationFormApplyItem[] {
  const failedCodes = new Set(result.failed.map(item => item.templateCode))
  return forms.filter(item => failedCodes.has(item.templateCode))
}

function showRegistrationFormApplyFailureAlert(result: RegistrationFormApplyResult): void {
  cmsAlertModal.show({
    title: '일부 양식 적용 실패',
    content: formatRegistrationFormApplyFailureContent(result.failed),
    confirmLabel: '다시 시도',
    onConfirm: () => {
      void retryPendingRegistrationFormApply()
    },
  })
}

export async function retryPendingRegistrationFormApply(): Promise<RegistrationFormApplyResult | null> {
  const pending = pendingFormApply
  if (pending == null) return null
  const result = await applyRegistrationFormsAfterCreate(pending)
  const remaining = failedItems(pending.forms, result)
  if (remaining.length === 0) {
    pendingFormApply = null
    cmsAlertModal.show({ title: '양식 적용', content: '양식 적용을 완료했습니다.' })
  } else {
    pendingFormApply = { program: pending.program, forms: remaining }
    showRegistrationFormApplyFailureAlert(result)
  }
  return result
}

/**
 * CREATE 응답 직후 호출 — 프로그램은 남기고(DELETE 없음) 실패 시 부분 성공 안내 + 재시도.
 */
export async function applyPreparedRegistrationFormsAfterCreate(
  program: Program,
  prepared: RegistrationCreateFormBindingsPayload | null | undefined
): Promise<RegistrationFormApplyResult> {
  pendingFormApply = null
  const forms = prepared?.forms ?? []
  const result = await applyRegistrationFormsAfterCreate({ program, forms })
  const remaining = failedItems(forms, result)
  if (remaining.length > 0) {
    pendingFormApply = { program, forms: remaining }
    showRegistrationFormApplyFailureAlert(result)
  }
  return result
}
