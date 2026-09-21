import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import type { Program } from '@/types/domain'
import { publishFormTemplateVersionById } from '@/features/template/api/admin-form-templates-service'
import {
  getDraftOwnedFormVersion,
  ensureDraftOwnedFormVersion,
} from '@/features/program/general/lib/registration-draft-form-versions'
import { listAllRegistrationCreateFormSpecs } from '@/features/program/general/lib/operational-form-bindings'
import { shouldUseRegistrationCreateFormBindings } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import { ensureRegistrationProgramDraftId } from '@/features/program/general/lib/registration-program-draft-session'
import { resolveProgramApiTypeForDraft } from '@/features/program/general/lib/resolve-program-api-type-for-draft'

export type RegistrationCreateFormBindingsPayload = {
  programDraftId: number
  formBindings: ProgramFormBindingRequest[]
}

/**
 * create body용 program-scoped formBindings 빌드 (OpenAPI v9 옵션 1).
 * draft-owned version publish → binding (re-copy 없음).
 */
export async function buildRegistrationCreateFormBindings(
  program: Program
): Promise<RegistrationCreateFormBindingsPayload | null> {
  if (!shouldUseRegistrationCreateFormBindings()) return null

  const programType = resolveProgramApiTypeForDraft(program)
  const programDraftId = await ensureRegistrationProgramDraftId(programType)
  const specs = listAllRegistrationCreateFormSpecs(program)
  if (specs.length === 0) return null

  const formBindings: ProgramFormBindingRequest[] = []

  for (const spec of specs) {
    const owned =
      getDraftOwnedFormVersion(programDraftId, spec.templateCode) ??
      (await ensureDraftOwnedFormVersion({ programDraftId, templateCode: spec.templateCode }))

    const publishedVersionId = await publishFormTemplateVersionById(owned.draftVersionId)

    const binding: ProgramFormBindingRequest = {
      formType: spec.formType,
      templateId: owned.templateId,
      templateVersionId: publishedVersionId,
      active: true,
      required: false,
    }
    if (spec.targetRole != null && spec.targetRole !== '') {
      binding.targetRole = spec.targetRole
    }
    formBindings.push(binding)
  }

  if (formBindings.length === 0) return null

  return { programDraftId, formBindings }
}
