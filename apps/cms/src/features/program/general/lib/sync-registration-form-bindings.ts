import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type { Program } from '@/types/domain'
import {
  createGeneralProgramFormBinding,
  fetchGeneralProgramFormBindings,
  updateGeneralProgramFormBinding,
} from '@/features/program/general/api/admin-general-programs-service'
import { shouldUseProgramsHttpRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import {
  getOperationalFormSpec,
  listVisibleOperationalFormSpecs,
  pickOperationalFormBinding,
  type OperationalFormSpec,
} from '@/features/program/general/lib/operational-form-bindings'
import { copyFormTemplateVersionRemote } from '@/features/template/api/form-templates-api-client'
import {
  publishFormTemplateVersionById,
  resolveFormTemplateCatalogIds,
  saveFormTemplateVersionDraftByVersionId,
  shouldUseFormsSurveysRemoteApi,
} from '@/features/template/api/admin-form-templates-service'
import { loadWritingFormTemplateSave } from '@/features/template/lib/writing-form-template-local-save'

type RememberedBinding = { templateId: number; templateVersionId: number }

const rememberedByProgram = new Map<string, Map<string, RememberedBinding>>()
const inflightByProgram = new Map<string, Promise<void>>()

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
  programId: string
  spec: OperationalFormSpec
  bindings: ProgramFormBindingResponse[]
  catalogTemplateId: number
  catalogVersionId: number
}): Promise<void> {
  const local = loadWritingFormTemplateSave(args.spec.templateCode)
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
    rememberProgramOperationalFormBinding(args.programId, args.spec.templateCode, {
      templateId: existing.templateId!,
      templateVersionId: existing.templateVersionId!,
    })
    return
  }

  const copied = await copyFormTemplateVersionRemote(args.catalogTemplateId, {
    sourceVersionId: existing?.templateVersionId ?? args.catalogVersionId,
    versionLabel: `program-${args.programId}`,
  })
  const templateId = copied.templateId ?? args.catalogTemplateId
  const templateVersionId = copied.templateVersionId
  if (templateVersionId == null) {
    throw new Error('프로그램 전용 양식 버전을 만들지 못했습니다.')
  }

  await saveFormTemplateVersionDraftByVersionId({
    versionId: templateVersionId,
    draft: local.draft,
    overlay: local.overlay,
    editorState: local.editorState,
    settingsJson: local.settingsJson,
  })

  // form-bindings는 PUBLISHED version만 허용
  const publishedVersionId = await publishFormTemplateVersionById(templateVersionId)
  const ids = { templateId, templateVersionId: publishedVersionId }
  if (existing?.bindingId != null) {
    await updateGeneralProgramFormBinding(
      args.programId,
      String(existing.bindingId),
      bindingToUpdatePayload(existing, ids, args.spec)
    )
  } else {
    await createGeneralProgramFormBinding(args.programId, {
      formType: args.spec.formType,
      templateId,
      templateVersionId: publishedVersionId,
      targetRole: args.spec.targetRole,
      active: true,
      required: false,
    })
  }
  rememberProgramOperationalFormBinding(args.programId, args.spec.templateCode, ids)
}

async function attachRegistrationFormDrafts(program: Program): Promise<void> {
  if (!shouldUseProgramsHttpRemoteApi() || !shouldUseFormsSurveysRemoteApi()) return
  const specs = listVisibleOperationalFormSpecs(program)
  if (specs.length === 0) return

  const bindings = await fetchGeneralProgramFormBindings(program.id)
  for (const spec of specs) {
    const local = loadWritingFormTemplateSave(spec.templateCode)
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
        programId: program.id,
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
