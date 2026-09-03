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
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { resolveMemberIdForApi } from '@/features/user/api/member-id-registry'
import { buildJaGradeEvaluationDraft } from '@/features/user/detail/lib/ja-grade-evaluation-draft'
import {
  buildJaGradeEvaluationReason,
  calculateJaGradeEvaluationFromDraft,
  validateJaGradeEvaluationDraft,
} from '@/features/user/detail/lib/ja-grade-evaluation-score'
import {
  loadJaGradeEvaluationRecord,
  resolveJaGradeEvaluationStorageKey,
  saveJaGradeEvaluationRecord,
} from '@/features/user/detail/lib/ja-grade-evaluation-store'
import { JA_GRADE_SCALE_QUESTION_IDS } from '@/features/user/detail/lib/ja-grade-evaluation-constants'
import { REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE } from '@/shared/constants/messages'
import { handleError } from '@/shared/utils/error-handler'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import './ja-grade-evaluation-modal.css'

const JA_GRADE_EVALUATION_MODAL_Z_INDEX = 1200

export type JaGradeEvaluationPersistMode = 'remote' | 'localOnly'

export interface JaGradeEvaluationModalProps {
  open: boolean
  instructorMemberId: number | null | undefined
  /** uuid — used as localStorage key when memberId is absent (mock) */
  instructorUserId?: string | null
  /** `localOnly`: API 저장 없이 평가 결과만 반환 (신규 등록 등 memberId 없을 때) */
  persistMode?: JaGradeEvaluationPersistMode
  /** false — localStorage 저장본 복원 없이 빈 평가지로 시작 (강사 신규 등록 등) */
  restoreStoredDraft?: boolean
  scheduleChangeCount?: number
  lateReportCount?: number
  onClose: () => void
  /** remote POST(evaluation-grade) 또는 mock 저장 후 UI 반영. 성공 시에만 resolve */
  onComplete: (payload: { grade: string; totalScore: number }) => void | Promise<void>
}

export function JaGradeEvaluationModal({
  open,
  instructorMemberId,
  instructorUserId,
  persistMode = 'remote',
  restoreStoredDraft = true,
  scheduleChangeCount = 0,
  lateReportCount = 0,
  onClose,
  onComplete,
}: JaGradeEvaluationModalProps) {
  const { showAlert } = useCmsAlert()
  const [draft, setDraft] = useState<WritingFormDraft | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const storageKey = useMemo(
    () => resolveJaGradeEvaluationStorageKey(instructorMemberId, instructorUserId),
    [instructorMemberId, instructorUserId]
  )

  useEffect(() => {
    if (!open) {
      setDraft(null)
      setSubmitting(false)
      return
    }
    if (storageKey == null) {
      setDraft(null)
      return
    }
    const stored = restoreStoredDraft ? loadJaGradeEvaluationRecord(storageKey) : null
    setDraft(buildJaGradeEvaluationDraft(stored))
  }, [open, restoreStoredDraft, storageKey])

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
    if (draft == null || storageKey == null || submitting) return

    const validation = validateJaGradeEvaluationDraft(draft)
    if (!validation.valid) {
      showAlert({
        title: '안내',
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
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
      const info = handleError(error, { defaultMessage: '등급 산출에 실패했습니다.' })
      showAlert({ title: '안내', content: info.detail })
      return
    }

    setSubmitting(true)
    try {
      const reason = buildJaGradeEvaluationReason(result)
      let remoteMemberId = instructorMemberId ?? null

      if (persistMode === 'remote' && isMembersRemoteEnabled()) {
        if (remoteMemberId == null && instructorUserId) {
          try {
            remoteMemberId = resolveMemberIdForApi(instructorUserId)
          } catch {
            remoteMemberId = null
          }
        }
        if (remoteMemberId == null) {
          throw new Error('강사 memberId가 없어 평가 등급을 저장할 수 없습니다.')
        }
        await changeInstructorEvaluationGradeRemote(remoteMemberId, {
          grade: result.grade,
          reason,
        })
      }

      saveJaGradeEvaluationRecord({
        memberId: remoteMemberId ?? instructorMemberId ?? 0,
        storageKey,
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

      await onComplete({ grade: result.grade, totalScore: result.totalScore })
      onClose()
    } catch (error) {
      const info = handleError(error, { defaultMessage: 'JA 등급 평가 저장에 실패했습니다.' })
      showAlert({ title: '안내', content: info.detail })
    } finally {
      setSubmitting(false)
    }
  }, [
    draft,
    instructorMemberId,
    instructorUserId,
    persistMode,
    lateReportCount,
    onClose,
    onComplete,
    scheduleChangeCount,
    showAlert,
    storageKey,
    submitting,
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
                adminAction="write"
                disabled={draft == null || submitting || storageKey == null}
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
