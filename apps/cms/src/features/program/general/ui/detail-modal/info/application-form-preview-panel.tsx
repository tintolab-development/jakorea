import { useEffect, useMemo, useState } from 'react'
import type { Program } from '@/types/domain'
import {
  resetInstitutionApplicationFormVisibility,
  useInstitutionApplicationFormVisibilityVersion,
} from '@/features/program/general/lib/institution-application-form-visibility'
import {
  patchInstitutionApplicationProgramBridge,
  resetInstitutionApplicationProgramBridge,
  resolveInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { buildGeneralApplicationFormPreviewParagraphBodyOptions } from '@/features/program/general/lib/application-form-preview-options'
import { buildInstructorAvailableScheduleSlotsFromProgram } from '@/features/program/general/lib/instructor-application-available-schedule'
import { resolveGeneralApplicationEditorVariant } from '@/features/program/general/lib/application-tabs'
import type { GeneralApplicationTabKey } from '@/features/program/general/lib/application-tabs'
import { programForApplicationFormEditor } from '@/features/program/general/lib/operational-form-bindings'
import { resolveGeneralApplicationTemplateName } from '@/features/program/general/lib/resolve-application-template-name'
import { useProgramApplicationFormLoadSource } from '@/features/program/general/hooks/use-application-form-load-source'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'
import {
  WRITING_FORM_TEMPLATE_SAVE_EVENT,
} from '@/features/template/lib/writing-form-template-local-save'
import { useProgramParticipantApplicationEditor } from '@/features/template/hooks/use-program-participant-application-editor'
import { FormDraftLoading } from '@/features/template/ui/form-draft-loading'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import '@/features/template/ui/form-set/application-form/instructor/program-application-form-instructor.css'
import '@/features/template/ui/form-set/application-form/volunteer/program-application-form-volunteer.css'

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
  const scopedProgram = useMemo(
    () => programForApplicationFormEditor(program, variant),
    [program, variant]
  )
  const templateName = useMemo(() => resolveGeneralApplicationTemplateName(variant), [variant])
  const templateId = useMemo(
    () => getTemplateIdForParticipantApplicationVariant(variant),
    [variant]
  )
  const formSource = useProgramApplicationFormLoadSource(scopedProgram, variant)
  const [editorActive, setEditorActive] = useState(false)

  useEffect(() => {
    if (!active) {
      setEditorActive(false)
      return
    }
    if (formSource.bindingsLoading) {
      setEditorActive(false)
      return
    }
    setEditorActive(true)
  }, [active, variant, reloadKey, formSource.bindingsLoading, formSource.templateVersionId])

  useEffect(() => {
    if (!active) return
    if (
      variant === 'institution' ||
      variant === 'individual' ||
      variant === 'economy-application-institution'
    ) {
      patchInstitutionApplicationProgramBridge(
        resolveInstitutionApplicationProgramBridge(scopedProgram)
      )
    }
    return () => {
      resetInstitutionApplicationProgramBridge()
      resetInstitutionApplicationFormVisibility()
    }
  }, [active, scopedProgram, variant])

  const vm = useProgramParticipantApplicationEditor(editorActive, templateName, variant, {
    participantOrganization: variant === 'institution',
    program: scopedProgram,
    programLinkedApplicationFormPreview:
      variant === 'institution' ||
      variant === 'individual' ||
      variant === 'economy-application-institution' ||
      variant === 'instructor' ||
      variant === 'volunteer',
    templateVersionId: formSource.templateVersionId,
    preferLocalDraft: formSource.preferLocalDraft,
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

  const institutionBridge = useMemo(
    () => resolveInstitutionApplicationProgramBridge(scopedProgram),
    [scopedProgram]
  )
  useInstitutionApplicationFormVisibilityVersion()
  const instructorScheduleSlots = useMemo(
    () =>
      variant === 'instructor'
        ? buildInstructorAvailableScheduleSlotsFromProgram(scopedProgram)
        : undefined,
    [variant, scopedProgram]
  )

  const paragraphBodyOptions = useMemo(
    () =>
      buildGeneralApplicationFormPreviewParagraphBodyOptions(variant, vm, {
        program: scopedProgram,
        paragraphs: vm.draft.paragraphs,
        institutionBridge,
        instructorScheduleSlots,
        programLinkedApplicationFormPreview:
          variant === 'institution' ||
          variant === 'individual' ||
          variant === 'economy-application-institution',
      }),
    [
      variant,
      vm.structureLockedParagraphIds,
      vm.programApplicationFormInstructorOptions,
      vm.programApplicationFormVolunteerOptions,
      vm.draft.paragraphs,
      scopedProgram,
      institutionBridge,
      instructorScheduleSlots,
    ]
  )

  if (!active) return null

  if (vm.isDraftLoading) {
    return (
      <div className="application-view__preview-panel application-view__preview-panel--loading">
        <FormDraftLoading />
      </div>
    )
  }

  return (
    <div className="application-view__preview-panel application-view__preview-panel--readonly">
      <FormEditorLeftPanel
        paragraphs={vm.draft.paragraphs}
        titleNumbering={vm.draft.formSettings.titleNumbering}
        selectedCardId={null}
        onSelectCard={() => {}}
        onReorderMiddle={() => {}}
        updateParagraph={vm.updateParagraph}
        editorKind="horizontal_table"
        paragraphInteractionMode="preview"
        showEditorChrome={false}
        structureLockedParagraphIds={vm.structureLockedParagraphIds}
        paragraphBodyOptions={paragraphBodyOptions}
        hideParagraphRequiredChrome={false}
      />
    </div>
  )
}
