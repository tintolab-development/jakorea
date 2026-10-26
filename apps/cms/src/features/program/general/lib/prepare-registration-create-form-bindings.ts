import type { Program } from '@/types/domain'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import { listAllRegistrationCreateFormSpecs } from '@/features/program/general/lib/operational-form-bindings'
import { collectOperationalOverlayForCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { shouldUseRegistrationCreateFormBindings } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import type {
  RegistrationCreateFormBindingsPayload,
  RegistrationFormApplyItem,
} from '@/features/program/general/lib/build-registration-create-form-bindings'
import { loadRegistrationWizardFormDraft } from '@/features/program/general/lib/registration-wizard-form-draft'
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
 * 등록 완료 — CREATE 후 프로그램 전용 COPY로 적용할 양식 목록을 **순수 데이터로** 모은다.
 * 서버 임시저장 / draft-owned COPY·PUT·publish는 하지 않는다(방안 C).
 * CREATE는 `autoApplyDefaultFormBindings: true`로 카탈로그 기본 양식을 붙이고,
 * 여기서 모은 양식은 `applyRegistrationFormsAfterCreate`가 CREATE 직후 적용한다.
 * 변경이 없는 양식(로컬 초안·overlay·override 없음)은 기본 바인딩을 그대로 쓴다.
 */
export async function prepareRegistrationCreateFormBindings(args: {
  program: Program
  registration?: RegistrationFormFlushInput
  operationalOverrides?: OperationalFormFlushOverride[]
}): Promise<RegistrationCreateFormBindingsPayload | null> {
  if (!shouldUseRegistrationCreateFormBindings()) return null

  const programDraftType = resolveRegistrationProgramDraftProgramType(args.program)
  const specs = listAllRegistrationCreateFormSpecs(args.program)
  if (specs.length === 0) return null

  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()

  const overrideByCode = new Map(
    (args.operationalOverrides ?? []).map(item => [item.templateCode, item])
  )
  const forms: RegistrationFormApplyItem[] = []
  // 같은 templateCode가 여러 단계에 매핑되면(1사1교: 기관·강사 탭 → recruitment/application-economy)
  // 내용(templateCode 기준 초안·overlay)이 같으므로 한 번만 적용한다. 중복 COPY·바인딩 덮어쓰기 방지.
  const seenTemplateCodes = new Set<string>()

  for (const spec of specs) {
    if (seenTemplateCodes.has(spec.templateCode)) continue
    seenTemplateCodes.add(spec.templateCode)
    if (spec.formType === 'REGISTRATION') {
      if (args.registration != null && args.registration.templateCode === spec.templateCode) {
        forms.push({
          templateCode: spec.templateCode,
          formType: spec.formType,
          draft: args.registration.draft,
          overlay: args.registration.overlay,
          editorState: args.registration.editorState,
        })
      }
      continue
    }

    const override = overrideByCode.get(spec.templateCode)
    if (override != null) {
      forms.push({
        templateCode: spec.templateCode,
        formType: spec.formType,
        draft: override.draft,
        overlay: override.overlay,
        editorState: override.editorState,
      })
      continue
    }

    const overlay =
      spec.templateCode === 'recruitment-trained-teachers' ||
      spec.templateCode === 'application-trained-teachers'
        ? null
        : collectOperationalOverlayForCatalogId(spec.templateCode)
    const wizardSaved = await loadRegistrationWizardFormDraft({
      programType: programDraftType,
      templateCode: spec.templateCode,
    })
    const hasWizardOperationalDraft =
      wizardSaved?.draft != null && wizardSaved.draft.paragraphs.length > 0
    const hasOverlay = overlay != null && Object.keys(overlay).length > 0
    if (!hasWizardOperationalDraft && !hasOverlay) continue

    forms.push({
      templateCode: spec.templateCode,
      formType: spec.formType,
      draft: hasWizardOperationalDraft ? wizardSaved!.draft : null,
      overlay: hasOverlay ? overlay! : wizardSaved?.overlay,
      editorState: wizardSaved?.editorState,
      settingsJson: wizardSaved?.settingsJson,
    })
  }

  return { forms }
}
