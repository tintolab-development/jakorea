import { useCallback } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import type {
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import {
  LECTURE_EVAL_STRUCTURE_LOCKED_IDS,
  LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
} from '../../lib/survey-management/lecture-eval-survey'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import './survey-management.css'

export type LectureEvalFormViewProps = {
  draft: WritingFormDraft
  submitButtonLabel: string
  showSubmitButton: boolean
  onDraftChange: (draft: WritingFormDraft) => void
  onSubmitClick: () => void
}

export function LectureEvalFormView({
  draft,
  submitButtonLabel,
  showSubmitButton,
  onDraftChange,
  onSubmitClick,
}: LectureEvalFormViewProps) {
  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      onDraftChange({
        ...draft,
        paragraphs: draft.paragraphs.map(p => (p.id === id ? updater(p) : p)),
      })
    },
    [draft, onDraftChange]
  )

  return (
    <div className="ujat-lecture-eval-form">
      <div className="ujat-lecture-eval-form__scroll">
        <FormEditorLeftPanel
          paragraphs={draft.paragraphs}
          titleNumbering={draft.formSettings.titleNumbering}
          selectedCardId={null}
          onSelectCard={() => {}}
          onReorderMiddle={() => {}}
          updateParagraph={updateParagraph}
          editorKind="survey"
          paragraphInteractionMode="user"
          showEditorChrome={false}
          structureLockedParagraphIds={LECTURE_EVAL_STRUCTURE_LOCKED_IDS}
          hideDragHandleForParagraphIds={LECTURE_EVAL_STRUCTURE_LOCKED_IDS}
          paragraphBodyOptions={LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS}
        />
      </div>
      {showSubmitButton ? (
        <div className="ujat-lecture-eval-form__footer">
          <CmsButton
            className="ujat-lecture-eval-form__submit-button"
            width="100%"
            size="large"
            onClick={onSubmitClick}
          >
            {submitButtonLabel}
          </CmsButton>
        </div>
      ) : null}
    </div>
  )
}
