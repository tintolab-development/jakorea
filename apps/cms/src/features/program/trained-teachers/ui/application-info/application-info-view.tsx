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
import { resolveGeneralApplicationTemplateName } from '@/features/program/general/lib/resolve-application-template-name'
import { isTrainedTeachersApplicationFormEditable } from '@/features/program/trained-teachers/lib/application-form-edit-policy'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'
import { WRITING_FORM_TEMPLATE_SAVE_EVENT } from '@/features/template/lib/writing-form-template-local-save'
import { useProgramParticipantApplicationEditor } from '@/features/template/hooks/use-program-participant-application-editor'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import { CmsButton } from '@/shared/ui'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
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

  useEffect(() => {
    patchInstitutionApplicationProgramBridge(resolveInstitutionApplicationProgramBridge(program))
    return () => {
      resetInstitutionApplicationProgramBridge()
    }
  }, [program])

  const vm = useProgramParticipantApplicationEditor(
    editorActive,
    templateName,
    TRAINED_TEACHERS_APPLICATION_VARIANT
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
          structureLockedParagraphIds: vm.structureLockedParagraphIds,
          structureLockedAuthoringChoicePreview: false,
          programApplicationFormTrainedTeachersInstitution: true,
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
  const formEditable = isTrainedTeachersApplicationFormEditable(program)

  return (
    <div className="application-view program-detail-fullpage-modal__info-tab">
      <CmsTextTabs
        className="application-view__tabs"
        activeKey="institutions"
        onChange={() => {}}
        items={[{ key: 'institutions', label: '참여 기관 신청 정보' }]}
        trailing={
          canWrite ? (
            <CmsButton onClick={onEditForm} disabled={!formEditable}>
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
