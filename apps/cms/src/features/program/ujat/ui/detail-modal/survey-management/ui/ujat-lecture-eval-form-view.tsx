import { useCallback, useEffect, useRef, useState } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import type {
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import {
  UJAT_LECTURE_EVAL_STRUCTURE_LOCKED_IDS,
  UJAT_LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
} from '../lib/ujat-lecture-eval-survey'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import './ujat-lecture-eval.css'

export type UjatLectureEvalFormViewProps = {
  draft: WritingFormDraft
  submitButtonLabel: string
  showSubmitButton: boolean
  onDraftChange: (draft: WritingFormDraft) => void
  onSubmitClick: () => void
}

export function UjatLectureEvalFormView({
  draft,
  submitButtonLabel,
  showSubmitButton,
  onDraftChange,
  onSubmitClick,
}: UjatLectureEvalFormViewProps) {
  const [localDraft, setLocalDraft] = useState(draft)
  const onDraftChangeRef = useRef(onDraftChange)
  onDraftChangeRef.current = onDraftChange

  useEffect(() => {
    setLocalDraft(draft)
    onDraftChangeRef.current(draft)
  }, [draft])

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setLocalDraft(prev => {
        const next = {
          ...prev,
          paragraphs: prev.paragraphs.map(paragraph =>
            paragraph.id === id ? updater(paragraph) : paragraph
          ),
        }
        onDraftChangeRef.current(next)
        return next
      })
    },
    []
  )
  const handleSelectCard = useCallback(() => {}, [])
  const handleReorderMiddle = useCallback(() => {}, [])

  return (
    <div className="ujat-lecture-eval-form">
      <div className="ujat-lecture-eval-form__scroll">
        <FormEditorLeftPanel
          paragraphs={localDraft.paragraphs}
          titleNumbering={localDraft.formSettings.titleNumbering}
          selectedCardId={null}
          onSelectCard={handleSelectCard}
          onReorderMiddle={handleReorderMiddle}
          updateParagraph={updateParagraph}
          editorKind="survey"
          paragraphInteractionMode="user"
          showEditorChrome={false}
          structureLockedParagraphIds={UJAT_LECTURE_EVAL_STRUCTURE_LOCKED_IDS}
          hideDragHandleForParagraphIds={UJAT_LECTURE_EVAL_STRUCTURE_LOCKED_IDS}
          paragraphBodyOptions={UJAT_LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS}
        />
      </div>
      {showSubmitButton ? (
        <div className="ujat-lecture-eval-form__footer">
          <CmsButton className="ujat-lecture-eval-form__submit-button"
            size="large"
            onClick={onSubmitClick} >
            {submitButtonLabel}
          </CmsButton>
        </div>
      ) : null}
    </div>
  )
}
