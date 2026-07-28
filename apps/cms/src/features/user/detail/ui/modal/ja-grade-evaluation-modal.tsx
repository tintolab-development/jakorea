import { CloseOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  normalizeWritingFormDraft,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { changeInstructorEvaluationGradeRemote } from '@/features/user/api/members-api-client'
import { buildJaGradeEvaluationDraft } from '@/features/user/detail/lib/ja-grade-evaluation-draft'
import {
  buildJaGradeEvaluationReason,
  calculateJaGradeEvaluationFromDraft,
  validateJaGradeEvaluationDraft,
} from '@/features/user/detail/lib/ja-grade-evaluation-score'
import {
  loadJaGradeEvaluationRecord,
  saveJaGradeEvaluationRecord,
} from '@/features/user/detail/lib/ja-grade-evaluation-store'
import { JA_GRADE_SCALE_QUESTION_IDS } from '@/features/user/detail/lib/ja-grade-evaluation-constants'
import { handleError } from '@/shared/utils/error-handler'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import './ja-grade-evaluation-modal.css'

const JA_GRADE_EVALUATION_MODAL_Z_INDEX = 1200

export interface JaGradeEvaluationModalProps {
  open: boolean
  instructorMemberId: number | null | undefined
  scheduleChangeCount?: number
  lateReportCount?: number
  onClose: () => void
  onComplete: (payload: { grade: string; totalScore: number }) => void
}

export function JaGradeEvaluationModal({
  open,
  instructorMemberId,
  scheduleChangeCount = 0,
  lateReportCount = 0,
  onClose,
  onComplete,
}: JaGradeEvaluationModalProps) {
  const { showAlert } = useCmsAlert()
  const [draft, setDraft] = useState<WritingFormDraft | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setDraft(null)
      setSubmitting(false)
      return
    }
    if (instructorMemberId == null) {
      setDraft(null)
      return
    }
    const stored = loadJaGradeEvaluationRecord(instructorMemberId)
    setDraft(buildJaGradeEvaluationDraft(stored))
  }, [instructorMemberId, open])

  const updateParagraph = useCallback(
    (id: string, updater: (paragraph: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => {
        if (prev == null) return prev
        return normalizeWritingFormDraft({
          ...prev,
          paragraphs: prev.paragraphs.map(paragraph =>
            paragraph.id === id ? updater(paragraph) : paragraph
          ),
        })
      })
    },
    []
  )

  const structureLockedParagraphIds = useMemo(
    () => new Set<string>(JA_GRADE_SCALE_QUESTION_IDS),
    []
  )

  const handleSubmit = useCallback(async () => {
    if (draft == null || instructorMemberId == null) return

    const validation = validateJaGradeEvaluationDraft(draft)
    if (!validation.valid) {
      showAlert({
        title: '안내',
        content: validation.message,
      })
      return
    }

    let result
    try {
      result = calculateJaGradeEvaluationFromDraft(draft, {
        scheduleChangeCount,
        lateReportCount,
      })
    } catch (error) {
      handleError(error, { defaultMessage: '등급 산출에 실패했습니다.' })
      return
    }

    setSubmitting(true)
    try {
      const reason = buildJaGradeEvaluationReason(result)

      if (instructorMemberId != null) {
        await changeInstructorEvaluationGradeRemote(instructorMemberId, {
          grade: result.grade,
          reason,
        })

        saveJaGradeEvaluationRecord({
          memberId: instructorMemberId,
          q1ItemId: result.qItemIds[0],
          q2ItemId: result.qItemIds[1],
          q3ItemId: result.qItemIds[2],
          q4ItemId: result.qItemIds[3],
          comment: result.comment || undefined,
          grade: result.grade,
          fixedTotal: result.fixedTotal,
          penalty: result.penalty,
          totalScore: result.totalScore,
          savedAt: new Date().toISOString(),
        })
      }

      onComplete({ grade: result.grade, totalScore: result.totalScore })
    } catch (error) {
      handleError(error, { defaultMessage: 'JA 등급 평가 저장에 실패했습니다.' })
    } finally {
      setSubmitting(false)
    }
  }, [
    draft,
    instructorMemberId,
    lateReportCount,
    onComplete,
    scheduleChangeCount,
    showAlert,
  ])

  const modalTitle = 'JA 등급 평가지'

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      zIndex={JA_GRADE_EVALUATION_MODAL_Z_INDEX}
      className="full-page-modal ja-grade-evaluation-modal"
    >
      <div className="full-page-modal__layout">
        <header className="full-page-modal__topbar ja-grade-evaluation-modal__topbar">
          <div className="full-page-modal__title ja-grade-evaluation-modal__title-wrap">
            <span className="full-page-modal__title-text">{modalTitle}</span>
          </div>
          <button
            type="button"
            className="full-page-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseOutlined />
          </button>
        </header>

        <div className="full-page-modal__body">
          <div className="ja-grade-evaluation-modal__workspace">
            {draft != null ? (
              <div className="ja-grade-evaluation-modal__form-panel">
                <FormEditorLeftPanel
                  paragraphs={draft.paragraphs}
                  titleNumbering={draft.formSettings.titleNumbering}
                  selectedCardId={null}
                  onSelectCard={() => {}}
                  onReorderMiddle={() => {}}
                  updateParagraph={updateParagraph}
                  editorKind="survey"
                  singleItemListActiveItemId={null}
                  paragraphInteractionMode="user"
                  showEditorChrome={false}
                  structureLockedParagraphIds={structureLockedParagraphIds}
                  paragraphBodyOptions={{ paragraphInteractionMode: 'user' }}
                />
              </div>
            ) : null}
          </div>

          <footer className="ja-grade-evaluation-modal__footer">
            <div className="ja-grade-evaluation-modal__footer-inner">
              <CmsButton
                type="button"
                size="large"
                width="100%"
                className="ja-grade-evaluation-modal__submit"
                disabled={draft == null || submitting || instructorMemberId == null}
                loading={submitting}
                onClick={() => {
                  void handleSubmit()
                }}
              >
                JA 등급 평가 완료하기
              </CmsButton>
            </div>
          </footer>
        </div>
      </div>
    </TealHeaderModal>
  )
}
