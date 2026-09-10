import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react'
import {
  createAgreementExplanationTextParagraphForInsert,
  duplicateMiddleParagraph,
  duplicateSurveyParagraph,
  insertMiddleParagraphAfter,
  insertSurveyParagraphAfter,
  pickActiveParagraphIdAfterMiddleDelete,
  removeMiddleParagraph,
  removeSurveyParagraph,
} from '@/features/template/lib/writing-form-middle-paragraph-mutations'
import { getWritingFormHeadMiddlePinnedTail } from '@/features/template/model/writing-form-draft.schema'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { isTitleWithPeriodParagraph } from '@/features/template/lib/title-with-period-settings'

export type MiddleParagraphActionsHandlers = {
  onAddAfter: (paragraphId: string) => void
  onDuplicate: (paragraphId: string) => void
  onDelete: (paragraphId: string) => void
}

/**
 * `/templates` 설문·동의 편집 공통 — middle 단락 추가(설명글 텍스트형)·복제·삭제
 */
export type UseWritingFormMiddleParagraphActionsOptions = {
  /** 설문 양식 — head/middle/tail 고정 없이 모든 단락 편집 */
  surveyFreeForm?: boolean
}

export function useWritingFormMiddleParagraphActions(
  setDraft: Dispatch<SetStateAction<WritingFormDraft>>,
  setActiveParagraphId: Dispatch<SetStateAction<string | null>>,
  options?: UseWritingFormMiddleParagraphActionsOptions
): MiddleParagraphActionsHandlers {
  const surveyFreeForm = options?.surveyFreeForm === true

  const onAddAfter = useCallback(
    (paragraphId: string) => {
      const newId = crypto.randomUUID()
      const insert = createAgreementExplanationTextParagraphForInsert(newId)
      let inserted = false
      setDraft(prev => {
        const next = surveyFreeForm
          ? insertSurveyParagraphAfter(prev.paragraphs, paragraphId, insert)
          : insertMiddleParagraphAfter(prev.paragraphs, paragraphId, insert)
        if (next == null) {
          return prev
        }
        inserted = true
        return { ...prev, paragraphs: next }
      })
      if (inserted) setActiveParagraphId(newId)
    },
    [setDraft, setActiveParagraphId, surveyFreeForm]
  )

  const onDuplicate = useCallback(
    (paragraphId: string) => {
      const newId = crypto.randomUUID()
      let duplicated = false
      setDraft(prev => {
        const target = prev.paragraphs.find(p => p.id === paragraphId)
        if (!surveyFreeForm && target != null && isTitleWithPeriodParagraph(target)) {
          return prev
        }
        const next = surveyFreeForm
          ? duplicateSurveyParagraph(prev.paragraphs, paragraphId, newId)
          : duplicateMiddleParagraph(prev.paragraphs, paragraphId, newId)
        if (next == null) {
          return prev
        }
        duplicated = true
        return { ...prev, paragraphs: next }
      })
      if (duplicated) setActiveParagraphId(newId)
    },
    [setDraft, setActiveParagraphId, surveyFreeForm]
  )

  const onDelete = useCallback(
    (paragraphId: string) => {
      let nextActive: string | null = null
      setDraft(prev => {
        const before = prev.paragraphs
        const target = before.find(p => p.id === paragraphId)
        if (!surveyFreeForm && target != null && isTitleWithPeriodParagraph(target)) {
          return prev
        }
        if (surveyFreeForm) {
          const nextParas = removeSurveyParagraph(before, paragraphId)
          if (nextParas == null) {
            return prev
          }
          nextActive = pickActiveParagraphIdAfterMiddleDelete(before, paragraphId)
          return { ...prev, paragraphs: nextParas }
        }
        const split = getWritingFormHeadMiddlePinnedTail(before)
        if (split != null && !split.middle.some(p => p.id === paragraphId)) {
          return prev
        }
        const nextParas = removeMiddleParagraph(before, paragraphId)
        if (nextParas == null) {
          return prev
        }
        nextActive = pickActiveParagraphIdAfterMiddleDelete(before, paragraphId)
        return { ...prev, paragraphs: nextParas }
      })
      if (nextActive != null) setActiveParagraphId(nextActive)
    },
    [setDraft, setActiveParagraphId, surveyFreeForm]
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
