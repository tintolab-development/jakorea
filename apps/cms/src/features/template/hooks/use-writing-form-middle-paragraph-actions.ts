import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react'
import { message } from 'antd'
import {
  createAgreementExplanationTextParagraphForInsert,
  duplicateMiddleParagraph,
  insertMiddleParagraphAfter,
  pickActiveParagraphIdAfterMiddleDelete,
  removeMiddleParagraph,
} from '@/features/template/lib/writing-form-middle-paragraph-mutations'
import { getWritingFormHeadMiddlePinnedTail } from '@/features/template/model/writing-form-draft.schema'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

export type MiddleParagraphActionsHandlers = {
  onAddAfter: (paragraphId: string) => void
  onDuplicate: (paragraphId: string) => void
  onDelete: (paragraphId: string) => void
}

/**
 * `/templates` 설문·동의 편집 공통 — middle 단락 추가(설명글 텍스트형)·복제·삭제
 */
export function useWritingFormMiddleParagraphActions(
  setDraft: Dispatch<SetStateAction<WritingFormDraft>>,
  setActiveParagraphId: Dispatch<SetStateAction<string | null>>
): MiddleParagraphActionsHandlers {
  const onAddAfter = useCallback(
    (paragraphId: string) => {
      const newId = crypto.randomUUID()
      const insert = createAgreementExplanationTextParagraphForInsert(newId)
      let inserted = false
      setDraft(prev => {
        const next = insertMiddleParagraphAfter(prev.paragraphs, paragraphId, insert)
        if (next == null) {
          message.warning('이 위치에는 단락을 추가할 수 없습니다.')
          return prev
        }
        inserted = true
        return { ...prev, paragraphs: next }
      })
      if (inserted) setActiveParagraphId(newId)
    },
    [setDraft, setActiveParagraphId]
  )

  const onDuplicate = useCallback(
    (paragraphId: string) => {
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
    [setDraft, setActiveParagraphId]
  )

  const onDelete = useCallback(
    (paragraphId: string) => {
      let nextActive: string | null = null
      setDraft(prev => {
        const before = prev.paragraphs
        const split = getWritingFormHeadMiddlePinnedTail(before)
        if (split != null && !split.middle.some(p => p.id === paragraphId)) {
          message.warning('고정 단락은 삭제할 수 없습니다.')
          return prev
        }
        const nextParas = removeMiddleParagraph(before, paragraphId)
        if (nextParas == null) {
          message.warning('중간 단락은 최소 1개 이상 유지해야 합니다.')
          return prev
        }
        nextActive = pickActiveParagraphIdAfterMiddleDelete(before, paragraphId)
        return { ...prev, paragraphs: nextParas }
      })
      if (nextActive != null) setActiveParagraphId(nextActive)
    },
    [setDraft, setActiveParagraphId]
  )

  return useMemo(
    () => ({
      onAddAfter,
      onDuplicate,
      onDelete,
    }),
    [onAddAfter, onDuplicate, onDelete]
  )
}
