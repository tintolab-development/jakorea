import { useCallback } from 'react'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { createHorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { convertParagraphByDetail, preserveParagraphCommonFields } from '@/features/template/model/writing-form/paragraph-converters'
import type { DetailSelectValue, ParagraphKindSelectValue } from '@/features/template/model/writing-form/paragraph-selectors'

export function useParagraphConversion({
  active,
  activeKindLocked,
  activeKindValue,
  updateParagraph,
}: {
  active: WritingFormParagraph | null
  activeKindLocked: boolean
  activeKindValue: ParagraphKindSelectValue | null
  updateParagraph: (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => void
}) {
  const handleKindChange = useCallback(
    (next: ParagraphKindSelectValue) => {
      if (!active || activeKindLocked) return
      if (next === activeKindValue) return
      updateParagraph(active.id, cur => {
        if (next === 'table') {
          if (
            cur.kind === 'single_item' &&
            (cur.variant === 'horizontal_table' || cur.variant === 'vertical_table')
          ) {
            return cur
          }
          return preserveParagraphCommonFields(createHorizontalTableParagraph(cur.id), cur)
        }
        if (next === 'description') {
          return convertParagraphByDetail(cur, 'text')
        }
        return convertParagraphByDetail(cur, 'subjective')
      })
    },
    [active, activeKindLocked, activeKindValue, updateParagraph]
  )

  const handleDetailChange = useCallback(
    (next: DetailSelectValue) => {
      if (!active || activeKindLocked) return
      updateParagraph(active.id, cur => convertParagraphByDetail(cur, next))
    },
    [active, activeKindLocked, updateParagraph]
  )

  return { handleKindChange, handleDetailChange }
}
