import type { Program } from '@/types/domain'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  isSystemCatalogOnlyFormType,
  listAllRegistrationCreateFormSpecs,
} from '@/features/program/general/lib/operational-form-bindings'
import { resolveProgramOperationalBindingKind } from '@/features/program/general/lib/program-operational-binding-profile'
import { collectOperationalOverlayForCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { shouldUseRegistrationCreateFormBindings } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import type {
  RegistrationCreateFormBindingsPayload,
  RegistrationFormApplyItem,
} from '@/features/program/general/lib/build-registration-create-form-bindings'
import { loadRegistrationWizardFormDraft } from '@/features/program/general/lib/registration-wizard-form-draft'
import { resolveRegistrationProgramDraftProgramType } from '@/features/program/general/lib/resolve-program-api-type-for-draft'
import {
  peekDirtyTrainedTeachersApplicationOverlayRecord,
  peekDirtyTrainedTeachersRecruitmentOverlayRecord,
} from '@/features/program/trained-teachers/lib/registration-rhf-api'
import {
  peekActiveUjatRecruitInstitutionOverlayRecord,
  peekActiveUjatRecruitVolunteerOverlayRecord,
} from '@/features/program/ujat/lib/ujat-registration-rhf-api'

/** 수정하지 않은 신청 양식도 프로그램 전용 COPY로 발행해야 하는 프로그램 유형(GENERAL만). */
function shouldAlwaysApplyApplicationForms(program: Program): boolean {
  return resolveProgramOperationalBindingKind(program) === 'GENERAL'
}

function overlayRecordHasUserValues(record: Record<string, unknown> | null | undefined): boolean {
  if (record == null) return false
  return Object.entries(record).some(([key, value]) => {
    if (key.toLowerCase().includes('announcementpublished') && value === true) return false
    if (value == null) return false
    if (typeof value === 'string') return value.trim() !== ''
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return Number.isFinite(value)
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') {
      return overlayRecordHasUserValues(value as Record<string, unknown>)
    }
    return true
  })
}

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
 * 단 GENERAL 프로그램의 APPLICATION 양식(개인·기관·강사·봉사자)은 수정 여부와 상관없이 항상 포함한다.
 * BE 자동 적용이 카탈로그 DRAFT 버전(v148 sync)을 그대로 바인딩할 수 있고, 포털 resolver는 PUBLISHED만 읽기 때문에
 * 프로그램 전용 COPY로 발행해 두지 않으면 신청 양식이 "미설정"(APPLICATION_FORM_NOT_CONFIGURED)이 된다.
 * UJAT·1사1교·교육받은 교사는 기존 동작(수정한 양식만)을 유지한다.
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
  const alwaysApplyApplicationForms = shouldAlwaysApplyApplicationForms(args.program)
  // 같은 templateCode가 여러 단계에 매핑되면(1사1교: 기관·강사 탭 → recruitment/application-economy)
  // 내용(templateCode 기준 초안·overlay)이 같으므로 한 번만 적용한다. 중복 COPY·바인딩 덮어쓰기 방지.
  const seenTemplateCodes = new Set<string>()

  for (const spec of specs) {
    if (seenTemplateCodes.has(spec.templateCode)) continue
    seenTemplateCodes.add(spec.templateCode)
    // 등록/발급/인증서는 시스템 제공 양식만 사용한다. CREATE 후 COPY하지 않는다.
    if (isSystemCatalogOnlyFormType(spec.formType)) continue

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
      spec.templateCode === 'recruitment-trained-teachers'
        ? peekDirtyTrainedTeachersRecruitmentOverlayRecord()
        : spec.templateCode === 'application-trained-teachers'
          ? peekDirtyTrainedTeachersApplicationOverlayRecord()
          : spec.templateCode === 'recruitment-ujat-school'
            ? peekActiveUjatRecruitInstitutionOverlayRecord()
            : spec.templateCode === 'recruitment-ujat-volunteer'
              ? peekActiveUjatRecruitVolunteerOverlayRecord()
              : collectOperationalOverlayForCatalogId(spec.templateCode)
    const wizardSaved = await loadRegistrationWizardFormDraft({
      programType: programDraftType,
      templateCode: spec.templateCode,
    })
    const hasWizardOperationalDraft =
      wizardSaved?.draft != null && wizardSaved.draft.paragraphs.length > 0
    const hasOverlay = overlayRecordHasUserValues(overlay)
    if (!hasWizardOperationalDraft && !hasOverlay) {
      // 수정하지 않은 GENERAL 신청 양식: 본문 없이 담아 두면 `applyOne`이 바인딩된 카탈로그 버전 본문을
      // (loadFormTemplateVersionDraftByVersionId → createSeedDraftForOperationalCatalogId 순) 채워 COPY·발행한다.
      if (alwaysApplyApplicationForms && spec.formType === 'APPLICATION') {
        forms.push({ templateCode: spec.templateCode, formType: spec.formType, draft: null })
      }
      continue
    }

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
