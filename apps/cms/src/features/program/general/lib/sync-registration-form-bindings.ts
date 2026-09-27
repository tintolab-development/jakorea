import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type { Program } from '@/types/domain'
import {
  createGeneralProgramFormBinding,
  fetchGeneralProgramFormBindings,
  updateGeneralProgramFormBinding,
} from '@/features/program/general/api/admin-general-programs-service'
import { shouldUseProgramsHttpRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseRemoteApi as shouldUseUjatProgramsRemoteApi } from '@/features/program/ujat/api/capabilities'
import {
  getOperationalFormSpec,
  listVisibleOperationalFormSpecs,
  pickOperationalFormBinding,
  type OperationalFormSpec,
} from '@/features/program/general/lib/operational-form-bindings'
import {
  copyFormTemplateVersionRemote,
  fetchFormTemplateVersionRemote,
  updateFormTemplateRemote,
} from '@/features/template/api/form-templates-api-client'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  loadFormTemplateVersionDraftByVersionId,
  publishFormTemplateVersionById,
  resolveFormTemplateCatalogIds,
  saveFormTemplateVersionDraftByVersionId,
  shouldUseFormsSurveysRemoteApi,
} from '@/features/template/api/admin-form-templates-service'
import { coalesceScopedFormDraftForPut } from '@/features/program/general/lib/coalesce-scoped-form-draft-for-put'
import { loadOperationalFormDraftForProgram } from '@/features/program/general/lib/registration-operational-form-drafts'
import { resolveFormBindingTargetType } from '@/features/program/general/lib/resolve-form-binding-target-type'
import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'

type RememberedBinding = { templateId: number; templateVersionId: number }

const rememberedByProgram = new Map<string, Map<string, RememberedBinding>>()
const inflightByProgram = new Map<string, Promise<void>>()

function shouldUseProgramFormBindingsRemoteApi(): boolean {
  return shouldUseProgramsHttpRemoteApi() || shouldUseUjatProgramsRemoteApi()
}

export function getRememberedProgramOperationalFormBinding(
  programId: string,
  templateCode: string
): RememberedBinding | undefined {
  return rememberedByProgram.get(programId)?.get(templateCode)
}

export function rememberProgramOperationalFormBinding(
  programId: string,
  templateCode: string,
  ids: RememberedBinding
): void {
  const byCode = rememberedByProgram.get(programId) ?? new Map<string, RememberedBinding>()
  byCode.set(templateCode, ids)
  rememberedByProgram.set(programId, byCode)
}

function bindingToUpdatePayload(
  binding: ProgramFormBindingResponse,
  ids: RememberedBinding,
  spec: OperationalFormSpec
): ProgramFormBindingRequest {
  return {
    formType: binding.formType ?? spec.formType,
    templateId: ids.templateId,
    templateVersionId: ids.templateVersionId,
    targetType: binding.targetType,
    targetRole: binding.targetRole ?? spec.targetRole,
    targetScope: binding.targetScope,
    targetScopeId: binding.targetScopeId,
    required: binding.required,
    active: true,
    displayOrder: binding.displayOrder,
  }
}

async function attachLocalDraftToBinding(args: {
  program: Program
  spec: OperationalFormSpec
  bindings: ProgramFormBindingResponse[]
  catalogTemplateId: number
  catalogVersionId: number
}): Promise<void> {
  const programId = args.program.id
  const local = await loadOperationalFormDraftForProgram(args.program, args.spec.templateCode)
  if (local?.draft == null) return

  const existing = pickOperationalFormBinding(args.bindings, {
    ...args.spec,
    catalogTemplateId: args.catalogTemplateId,
  })
  const alreadyScoped =
    existing?.templateId != null &&
    existing.templateVersionId != null &&
    existing.templateId !== args.catalogTemplateId

  if (alreadyScoped) {
    rememberProgramOperationalFormBinding(programId, args.spec.templateCode, {
      templateId: existing.templateId!,
      templateVersionId: existing.templateVersionId!,
    })
    return
  }

  const copied = await copyFormTemplateVersionRemote(args.catalogTemplateId, {
    sourceVersionId: existing?.templateVersionId ?? args.catalogVersionId,
    versionLabel: `program-${programId}`,
  })
  const templateId = copied.templateId ?? args.catalogTemplateId
  const templateVersionId = copied.templateVersionId
  if (templateVersionId == null) {
    throw new Error('프로그램 전용 양식 버전을 만들지 못했습니다.')
  }

  const baseline = await loadFormTemplateVersionDraftByVersionId(
    args.spec.templateCode,
    templateVersionId
  )
  const draftForPut =
    baseline?.draft != null
      ? coalesceScopedFormDraftForPut(baseline.draft, local.draft)
      : local.draft

  await saveFormTemplateVersionDraftByVersionId({
    versionId: templateVersionId,
    draft: draftForPut,
    overlay: local.overlay,
    editorState: local.editorState,
    settingsJson: local.settingsJson,
    templateCode: args.spec.templateCode,
  })

  // form-bindings는 PUBLISHED version만 허용
  const publishedVersionId = await publishFormTemplateVersionById(templateVersionId)

  // 주의: `useYn:false`로 숨기지 않는다 — BE의 form-binding 검증이 `use_yn=true`를
  // "존재/활성" 판정에 그대로 쓰므로, false로 두면 이후 binding 조회·수정이
  // `templateVersionId does not exist or is inactive`로 거절될 수 있다(2026-09-21 BE 확인).
  // description만 남겨 어떤 program이 소유한 복사본인지 추적한다.
  if (templateId !== args.catalogTemplateId) {
    try {
      await updateFormTemplateRemote(templateId, {
        description: `program-scoped:${programId}`,
      })
    } catch (error) {
      console.warn('[program-form-bindings] label program-scoped template failed', error)
    }
  }

  const ids = { templateId, templateVersionId: publishedVersionId }
  const createPayload: ProgramFormBindingRequest = {
    formType: args.spec.formType,
    templateId,
    templateVersionId: publishedVersionId,
    active: true,
    required: false,
  }
  if (args.spec.targetRole != null && args.spec.targetRole !== '') {
    createPayload.targetRole = args.spec.targetRole
    createPayload.targetType = resolveFormBindingTargetType(args.spec.targetRole)
  }

  const bindingInactive = existing?.active === false
  if (existing?.bindingId == null || bindingInactive) {
    await createGeneralProgramFormBinding(programId, createPayload)
  } else {
    try {
      await updateGeneralProgramFormBinding(
        programId,
        String(existing.bindingId),
        bindingToUpdatePayload(existing, ids, args.spec)
      )
    } catch (error) {
      if (getApiErrorCode(error) === 'OPERATION_NOT_ALLOWED') {
        throw error
      }
      throw error
    }
  }
  rememberProgramOperationalFormBinding(programId, args.spec.templateCode, ids)
}

async function promoteCatalogBindingToProgramScoped(args: {
  program: Program
  spec: OperationalFormSpec
  bindings: ProgramFormBindingResponse[]
  catalogTemplateId: number
  catalogVersionId: number
}): Promise<RememberedBinding | undefined> {
  const programId = args.program.id
  const existing = pickOperationalFormBinding(args.bindings, {
    ...args.spec,
    catalogTemplateId: args.catalogTemplateId,
  })
  if (
    existing?.templateId != null &&
    existing.templateVersionId != null &&
    existing.templateId !== args.catalogTemplateId
  ) {
    const ids = {
      templateId: existing.templateId,
      templateVersionId: existing.templateVersionId,
    }
    rememberProgramOperationalFormBinding(programId, args.spec.templateCode, ids)
    return ids
  }

  const copied = await copyFormTemplateVersionRemote(args.catalogTemplateId, {
    sourceVersionId: existing?.templateVersionId ?? args.catalogVersionId,
    versionLabel: `program-${programId}`,
  })
  const templateId = copied.templateId ?? args.catalogTemplateId
  const templateVersionId = copied.templateVersionId
  if (templateVersionId == null) {
    throw new Error('프로그램 전용 양식 버전을 만들지 못했습니다.')
  }

  const publishedVersionId = await publishFormTemplateVersionById(templateVersionId)
  // 주의: `useYn:false`로 숨기지 않는다 — 사유는 위 `attachLocalDraftToBinding` 주석과 동일.
  if (templateId !== args.catalogTemplateId) {
    try {
      await updateFormTemplateRemote(templateId, {
        description: `program-scoped:${programId}`,
      })
    } catch (error) {
      console.warn('[program-form-bindings] label program-scoped template failed', error)
    }
  }

  const ids = { templateId, templateVersionId: publishedVersionId }
  const createPayload: ProgramFormBindingRequest = {
    formType: args.spec.formType,
    templateId,
    templateVersionId: publishedVersionId,
    active: true,
    required: false,
  }
  if (args.spec.targetRole != null && args.spec.targetRole !== '') {
    createPayload.targetRole = args.spec.targetRole
    createPayload.targetType = resolveFormBindingTargetType(args.spec.targetRole)
  }

  const bindingInactive = existing?.active === false
  if (existing?.bindingId == null || bindingInactive) {
    await createGeneralProgramFormBinding(programId, createPayload)
  } else {
    try {
      await updateGeneralProgramFormBinding(
        programId,
        String(existing.bindingId),
        bindingToUpdatePayload(existing, ids, args.spec)
      )
    } catch (error) {
      if (getApiErrorCode(error) === 'OPERATION_NOT_ALLOWED') {
        throw error
      }
      throw error
    }
  }
  rememberProgramOperationalFormBinding(programId, args.spec.templateCode, ids)
  return ids
}

function isFormVersionMutable(versionStatus: string | null | undefined): boolean {
  return versionStatus == null || versionStatus === 'DRAFT'
}

/**
 * 프로그램 상세 신청 양식 저장.
 * 바인딩된 버전은 PUBLISHED라 PUT이 409 FORM_VERSION_IMMUTABLE이다.
 * 발행본이면 새 DRAFT로 복사한 뒤 저장·발행하고, 그 버전으로 바인딩을 교체한다.
 */
export async function saveProgramScopedOperationalFormVersion(args: {
  program: Program
  templateCode: string
  versionId: number
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}): Promise<RememberedBinding> {
  const spec = getOperationalFormSpec(args.templateCode)
  if (spec == null) {
    throw new Error(`운영 양식 스펙을 찾을 수 없습니다: ${args.templateCode}`)
  }

  const current = await fetchFormTemplateVersionRemote(args.versionId)
  const sourceTemplateId = current.templateId
  if (sourceTemplateId == null) {
    throw new Error('양식 버전의 템플릿 ID를 찾을 수 없습니다.')
  }

  let draftTemplateId = sourceTemplateId
  let draftVersionId = args.versionId
  if (!isFormVersionMutable(current.versionStatus)) {
    const copied = await copyFormTemplateVersionRemote(sourceTemplateId, {
      sourceVersionId: args.versionId,
      versionLabel: `program-${args.program.id}`,
    })
    if (copied.templateVersionId == null) {
      throw new Error('프로그램 전용 양식 초안을 만들지 못했습니다.')
    }
    draftTemplateId = copied.templateId ?? sourceTemplateId
    draftVersionId = copied.templateVersionId
  }

  const baseline = await loadFormTemplateVersionDraftByVersionId(
    args.templateCode,
    draftVersionId
  )
  const draftForPut =
    baseline?.draft != null
      ? coalesceScopedFormDraftForPut(baseline.draft, args.draft)
      : args.draft

  await saveFormTemplateVersionDraftByVersionId({
    versionId: draftVersionId,
    draft: draftForPut,
    overlay: args.overlay,
    editorState: args.editorState,
    settingsJson: args.settingsJson,
    templateCode: args.templateCode,
  })

  const publishedVersionId = await publishFormTemplateVersionById(draftVersionId)
  const catalog = await resolveFormTemplateCatalogIds(args.templateCode).catch(() => null)
  if (catalog != null && draftTemplateId !== catalog.templateId) {
    try {
      await updateFormTemplateRemote(draftTemplateId, {
        description: `program-scoped:${args.program.id}`,
      })
    } catch (error) {
      console.warn('[program-form-bindings] label program-scoped template failed', error)
    }
  }

  const ids = { templateId: draftTemplateId, templateVersionId: publishedVersionId }
  const bindings = await fetchGeneralProgramFormBindings(args.program.id)
  const existing = pickOperationalFormBinding(bindings, {
    ...spec,
    catalogTemplateId: catalog?.templateId,
  })
  const createPayload: ProgramFormBindingRequest = {
    formType: spec.formType,
    templateId: draftTemplateId,
    templateVersionId: publishedVersionId,
    active: true,
    required: false,
  }
  if (spec.targetRole != null && spec.targetRole !== '') {
    createPayload.targetRole = spec.targetRole
    createPayload.targetType = resolveFormBindingTargetType(spec.targetRole)
  }

  const bindingInactive = existing?.active === false
  if (existing?.bindingId == null || bindingInactive) {
    await createGeneralProgramFormBinding(args.program.id, createPayload)
  } else {
    await updateGeneralProgramFormBinding(
      args.program.id,
      String(existing.bindingId),
      bindingToUpdatePayload(existing, ids, spec)
    )
  }
  rememberProgramOperationalFormBinding(args.program.id, args.templateCode, ids)
  return ids
}

async function attachRegistrationFormDrafts(program: Program): Promise<void> {
  if (!shouldUseProgramFormBindingsRemoteApi() || !shouldUseFormsSurveysRemoteApi()) return
  const specs = listVisibleOperationalFormSpecs(program)
  if (specs.length === 0) return

  const bindings = await fetchGeneralProgramFormBindings(program.id)
  for (const spec of specs) {
    const local = await loadOperationalFormDraftForProgram(program, spec.templateCode)
    if (local?.draft == null) continue
    try {
      const catalog = await resolveFormTemplateCatalogIds(spec.templateCode)
      if (catalog == null) {
        console.warn(
          '[program-form-bindings] catalog template ids missing',
          spec.templateCode
        )
        continue
      }
      await attachLocalDraftToBinding({
        program,
        spec,
        bindings,
        catalogTemplateId: catalog.templateId,
        catalogVersionId: catalog.templateVersionId,
      })
    } catch (error) {
      console.warn(
        '[program-form-bindings] attach local draft failed',
        spec.templateCode,
        error
      )
    }
  }
}

/** 등록 위저드 localStorage 신청/모집 초안을 프로그램 form-binding 전용 version에 반영 */
export async function attachRegistrationFormDraftsToProgram(program: Program): Promise<void> {
  const existing = inflightByProgram.get(program.id)
  if (existing) return existing
  const run = attachRegistrationFormDrafts(program).finally(() => {
    inflightByProgram.delete(program.id)
  })
  inflightByProgram.set(program.id, run)
  return run
}

/** form-bindings GET + resolve만 (조회·미리보기용, PATCH/PUT 없음) */
export async function resolveProgramOperationalFormLoadSource(
  program: Program,
  templateCode: string
): Promise<{ templateVersionId?: number; preferLocalDraft: boolean }> {
  if (!shouldUseProgramFormBindingsRemoteApi() || !shouldUseFormsSurveysRemoteApi()) {
    return { preferLocalDraft: true }
  }
  const catalog = await resolveFormTemplateCatalogIds(templateCode)
  const bindings = await fetchGeneralProgramFormBindings(program.id)
  return resolveApplicationFormLoadSource({
    programId: program.id,
    templateCode,
    bindings,
    catalogTemplateId: catalog?.templateId,
  })
}

/** 발행·보관 버전은 PUT 불가. DRAFT만 수정한다. */
export function isProgramFormVersionMutable(versionStatus: string | null | undefined): boolean {
  return versionStatus == null || versionStatus === 'DRAFT'
}

async function rebindProgramOperationalFormVersion(args: {
  programId: string
  templateCode: string
  templateId: number
  templateVersionId: number
}): Promise<void> {
  const spec = getOperationalFormSpec(args.templateCode)
  const ids = { templateId: args.templateId, templateVersionId: args.templateVersionId }
  rememberProgramOperationalFormBinding(args.programId, args.templateCode, ids)
  if (spec == null) return

  const catalog = await resolveFormTemplateCatalogIds(args.templateCode)
  const bindings = await fetchGeneralProgramFormBindings(args.programId)
  const existing = pickOperationalFormBinding(bindings, {
    ...spec,
    catalogTemplateId: catalog?.templateId,
  })
  const payload: ProgramFormBindingRequest = {
    formType: existing?.formType ?? spec.formType,
    templateId: ids.templateId,
    templateVersionId: ids.templateVersionId,
    targetType:
      existing?.targetType ??
      (spec.targetRole ? resolveFormBindingTargetType(spec.targetRole) : undefined),
    targetRole: existing?.targetRole ?? spec.targetRole,
    targetScope: existing?.targetScope,
    targetScopeId: existing?.targetScopeId,
    required: existing?.required ?? false,
    active: true,
    displayOrder: existing?.displayOrder,
  }

  if (existing?.bindingId == null) {
    await createGeneralProgramFormBinding(args.programId, payload)
    return
  }
  await updateGeneralProgramFormBinding(args.programId, String(existing.bindingId), payload)
}

/**
 * 프로그램 상세 양식 저장.
 * 바인딩이 PUBLISHED 버전을 가리키면 새 DRAFT에 저장한 뒤 발행하고 binding을 교체한다.
 */
export async function saveMutableProgramFormVersion(args: {
  programId: string
  templateCode: string
  templateVersionId: number
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}): Promise<number> {
  const current = await fetchFormTemplateVersionRemote(args.templateVersionId)
  let writeVersionId = args.templateVersionId
  let templateId = current.templateId

  if (!isProgramFormVersionMutable(current.versionStatus)) {
    if (templateId == null) {
      throw new Error('발행된 양식을 복사할 템플릿 ID가 없습니다.')
    }
    const copied = await copyFormTemplateVersionRemote(templateId, {
      sourceVersionId: args.templateVersionId,
      versionLabel: `program-${args.programId}-edit`,
    })
    if (copied.templateVersionId == null) {
      throw new Error('수정용 양식 draft를 만들지 못했습니다.')
    }
    writeVersionId = copied.templateVersionId
    templateId = copied.templateId ?? templateId
  }

  await saveFormTemplateVersionDraftByVersionId({
    versionId: writeVersionId,
    draft: args.draft,
    overlay: args.overlay,
    editorState: args.editorState,
    settingsJson: args.settingsJson,
    templateCode: args.templateCode,
  })

  const publishedVersionId = await publishFormTemplateVersionById(writeVersionId)
  if (templateId == null) {
    throw new Error('양식 템플릿 ID가 없습니다.')
  }
  await rebindProgramOperationalFormVersion({
    programId: args.programId,
    templateCode: args.templateCode,
    templateId,
    templateVersionId: publishedVersionId,
  })
  return publishedVersionId
}

/** catalog binding → program-scoped copy (양식 수정 모달·저장 SSOT) */
export async function ensureProgramScopedOperationalBinding(
  program: Program,
  templateCode: string
): Promise<{ templateVersionId?: number; preferLocalDraft: boolean }> {
  if (!shouldUseProgramFormBindingsRemoteApi() || !shouldUseFormsSurveysRemoteApi()) {
    return { preferLocalDraft: true }
  }
  const spec = getOperationalFormSpec(templateCode)
  if (spec == null) return { preferLocalDraft: true }

  const catalog = await resolveFormTemplateCatalogIds(templateCode)
  const bindings = await fetchGeneralProgramFormBindings(program.id)
  const initial = resolveApplicationFormLoadSource({
    programId: program.id,
    templateCode,
    bindings,
    catalogTemplateId: catalog?.templateId,
  })
  if (!initial.preferLocalDraft) return initial

  const local = await loadOperationalFormDraftForProgram(program, templateCode)
  if (local?.draft != null && catalog != null) {
    await attachLocalDraftToBinding({
      program,
      spec,
      bindings,
      catalogTemplateId: catalog.templateId,
      catalogVersionId: catalog.templateVersionId,
    })
  } else if (catalog != null) {
    await promoteCatalogBindingToProgramScoped({
      program,
      spec,
      bindings,
      catalogTemplateId: catalog.templateId,
      catalogVersionId: catalog.templateVersionId,
    })
  }

  const nextBindings = await fetchGeneralProgramFormBindings(program.id)
  return resolveApplicationFormLoadSource({
    programId: program.id,
    templateCode,
    bindings: nextBindings,
    catalogTemplateId: catalog?.templateId,
  })
}

export function resolveApplicationFormLoadSource(args: {
  programId: string
  templateCode: string
  bindings: readonly ProgramFormBindingResponse[]
  catalogTemplateId?: number
}): { templateVersionId?: number; preferLocalDraft: boolean } {
  const remembered = getRememberedProgramOperationalFormBinding(args.programId, args.templateCode)
  if (remembered?.templateVersionId != null) {
    return { templateVersionId: remembered.templateVersionId, preferLocalDraft: false }
  }
  const spec = getOperationalFormSpec(args.templateCode)
  if (spec == null) return { preferLocalDraft: true }
  const binding = pickOperationalFormBinding(args.bindings, {
    ...spec,
    catalogTemplateId: args.catalogTemplateId,
  })
  if (
    binding?.templateVersionId != null &&
    (binding.templateId == null ||
      args.catalogTemplateId == null ||
      binding.templateId !== args.catalogTemplateId)
  ) {
    return { templateVersionId: binding.templateVersionId, preferLocalDraft: false }
  }
  return { preferLocalDraft: true }
}
