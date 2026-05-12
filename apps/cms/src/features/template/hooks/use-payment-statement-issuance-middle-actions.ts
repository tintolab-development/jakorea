import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react'
import { message } from 'antd'
import {
  createAgreementExplanationTextParagraphForInsert,
  duplicateMiddleParagraph,
  getLastMiddleParagraphId,
  insertMiddleParagraphAfter,
  pickActiveParagraphIdAfterMiddleDelete,
  removeMiddleParagraph,
} from '@/features/template/lib/writing-form-middle-paragraph-mutations'
import { PAYMENT_STATEMENT_SEED_PARAGRAPH_IDS } from '@/features/template/model/payment-statement-issuance-draft'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

export type PaymentStatementIssuanceMiddleActions = {
  onAddAfter: (paragraphId: string) => void
  onDuplicate: (paragraphId: string) => void
  onDelete: (paragraphId: string) => void
  appendBasicTitleParagraph: () => void
}

/**
 * 지급조서(발급용) — basic 제목형만 삽입·시드 단락 복제/삭제 차단. 추가 단락은 항상 마무리 직전(middle 끝).
 */
export function usePaymentStatementIssuanceMiddleActions(
  setDraft: Dispatch<SetStateAction<WritingFormDraft>>,
  setActiveParagraphId: Dispatch<SetStateAction<string | null>>,
  options?: { lockedParagraphIds?: ReadonlySet<string> }
): PaymentStatementIssuanceMiddleActions {
  const lockedParagraphIds = options?.lockedParagraphIds ?? PAYMENT_STATEMENT_SEED_PARAGRAPH_IDS

  const appendBasicTitleParagraph = useCallback(() => {
    const newId = crypto.randomUUID()
    const insert = createAgreementExplanationTextParagraphForInsert(newId)
    let inserted = false
    setDraft(prev => {
      const lastMid = getLastMiddleParagraphId(prev.paragraphs)
      if (lastMid == null) return prev
      const next = insertMiddleParagraphAfter(prev.paragraphs, lastMid, insert)
      if (next == null) return prev
      inserted = true
      return { ...prev, paragraphs: next }
    })
    if (inserted) setActiveParagraphId(newId)
  }, [setDraft, setActiveParagraphId])

  const onAddAfter = useCallback(
    (_paragraphId: string) => {
      appendBasicTitleParagraph()
    },
    [appendBasicTitleParagraph]
  )

  const onDuplicate = useCallback(
    (paragraphId: string) => {
      if (lockedParagraphIds.has(paragraphId)) {
        message.warning('템플릿 단락은 복제할 수 없습니다.')
        return
      }
      const newId = crypto.randomUUID()
      let duplicated = false
      setDraft(prev => {
        const next = duplicateMiddleParagraph(prev.paragraphs, paragraphId, newId)
        if (next == null) {
          message.warning('이 단락은 복제할 수 없습니다.')
          return prev
        }
        duplicated = true
        return { ...prev, paragraphs: next }
      })
      if (duplicated) setActiveParagraphId(newId)
    },
    [lockedParagraphIds, setDraft, setActiveParagraphId]
  )

  const onDelete = useCallback(
    (paragraphId: string) => {
      if (lockedParagraphIds.has(paragraphId)) {
        message.warning('템플릿 단락은 삭제할 수 없습니다.')
        return
      }
      let nextActive: string | null = null
      setDraft(prev => {
        const nextParas = removeMiddleParagraph(prev.paragraphs, paragraphId)
        if (nextParas == null) {
          message.warning('중간 단락은 최소 1개 이상 유지해야 합니다.')
          return prev
        }
        nextActive = pickActiveParagraphIdAfterMiddleDelete(prev.paragraphs, paragraphId)
        return { ...prev, paragraphs: nextParas }
      })
      if (nextActive != null) setActiveParagraphId(nextActive)
    },
    [lockedParagraphIds, setDraft, setActiveParagraphId]
  )

  return useMemo(
    () => ({
      onAddAfter,
      onDuplicate,
      onDelete,
      appendBasicTitleParagraph,
    }),
    [onAddAfter, onDuplicate, onDelete, appendBasicTitleParagraph]
  )
}
