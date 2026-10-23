import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import type { Program } from '@/types/domain'
import { publishFormTemplateVersionById } from '@/features/template/api/admin-form-templates-service'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import { listAllRegistrationCreateFormSpecs } from '@/features/program/general/lib/operational-form-bindings'
import {
  collectOperationalOverlayForCatalogId,
  createSeedDraftForOperationalCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import { shouldUseRegistrationCreateFormBindings } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import type { RegistrationCreateFormBindingsPayload } from '@/features/program/general/lib/build-registration-create-form-bindings'
import {
  ensureDraftOwnedFormVersion,
  ensureDraftOwnedFormVersionWithBaseline,
  persistDraftOwnedFormVersion,
  type DraftOwnedFormVersion,
} from '@/features/program/general/lib/registration-draft-form-versions'
import { loadRegistrationWizardFormDraft } from '@/features/program/general/lib/registration-wizard-form-draft'
import { ensureRegistrationProgramDraftId } from '@/features/program/general/lib/registration-program-draft-session'
import { resolveFormBindingTargetType } from '@/features/program/general/lib/resolve-form-binding-target-type'
import { resolveRegistrationProgramDraftProgramType } from '@/features/program/general/lib/resolve-program-api-type-for-draft'

export type RegistrationFormFlushInput = {
  templateCode: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
}

export type OperationalFormFlushOverride = {
  templateCode: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
}

export type CompleteRegistrationBindingOptions = {
  operationalOverrides?: OperationalFormFlushOverride[]
}

/**
 * 등록 완료 — visible spec flush(필요 시 PUT) + publish + formBindings (단일 orchestrator).
 */
export async function prepareRegistrationCreateFormBindings(args: {
  program: Program
  registration?: RegistrationFormFlushInput
  operationalOverrides?: OperationalFormFlushOverride[]
}): Promise<RegistrationCreateFormBindingsPayload | null> {
  if (!shouldUseRegistrationCreateFormBindings()) return null

  const programDraftType = resolveRegistrationProgramDraftProgramType(args.program)
  const programDraftId = await ensureRegistrationProgramDraftId(programDraftType)
  const loadWizardOperationalDraft = (templateCode: string) =>
    loadRegistrationWizardFormDraft({
      programType: programDraftType,
      templateCode,
    })
  const specs = listAllRegistrationCreateFormSpecs(args.program)
  if (specs.length === 0) return null

  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()

  const overrideByCode = new Map(
    (args.operationalOverrides ?? []).map(item => [item.templateCode, item])
  )
  const formBindings: ProgramFormBindingRequest[] = []

  for (const spec of specs) {
    const needsRegistrationPut =
      spec.formType === 'REGISTRATION' &&
      args.registration != null &&
      args.registration.templateCode === spec.templateCode

    const override = overrideByCode.get(spec.templateCode)
    const overlay =
      spec.formType === 'REGISTRATION' ||
      spec.templateCode === 'recruitment-trained-teachers' ||
      spec.templateCode === 'application-trained-teachers'
        ? null
        : collectOperationalOverlayForCatalogId(spec.templateCode)
    const wizardSaved =
      spec.formType !== 'REGISTRATION'
        ? await loadWizardOperationalDraft(spec.templateCode)
        : null
    const hasWizardOperationalDraft =
      wizardSaved?.draft != null && wizardSaved.draft.paragraphs.length > 0
    const needsOperationalPut =
      spec.formType !== 'REGISTRATION' &&
      (override != null ||
        hasWizardOperationalDraft ||
        (overlay != null && Object.keys(overlay).length > 0))

    let owned: DraftOwnedFormVersion

    if (needsRegistrationPut || needsOperationalPut) {
      const { owned: ensuredOwned, baseline } = await ensureDraftOwnedFormVersionWithBaseline({
        programDraftId,
        templateCode: spec.templateCode,
      })

      if (needsRegistrationPut && args.registration != null) {
        owned = await persistDraftOwnedFormVersion({
          programDraftId,
          templateCode: spec.templateCode,
          owned: ensuredOwned,
          baseline,
          draft: args.registration.draft,
          overlay: args.registration.overlay,
          editorState: args.registration.editorState,
        })
      } else if (override != null) {
        owned = await persistDraftOwnedFormVersion({
          programDraftId,
          templateCode: spec.templateCode,
          owned: ensuredOwned,
          baseline,
          draft: override.draft,
          overlay: override.overlay,
          editorState: override.editorState,
        })
      } else {
        const draft = hasWizardOperationalDraft
          ? wizardSaved!.draft
          : (baseline?.draft ?? createSeedDraftForOperationalCatalogId(spec.templateCode))
        if (draft == null || overlay == null) {
          owned = ensuredOwned
        } else {
          owned = await persistDraftOwnedFormVersion({
            programDraftId,
            templateCode: spec.templateCode,
            owned: ensuredOwned,
            baseline,
            draft,
            overlay,
            editorState: wizardSaved?.editorState ?? baseline?.editorState,
          })
        }
      }
    } else {
      owned = await ensureDraftOwnedFormVersion({
        programDraftId,
        templateCode: spec.templateCode,
      })
    }

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
      binding.targetType = resolveFormBindingTargetType(spec.targetRole)
    }
    formBindings.push(binding)
  }

  if (formBindings.length === 0) return null

  return { programDraftId, formBindings }
}
