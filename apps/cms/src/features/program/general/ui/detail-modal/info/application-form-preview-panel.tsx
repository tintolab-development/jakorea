import { useEffect, useMemo, useState } from 'react'
import type { Program } from '@/types/domain'
import {
  getInstitutionApplicationFormHiddenParagraphIds,
  patchInstitutionApplicationProgramBridge,
  resetInstitutionApplicationProgramBridge,
  resolveInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { buildGeneralApplicationFormPreviewParagraphBodyOptions } from '@/features/program/general/lib/application-form-preview-options'
import { resolveGeneralApplicationEditorVariant } from '@/features/program/general/lib/application-tabs'
import type { GeneralApplicationTabKey } from '@/features/program/general/lib/application-tabs'
import { resolveGeneralApplicationTemplateName } from '@/features/program/general/lib/resolve-application-template-name'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'
import {
  WRITING_FORM_TEMPLATE_SAVE_EVENT,
} from '@/features/template/lib/writing-form-template-local-save'
import { useProgramParticipantApplicationEditor } from '@/features/template/hooks/use-program-participant-application-editor'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import '@/features/template/ui/form-set/application-form/instructor/program-application-form-instructor.css'

export function ApplicationFormPreviewPanel({
  program,
  applicationTab,
  active,
  reloadKey = 0,
}: {
  program: Program
  applicationTab: GeneralApplicationTabKey
  active: boolean
  reloadKey?: number
}) {
  const variant = useMemo(
    () => resolveGeneralApplicationEditorVariant(program, applicationTab),
    [program, applicationTab]
  )
  const templateName = useMemo(() => resolveGeneralApplicationTemplateName(variant), [variant])
  const templateId = useMemo(
    () => getTemplateIdForParticipantApplicationVariant(variant),
    [variant]
  )
  const [editorActive, setEditorActive] = useState(false)

  useEffect(() => {
    if (!active) {
      setEditorActive(false)
      return
    }
    setEditorActive(true)
  }, [active, variant, reloadKey])

  useEffect(() => {
    if (!active) {
      resetInstitutionApplicationProgramBridge()
      return
    }
    if (variant !== 'institution') {
      resetInstitutionApplicationProgramBridge()
      return
    }
    patchInstitutionApplicationProgramBridge(resolveInstitutionApplicationProgramBridge(program))
    return () => {
      resetInstitutionApplicationProgramBridge()
    }
  }, [active, program, variant])

  const vm = useProgramParticipantApplicationEditor(editorActive, templateName, variant, {
    participantOrganization: variant === 'institution',
  })

  useEffect(() => {
    if (!active) return
    const handleSave = (event: Event) => {
      const detail = (event as CustomEvent<{ templateId?: string }>).detail
      if (detail?.templateId === templateId) {
        setEditorActive(false)
        queueMicrotask(() => setEditorActive(true))
      }
    }
    window.addEventListener(WRITING_FORM_TEMPLATE_SAVE_EVENT, handleSave)
    return () => window.removeEventListener(WRITING_FORM_TEMPLATE_SAVE_EVENT, handleSave)
  }, [active, templateId])

  const institutionBridge = resolveInstitutionApplicationProgramBridge(program)
  const hiddenParagraphIds = useMemo(() => {
    if (variant !== 'institution') return undefined
    return getInstitutionApplicationFormHiddenParagraphIds(institutionBridge)
  }, [institutionBridge, variant])

  const paragraphBodyOptions = useMemo(
    () =>
      buildGeneralApplicationFormPreviewParagraphBodyOptions(variant, vm, hiddenParagraphIds),
    [variant, vm, hiddenParagraphIds]
  )

  if (!active) return null

  return (
    <div className="application-view__preview-panel">
      <FormEditorLeftPanel
        paragraphs={vm.draft.paragraphs}
        titleNumbering={vm.draft.formSettings.titleNumbering}
        selectedCardId={null}
        onSelectCard={() => {}}
        onReorderMiddle={() => {}}
        updateParagraph={vm.updateParagraph}
        editorKind="horizontal_table"
        paragraphInteractionMode="user"
        showEditorChrome={false}
        structureLockedParagraphIds={vm.structureLockedParagraphIds}
        paragraphBodyOptions={paragraphBodyOptions}
        hideParagraphRequiredChrome={false}
      />
    </div>
  )
}
