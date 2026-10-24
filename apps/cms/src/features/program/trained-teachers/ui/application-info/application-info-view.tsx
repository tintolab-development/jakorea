/**
 * 교육받은 교사 프로그램 상세 — 신청 정보 탭.
 * 참여 기관 신청 정보 단일 탭 + 양식 미리보기(읽기 전용) + 양식 수정(모집 시작 전까지만).
 */

import { useEffect, useMemo, useState } from 'react'
import type { Program } from '@/types/domain'
import {
  patchInstitutionApplicationProgramBridge,
  resetInstitutionApplicationProgramBridge,
  resolveInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { useProgramApplicationFormLoadSource } from '@/features/program/general/hooks/use-application-form-load-source'
import { resolveGeneralApplicationTemplateName } from '@/features/program/general/lib/resolve-application-template-name'
import { isTrainedTeachersApplicationFormEditable } from '@/features/program/trained-teachers/lib/application-form-edit-policy'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import {
  PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE,
  PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE,
} from '@/shared/lib/program-edit-window-error-message'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'
import { WRITING_FORM_TEMPLATE_SAVE_EVENT } from '@/features/template/lib/writing-form-template-local-save'
import { useProgramParticipantApplicationEditor } from '@/features/template/hooks/use-program-participant-application-editor'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import { CmsButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { FormDraftLoading } from '@/features/template/ui/form-draft-loading'
import '@/features/program/general/ui/detail-modal/info/application-view.css'

const TRAINED_TEACHERS_APPLICATION_VARIANT = 'trained-teachers-application-institution' as const

function TrainedTeachersApplicationFormPreviewPanel({ program }: { program: Program }) {
  const templateName = useMemo(
    () => resolveGeneralApplicationTemplateName(TRAINED_TEACHERS_APPLICATION_VARIANT),
    []
  )
  const templateId = useMemo(
    () => getTemplateIdForParticipantApplicationVariant(TRAINED_TEACHERS_APPLICATION_VARIANT),
    []
  )
  const [editorActive, setEditorActive] = useState(true)
  const remoteStrict = shouldUseTrainedTeacherProgramsRemoteApi()

  useEffect(() => {
    patchInstitutionApplicationProgramBridge(resolveInstitutionApplicationProgramBridge(program))
    return () => {
      resetInstitutionApplicationProgramBridge()
    }
  }, [program])

  const formSource = useProgramApplicationFormLoadSource(program, TRAINED_TEACHERS_APPLICATION_VARIANT, {
    remoteStrict,
  })

  const vm = useProgramParticipantApplicationEditor(
    editorActive && !formSource.bindingsLoading && formSource.unavailableReason == null,
    templateName,
    TRAINED_TEACHERS_APPLICATION_VARIANT,
    {
      program,
      programLinkedApplicationFormPreview: true,
      templateVersionId: formSource.templateVersionId,
      preferLocalDraft: formSource.preferLocalDraft,
      requireRemoteDraft: remoteStrict,
    }
  )

  useEffect(() => {
    const handleSave = (event: Event) => {
      const detail = (event as CustomEvent<{ templateId?: string }>).detail
      if (detail?.templateId === templateId) {
        setEditorActive(false)
        queueMicrotask(() => setEditorActive(true))
      }
    }
    window.addEventListener(WRITING_FORM_TEMPLATE_SAVE_EVENT, handleSave)
    return () => window.removeEventListener(WRITING_FORM_TEMPLATE_SAVE_EVENT, handleSave)
  }, [templateId])

  if (formSource.unavailableReason != null || vm.remoteDraftLoadError != null) {
    return (
      <div className="application-view__preview-panel application-view__preview-panel--error">
        <p>원격 신청 양식을 불러올 수 없습니다.</p>
      </div>
    )
  }

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
        paragraphBodyOptions={{
          ...vm.leftPanelParagraphBodyOptions,
          structureLockedParagraphIds: vm.structureLockedParagraphIds,
          structureLockedAuthoringChoicePreview: false,
          programApplicationFormTrainedTeachersInstitution: true,
          programLinkedInstitutionApplicationForm: true,
        }}
        hideParagraphRequiredChrome={false}
      />
    </div>
  )
}

export function TrainedTeachersApplicationInfoView({
  program,
  canWrite,
  onEditForm,
  previewReloadKey = 0,
}: {
  program: Program
  canWrite: boolean
  onEditForm: () => void
  previewReloadKey?: number
}) {
  const { showAlert } = useCmsAlert()
  const formEditable = isTrainedTeachersApplicationFormEditable(program)

  const handleEditFormClick = () => {
    if (!formEditable) {
      showAlert({
        title: PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE,
        content: PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE,
      })
      return
    }
    onEditForm()
  }

  return (
    <div className="application-view program-detail-fullpage-modal__info-tab">
      <CmsTextTabs
        className="application-view__tabs"
        activeKey="institutions"
        onChange={() => {}}
        items={[{ key: 'institutions', label: '참여 기관 신청 정보' }]}
        trailing={
          canWrite ? (
            <CmsButton
              variant="secondary"
              size="large"
              onClick={handleEditFormClick}
            >
              양식 수정
            </CmsButton>
          ) : null
        }
      />
      <div className="application-view__body">
        <div className="application-view__notice" role="status">
          <p className="application-view__notice-text">현재 화면은 양식 미리보기 화면입니다.</p>
        </div>
        {/* 양식 수정 저장 시 key 변경으로 remount → 최신 저장본 미리보기 */}
        <TrainedTeachersApplicationFormPreviewPanel key={previewReloadKey} program={program} />
        <div className="application-view__body-bottom" aria-hidden="true" />
      </div>
    </div>
  )
}
