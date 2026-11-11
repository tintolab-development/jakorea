import { useCallback, useEffect, useMemo } from 'react'
import { listIncompleteApplicationFormThirdPartyRecipientKeys } from '@/features/template/model/application-form-third-party-recipient'
import {
  RegistrationWizardValidationHighlightProvider,
  RegistrationWizardValidationHighlightSync,
  useDetailEditRequiredHighlightRequest,
} from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { showUpdateCompletedAlert, useCmsAlert } from '@/shared/ui'
import type { Program } from '@/types/domain'
import {
  patchInstitutionApplicationProgramBridge,
  resetInstitutionApplicationProgramBridge,
  resolveInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import {
  resolveGeneralApplicationEditorVariant,
  type GeneralApplicationTabKey,
} from '@/features/program/general/lib/application-tabs'
import { programForApplicationFormEditor } from '@/features/program/general/lib/operational-form-bindings'
import { resolveGeneralApplicationTemplateName } from '@/features/program/general/lib/resolve-application-template-name'
import { useProgramApplicationFormLoadSource } from '@/features/program/general/hooks/use-application-form-load-source'
import {
  useProgramParticipantApplicationEditor,
  type ProgramParticipantApplicationEditorVariant,
} from '@/features/template/hooks/use-program-participant-application-editor'
import {
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import { resolveTemplateEditorPanels } from '@/features/template/ui/template-renderers/resolve-template-editor-panels'
import type { TemplateEditorVm } from '@/features/template/ui/template-renderers/template-renderer-types'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'
import { FormDraftLoading } from '@/features/template/ui/form-draft-loading'
import { setOperationalOverlayScope } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import { seedOperationalOverlayFromProgramCatalog } from '@/features/program/general/lib/detail-operational-save-merge'
import { invalidateProgramFormBindingsCache } from '@/features/program/general/lib/sync-registration-form-bindings'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'

export function GeneralProgramApplicationTemplateEditModal({
  open,
  program,
  applicationTab,
  variantOverride,
  onClose,
  onSaved,
  tabItems,
  onApplicationTabChange,
  closeLabel,
}: {
  open: boolean
  program: Program
  applicationTab: GeneralApplicationTabKey
  /** 프로그램 유형 전용 신청 폼 variant (예: 교육받은 교사). 미지정 시 일반 프로그램 탭 기준 해석 */
  variantOverride?: ProgramParticipantApplicationEditorVariant
  onClose: () => void
  onSaved?: () => void
  /**
   * 있으면 본문 상단 좌측에 신청 정보 탭(참여 기관·강사·봉사자)을 노출한다(일반 프로그램 시안 01-2).
   * 생략 시 기존처럼 양식 안내 문구만 노출 — 1사1교·교육받은 교사 호출부.
   */
  tabItems?: { key: GeneralApplicationTabKey; label: string }[]
  onApplicationTabChange?: (tab: GeneralApplicationTabKey) => void
  /** 상단 좌측 닫기 버튼 라벨. 생략 시 템플릿 모달 기본(「닫기」) */
  closeLabel?: string
}) {
  const variant = useMemo(
    () => variantOverride ?? resolveGeneralApplicationEditorVariant(program, applicationTab),
    [variantOverride, program, applicationTab]
  )
  const scopedProgram = useMemo(
    () => programForApplicationFormEditor(program, variant),
    [program, variant]
  )
  const templateName = useMemo(() => resolveGeneralApplicationTemplateName(variant), [variant])
  const definitionId = useMemo(
    () => getTemplateIdForParticipantApplicationVariant(variant),
    [variant]
  )
  const registryEntry = useMemo(() => lookupTemplateRegistry(definitionId), [definitionId])
  const remoteStrict =
    variant === 'trained-teachers-application-institution' &&
    shouldUseTrainedTeacherProgramsRemoteApi()
  const headerTitle = useMemo(
    () => resolvePreviewHeaderTitle(registryEntry, templateName),
    [registryEntry, templateName]
  )

  useEffect(() => {
    if (!open) {
      resetInstitutionApplicationProgramBridge()
    }
  }, [open])

  useEffect(() => {
    if (!open || remoteStrict) return
    setOperationalOverlayScope(definitionId)
    seedOperationalOverlayFromProgramCatalog(scopedProgram, definitionId)
  }, [open, definitionId, remoteStrict, scopedProgram])

  useEffect(() => {
    if (!open) return
    if (
      variant !== 'institution' &&
      variant !== 'individual' &&
      variant !== 'economy-application-institution' &&
      variant !== 'trained-teachers-application-institution'
    ) {
      return
    }
    patchInstitutionApplicationProgramBridge(
      resolveInstitutionApplicationProgramBridge(scopedProgram)
    )
    return () => {
      resetInstitutionApplicationProgramBridge()
    }
  }, [open, scopedProgram, variant])

  const formSource = useProgramApplicationFormLoadSource(scopedProgram, variant, {
    remoteStrict,
  })

  const vm = useProgramParticipantApplicationEditor(
    open && !formSource.bindingsLoading && formSource.unavailableReason == null,
    templateName,
    variant,
    {
    participantOrganization: variant === 'institution',
    programLinkedInstitutionApplicationForm:
      variant === 'institution' || variant === 'economy-application-institution',
    program: scopedProgram,
    programLinkedApplicationFormPreview:
      variant === 'institution' ||
      variant === 'individual' ||
      variant === 'instructor' ||
      variant === 'volunteer' ||
      variant === 'economy-application-institution' ||
      variant === 'trained-teachers-application-institution',
    templateVersionId: formSource.templateVersionId,
    preferLocalDraft: formSource.preferLocalDraft,
    requireRemoteDraft: remoteStrict,
    }
  )

  const editorVm = useMemo((): TemplateEditorVm => {
    return {
      registryEntry,
      isProgramRegistration: false,
      isUjatProgramRegistration: false,
      isParticipantApplication: true,
      isWritingSurveyList: false,
      programParticipantApplicationVm: vm,
      handleSave: vm.handleSave,
    } as unknown as TemplateEditorVm
  }, [registryEntry, vm])

  const panels = useMemo(
    () =>
      resolveTemplateEditorPanels({
        registryEntry,
        editorVm,
        generic: {
          orderedLeftContentConfig: [],
          activeCardId: null,
          setActiveCardId: () => {},
          applyOrderedCards: () => {},
          rightNavigationConfig: { sectionTitle: '커스텀 필드', items: [] },
        },
      }),
    [registryEntry, editorVm]
  )

  const { showAlert } = useCmsAlert()
  const detailRequiredHighlight = useDetailEditRequiredHighlightRequest()

  useEffect(() => {
    if (!open) detailRequiredHighlight.clear()
  }, [detailRequiredHighlight.clear, open])

  const handleSave = useCallback(async () => {
    const incompleteKeys = listIncompleteApplicationFormThirdPartyRecipientKeys(vm.draft)
    if (incompleteKeys.length > 0) {
      detailRequiredHighlight.report(incompleteKeys)
      void showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    try {
      await vm.handleSave()
      detailRequiredHighlight.clear()
      invalidateProgramFormBindingsCache(scopedProgram.id)
      onSaved?.()
      showUpdateCompletedAlert()
    } catch {
      // useProgramParticipantApplicationEditor / form-template-save-feedback에서 안내
    }
  }, [detailRequiredHighlight, onSaved, scopedProgram.id, showAlert, vm])

  if (registryEntry == null) return null

  return (
    <RegistrationWizardValidationHighlightProvider variant="general">
    <RegistrationWizardValidationHighlightSync
      nonce={detailRequiredHighlight.request.nonce}
      keys={detailRequiredHighlight.request.keys}
      variant="general"
    />
    <TemplateFullpageModal
      open={open}
      onClose={onClose}
      title={headerTitle}
      bodyHeaderLeading={
        tabItems != null && tabItems.length > 0 ? (
          <CmsTextTabs
            className="application-view__tabs"
            activeKey={applicationTab}
            onChange={key => onApplicationTabChange?.(key as GeneralApplicationTabKey)}
            items={tabItems}
          />
        ) : undefined
      }
      closeLabel={closeLabel}
      templateTabType="writing"
      className="general-program-application-template-edit-modal"
      zIndex={1200}
      onPreview={vm.handlePreview}
      onSave={handleSave}
      leftContent={
        formSource.unavailableReason != null || vm.remoteDraftLoadError != null ? (
          <div className="form-draft-unavailable" role="alert">
            {formSource.unavailableReason ?? '원격 신청 양식을 불러올 수 없습니다.'}
          </div>
        ) : vm.isDraftLoading ? (
          <FormDraftLoading />
        ) : (
          panels.leftContent
        )
      }
      rightNavigation={
        formSource.unavailableReason != null || vm.remoteDraftLoadError != null || vm.isDraftLoading
          ? null
          : panels.rightNavigation
      }
    />
    </RegistrationWizardValidationHighlightProvider>
  )
}
