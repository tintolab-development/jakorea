import { useCallback, useEffect, useMemo } from 'react'
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
import { resolveGeneralApplicationTemplateName } from '@/features/program/general/lib/resolve-application-template-name'
import {
  useProgramParticipantApplicationEditor,
  type ProgramParticipantApplicationEditorVariant,
} from '@/features/template/hooks/use-program-participant-application-editor'
import {
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
  TEMPLATE_FORM_MODAL_DESCRIPTION,
} from '@/features/template/model/template-registry/template-registry'
import { resolveTemplateEditorPanels } from '@/features/template/ui/template-renderers/resolve-template-editor-panels'
import type { TemplateEditorVm } from '@/features/template/ui/template-renderers/template-renderer-types'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'
import { useCmsAlert } from '@/shared/ui'

export function GeneralProgramApplicationTemplateEditModal({
  open,
  program,
  applicationTab,
  variantOverride,
  onClose,
  onSaved,
}: {
  open: boolean
  program: Program
  applicationTab: GeneralApplicationTabKey
  /** 프로그램 유형 전용 신청 폼 variant (예: 교육받은 교사). 미지정 시 일반 프로그램 탭 기준 해석 */
  variantOverride?: ProgramParticipantApplicationEditorVariant
  onClose: () => void
  onSaved?: () => void
}) {
  const { showAlert } = useCmsAlert()
  const variant = useMemo(
    () => variantOverride ?? resolveGeneralApplicationEditorVariant(program, applicationTab),
    [variantOverride, program, applicationTab]
  )
  const templateName = useMemo(() => resolveGeneralApplicationTemplateName(variant), [variant])
  const definitionId = useMemo(
    () => getTemplateIdForParticipantApplicationVariant(variant),
    [variant]
  )
  const registryEntry = useMemo(() => lookupTemplateRegistry(definitionId), [definitionId])
  const headerTitle = useMemo(
    () => resolvePreviewHeaderTitle(registryEntry, templateName),
    [registryEntry, templateName]
  )

  useEffect(() => {
    if (!open) {
      resetInstitutionApplicationProgramBridge()
      return
    }
    if (variant !== 'institution' && variant !== 'trained-teachers-application-institution') return
    patchInstitutionApplicationProgramBridge(resolveInstitutionApplicationProgramBridge(program))
    return () => {
      resetInstitutionApplicationProgramBridge()
    }
  }, [open, program, variant])

  const vm = useProgramParticipantApplicationEditor(open, templateName, variant, {
    participantOrganization: variant === 'institution',
    programLinkedInstitutionApplicationForm: variant === 'institution',
    program,
    programLinkedApplicationFormPreview:
      variant === 'institution' ||
      variant === 'instructor' ||
      variant === 'volunteer' ||
      variant === 'trained-teachers-application-institution',
  })

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

  const handleSave = useCallback(() => {
    vm.handleSave()
    showAlert({ title: '안내', content: '양식이 저장되었습니다.' })
    onSaved?.()
  }, [onSaved, showAlert, vm])

  if (registryEntry == null) return null

  return (
    <TemplateFullpageModal
      open={open}
      onClose={onClose}
      title={headerTitle}
      description={TEMPLATE_FORM_MODAL_DESCRIPTION}
      templateTabType="writing"
      className="general-program-application-template-edit-modal"
      zIndex={1200}
      onPreview={vm.handlePreview}
      onSave={handleSave}
      leftContent={panels.leftContent}
      rightNavigation={panels.rightNavigation}
    />
  )
}
