import { useMemo } from 'react'
import type {
  SessionPlanShortEssayParagraph,
  ShortEssayParagraph,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { isShortEssayOrSessionPlanParagraph } from '@/features/template/model/writing-form/paragraph-guards'

export function useShortEssayEditorState({
  active,
  singleItemListActiveItemId,
}: {
  active: WritingFormParagraph | null
  singleItemListActiveItemId?: string | null
}) {
  return useMemo(() => {
    const activeShortEssay: ShortEssayParagraph | SessionPlanShortEssayParagraph | null =
      active && isShortEssayOrSessionPlanParagraph(active)
        ? (active as ShortEssayParagraph | SessionPlanShortEssayParagraph)
        : null

    const shortEssayItems =
      activeShortEssay?.items && activeShortEssay.items.length > 0
        ? activeShortEssay.items
        : activeShortEssay
          ? [
              {
                id:
                  activeShortEssay.variant === 'session_plan_short_essay'
                    ? 'session-plan-item-1'
                    : 'short-essay-item-1',
                label: 'Title 01',
                placeholder: activeShortEssay.bodyPlaceholder,
                bodyText: activeShortEssay.bodyText,
              },
            ]
          : []

    const selectedShortEssayItem =
      singleItemListActiveItemId == null
        ? null
        : (shortEssayItems.find(item => item.id === singleItemListActiveItemId) ?? null)

    const shortEssayShowItemTitle =
      activeShortEssay == null
        ? false
        : shortEssayItems.length >= 2
          ? true
          : (activeShortEssay.showItemTitle ?? false)

    return {
      activeShortEssay,
      shortEssayItems,
      selectedShortEssayItem,
      shortEssayShowItemTitle,
    }
  }, [active, singleItemListActiveItemId])
}
