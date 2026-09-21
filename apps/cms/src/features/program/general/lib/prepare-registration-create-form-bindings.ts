import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import type { Program } from '@/types/domain'
import {
  loadFormTemplateVersionDraftByVersionId,
  publishFormTemplateVersionById,
} from '@/features/template/api/admin-form-templates-service'
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
  persistDraftOwnedFormVersion,
  type DraftOwnedFormVersion,
} from '@/features/program/general/lib/registration-draft-form-versions'
import { ensureRegistrationProgramDraftId } from '@/features/program/general/lib/registration-program-draft-session'
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
  const specs = listAllRegistrationCreateFormSpecs(args.program)
  if (specs.length === 0) return null

  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()

  const overrideByCode = new Map(
    (args.operationalOverrides ?? []).map(item => [item.templateCode, item])
  )
  const ownedByCode = new Map<string, DraftOwnedFormVersion>()

  for (const spec of specs) {
    // 캐시 직접 조회 금지 — `ensureDraftOwnedFormVersion`이 발행/보관 여부를 확인해
    // 재시도 시 stale(이미 PUBLISHED)한 scoped 버전을 새 DRAFT로 교체한다.
    const owned = await ensureDraftOwnedFormVersion({
      programDraftId,
      templateCode: spec.templateCode,
    })

    const baseline = await loadFormTemplateVersionDraftByVersionId(
      spec.templateCode,
      owned.draftVersionId
    )

    if (spec.formType === 'REGISTRATION') {
      if (
        args.registration != null &&
        args.registration.templateCode === spec.templateCode
      ) {
        const persisted = await persistDraftOwnedFormVersion({
          programDraftId,
          templateCode: spec.templateCode,
          draft: args.registration.draft,
          overlay: args.registration.overlay,
          editorState: args.registration.editorState,
          baseline,
        })
        ownedByCode.set(spec.templateCode, persisted)
      } else {
        ownedByCode.set(spec.templateCode, owned)
      }
      continue
    }

    const override = overrideByCode.get(spec.templateCode)
    if (override != null) {
      const persisted = await persistDraftOwnedFormVersion({
        programDraftId,
        templateCode: spec.templateCode,
        draft: override.draft,
        overlay: override.overlay,
        editorState: override.editorState,
        baseline,
      })
      ownedByCode.set(spec.templateCode, persisted)
      continue
    }

    const overlay = collectOperationalOverlayForCatalogId(spec.templateCode)
    if (overlay == null || Object.keys(overlay).length === 0) {
      ownedByCode.set(spec.templateCode, owned)
      continue
    }

    const draft = baseline?.draft ?? createSeedDraftForOperationalCatalogId(spec.templateCode)
    if (draft == null) {
      ownedByCode.set(spec.templateCode, owned)
      continue
    }

    const persisted = await persistDraftOwnedFormVersion({
      programDraftId,
      templateCode: spec.templateCode,
      draft,
      overlay,
      editorState: baseline?.editorState,
      baseline,
    })
    ownedByCode.set(spec.templateCode, persisted)
  }

  const formBindings: ProgramFormBindingRequest[] = []

  for (const spec of specs) {
    const owned =
      ownedByCode.get(spec.templateCode) ??
      (await ensureDraftOwnedFormVersion({
        programDraftId,
        templateCode: spec.templateCode,
      }))

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
