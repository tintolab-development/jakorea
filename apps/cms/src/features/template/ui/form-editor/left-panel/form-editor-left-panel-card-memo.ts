import type { HorizontalTableRowSelection } from '@/features/template/model/writing-form-draft.schema'
import type {
  PinnedCardProps,
  SortableMiddleCardProps,
} from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel-cards'

type FormEditorCardProps = PinnedCardProps | SortableMiddleCardProps

function isParagraphItemFocusTarget(
  paragraphId: string,
  paragraphVariant: string | undefined,
  itemId: string | null
): boolean {
  if (itemId == null) return false
  if (itemId === paragraphId) return true
  return (
    paragraphVariant === 'short_essay' ||
    paragraphVariant === 'session_plan_short_essay' ||
    paragraphVariant === 'subjective' ||
    paragraphVariant === 'multiple_choice'
  )
}

function didItemFocusChangeForParagraph(
  paragraph: FormEditorCardProps['paragraph'],
  prevItemId: string | null | undefined,
  nextItemId: string | null | undefined
): boolean {
  if (prevItemId === nextItemId) return false
  const variant = paragraph.kind === 'single_item' ? paragraph.variant : undefined
  return (
    isParagraphItemFocusTarget(paragraph.id, variant, prevItemId ?? null) ||
    isParagraphItemFocusTarget(paragraph.id, variant, nextItemId ?? null)
  )
}

function horizontalSelectionForParagraph(
  map: Record<string, HorizontalTableRowSelection | null> | undefined,
  paragraphId: string
): HorizontalTableRowSelection | null | undefined {
  if (map == null) return undefined
  return map[paragraphId] ?? null
}

function verticalRowForParagraph(
  selection: FormEditorCardProps['verticalTableBodyRowSelection'],
  paragraphId: string
): number | null {
  if (selection == null || selection.paragraphId !== paragraphId) return null
  return selection.row
}

export function areFormEditorCardPropsEqual(
  prev: FormEditorCardProps,
  next: FormEditorCardProps
): boolean {
  if (prev.paragraph !== next.paragraph) return false
  if (prev.paragraphIndex !== next.paragraphIndex) return false
  if (prev.titleNumbering !== next.titleNumbering) return false

  const prevSelected = prev.selectedCardId === prev.paragraph.id
  const nextSelected = next.selectedCardId === next.paragraph.id
  if (prevSelected !== nextSelected) return false

  if (prev.editorKind !== next.editorKind) return false
  if (prev.showEditorChrome !== next.showEditorChrome) return false
  if (prev.headingDescriptionExtraClassName !== next.headingDescriptionExtraClassName) return false
  if (prev.hideParagraphRequiredChrome !== next.hideParagraphRequiredChrome) return false
  if (prev.structureLockedParagraphIds !== next.structureLockedParagraphIds) return false
  if (prev.hideDragHandleForParagraphIds !== next.hideDragHandleForParagraphIds) return false
  if (prev.paragraphBodyOptions !== next.paragraphBodyOptions) return false
  if (prev.middleParagraphActions !== next.middleParagraphActions) return false
  if (prev.updateParagraph !== next.updateParagraph) return false
  if (prev.onSelectCard !== next.onSelectCard) return false
  if (prev.onSelectSingleItemListItem !== next.onSelectSingleItemListItem) return false

  if (
    didItemFocusChangeForParagraph(
      prev.paragraph,
      prev.singleItemListActiveItemId,
      next.singleItemListActiveItemId
    )
  ) {
    return false
  }

  const paragraphId = prev.paragraph.id
  if (
    horizontalSelectionForParagraph(
      prev.horizontalTableRowSelectionsByParagraphId,
      paragraphId
    ) !==
    horizontalSelectionForParagraph(next.horizontalTableRowSelectionsByParagraphId, paragraphId)
  ) {
    return false
  }

  if (
    verticalRowForParagraph(prev.verticalTableBodyRowSelection, paragraphId) !==
    verticalRowForParagraph(next.verticalTableBodyRowSelection, paragraphId)
  ) {
    return false
  }

  return true
}
