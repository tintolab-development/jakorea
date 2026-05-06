import { MenuOutlined } from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ParagraphCard,
  type ParagraphCardEditableHeading,
} from '@/features/template/ui/template-fullpage-modal'
import {
  type FormEditorKind,
  type FormTitleNumberingStyle,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/render-form-paragraph-body'
import type { FormEditorLeftPanelProps } from '@/features/template/ui/form-editor/form-editor-left-panel.types'
import { renderFormEditorParagraphBody } from '@/features/template/ui/form-editor/form-editor-left-panel-paragraph-body'
import {
  isTitleWithPeriodParagraph,
  paragraphEditableHeading,
  withProgramRegistrationCurriculumTitleTrailing,
  withoutTitleRequired,
} from '@/features/template/ui/form-editor/form-editor-left-panel-heading'
import {
  modalCardFooterActions,
  modalCardFooterToggles,
} from '@/features/template/ui/form-editor/form-editor-left-panel-card-footer'

/** 고정·구조 잠금 단락 — 순서 변경은 불가하나 양식 테스트와 동일한 햄버거 아이콘 노출 */
export function ParagraphCardDragHandleNonInteractive() {
  return (
    <span
      className="paragraph-card__drag-handle paragraph-card__drag-handle--non-interactive"
      aria-hidden
    >
      <MenuOutlined />
    </span>
  )
}

export interface PinnedCardProps {
  paragraph: WritingFormParagraph
  paragraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  selectedCardId: string | null
  onSelectCard: (id: string) => void
  updateParagraph: FormEditorLeftPanelProps['updateParagraph']
  editorKind: FormEditorKind
  singleItemListActiveItemId?: string | null
  onSelectSingleItemListItem?: FormEditorLeftPanelProps['onSelectSingleItemListItem']
  horizontalTableRowSelectionsByParagraphId: FormEditorLeftPanelProps['horizontalTableRowSelectionsByParagraphId']
  onHorizontalTableRowSelectionChange: FormEditorLeftPanelProps['onHorizontalTableRowSelectionChange']
  verticalTableBodyRowSelection: FormEditorLeftPanelProps['verticalTableBodyRowSelection']
  onVerticalTableBodyRowSelectionChange: FormEditorLeftPanelProps['onVerticalTableBodyRowSelectionChange']
  middleParagraphActions: FormEditorLeftPanelProps['middleParagraphActions']
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  showEditorChrome?: boolean
  structureLockedParagraphIds?: ReadonlySet<string>
  hideDragHandleForParagraphIds?: ReadonlySet<string>
  hideParagraphRequiredChrome?: boolean
  headingDescriptionExtraClassName?: string
}

export function PinnedFormCard({
  paragraph,
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  updateParagraph,
  editorKind,
  singleItemListActiveItemId,
  onSelectSingleItemListItem,
  horizontalTableRowSelectionsByParagraphId,
  onHorizontalTableRowSelectionChange,
  verticalTableBodyRowSelection,
  onVerticalTableBodyRowSelectionChange,
  middleParagraphActions,
  paragraphBodyOptions,
  showEditorChrome = true,
  structureLockedParagraphIds,
  hideDragHandleForParagraphIds,
  hideParagraphRequiredChrome,
  headingDescriptionExtraClassName,
}: PinnedCardProps) {
  const isSelected = selectedCardId === paragraph.id
  const hideDragHandle = hideDragHandleForParagraphIds?.has(paragraph.id) ?? false
  const editableHeadingBase = withoutTitleRequired(
    paragraphEditableHeading(
      paragraph,
      paragraphs,
      titleNumbering,
      isSelected,
      updateParagraph,
      editorKind,
      structureLockedParagraphIds,
      headingDescriptionExtraClassName
    ),
    hideParagraphRequiredChrome
  )
  const editableHeading = withProgramRegistrationCurriculumTitleTrailing(
    editableHeadingBase as ParagraphCardEditableHeading,
    paragraph,
    paragraphBodyOptions
  )

  return (
    <ParagraphCard
      dataParagraphId={paragraph.id}
      className={[
        'form-editor-card',
        showEditorChrome ? 'paragraph-card--selectable' : '',
        showEditorChrome && selectedCardId === paragraph.id ? 'paragraph-card--active' : '',
        isTitleWithPeriodParagraph(paragraph) ? 'paragraph-card--survey-title-with-period' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={showEditorChrome ? () => onSelectCard(paragraph.id) : undefined}
      actionSlot={
        showEditorChrome && !hideDragHandle ? <ParagraphCardDragHandleNonInteractive /> : undefined
      }
      editableHeading={editableHeading}
      toggles={
        showEditorChrome
          ? modalCardFooterToggles(
              paragraph,
              isSelected,
              updateParagraph,
              structureLockedParagraphIds,
              hideParagraphRequiredChrome
            )
          : undefined
      }
      actions={
        showEditorChrome
          ? modalCardFooterActions(
              paragraph,
              isSelected,
              updateParagraph,
              middleParagraphActions,
              paragraphs,
              structureLockedParagraphIds
            )
          : undefined
      }
    >
      {renderFormEditorParagraphBody(
        paragraph,
        updateParagraph,
        isSelected,
        editorKind,
        horizontalTableRowSelectionsByParagraphId,
        onHorizontalTableRowSelectionChange,
        verticalTableBodyRowSelection,
        onVerticalTableBodyRowSelectionChange,
        singleItemListActiveItemId,
        onSelectSingleItemListItem,
        paragraphBodyOptions
      )}
    </ParagraphCard>
  )
}

export interface SortableMiddleCardProps {
  paragraph: WritingFormParagraph
  paragraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  selectedCardId: string | null
  onSelectCard: (id: string) => void
  updateParagraph: FormEditorLeftPanelProps['updateParagraph']
  editorKind: FormEditorKind
  singleItemListActiveItemId?: string | null
  onSelectSingleItemListItem?: FormEditorLeftPanelProps['onSelectSingleItemListItem']
  horizontalTableRowSelectionsByParagraphId: FormEditorLeftPanelProps['horizontalTableRowSelectionsByParagraphId']
  onHorizontalTableRowSelectionChange: FormEditorLeftPanelProps['onHorizontalTableRowSelectionChange']
  verticalTableBodyRowSelection: FormEditorLeftPanelProps['verticalTableBodyRowSelection']
  onVerticalTableBodyRowSelectionChange: FormEditorLeftPanelProps['onVerticalTableBodyRowSelectionChange']
  middleParagraphActions: FormEditorLeftPanelProps['middleParagraphActions']
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  showEditorChrome?: boolean
  structureLockedParagraphIds?: ReadonlySet<string>
  hideDragHandleForParagraphIds?: ReadonlySet<string>
  hideParagraphRequiredChrome?: boolean
  headingDescriptionExtraClassName?: string
}

export function SortableMiddleFormCard({
  paragraph,
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  updateParagraph,
  editorKind,
  singleItemListActiveItemId,
  onSelectSingleItemListItem,
  horizontalTableRowSelectionsByParagraphId,
  onHorizontalTableRowSelectionChange,
  verticalTableBodyRowSelection,
  onVerticalTableBodyRowSelectionChange,
  middleParagraphActions,
  paragraphBodyOptions,
  showEditorChrome = true,
  structureLockedParagraphIds,
  hideDragHandleForParagraphIds,
  hideParagraphRequiredChrome,
  headingDescriptionExtraClassName,
}: SortableMiddleCardProps) {
  const hideDragHandle = hideDragHandleForParagraphIds?.has(paragraph.id) ?? false
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: paragraph.id })

  const isSelected = selectedCardId === paragraph.id
  const editableHeadingBase = withoutTitleRequired(
    paragraphEditableHeading(
      paragraph,
      paragraphs,
      titleNumbering,
      isSelected,
      updateParagraph,
      editorKind,
      structureLockedParagraphIds,
      headingDescriptionExtraClassName
    ),
    hideParagraphRequiredChrome
  )
  const editableHeading = withProgramRegistrationCurriculumTitleTrailing(
    editableHeadingBase as ParagraphCardEditableHeading,
    paragraph,
    paragraphBodyOptions
  )

  return (
    <div
      ref={setNodeRef}
      style={{
        // DndContext가 over·active rect 비율로 scaleX/Y를 넣을 수 있어, 동일 폭 리스트에서 카드가 가로로 찌그러짐 → 이동만 반영
        transform:
          transform != null
            ? CSS.Translate.toString({
                x: transform.x,
                y: transform.y,
                scaleX: 1,
                scaleY: 1,
              })
            : undefined,
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <ParagraphCard
        dataParagraphId={paragraph.id}
        className={[
          'form-editor-card',
          showEditorChrome ? 'paragraph-card--selectable' : '',
          showEditorChrome && selectedCardId === paragraph.id ? 'paragraph-card--active' : '',
          isTitleWithPeriodParagraph(paragraph) ? 'paragraph-card--survey-title-with-period' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={showEditorChrome ? () => onSelectCard(paragraph.id) : undefined}
        actionSlot={
          showEditorChrome && !hideDragHandle ? (
            <button
              ref={setActivatorNodeRef}
              type="button"
              className="paragraph-card__drag-handle"
              aria-label="카드 순서 변경"
              onClick={event => event.stopPropagation()}
              {...attributes}
              {...listeners}
            >
              <MenuOutlined />
            </button>
          ) : undefined
        }
        editableHeading={editableHeading}
        toggles={
          showEditorChrome
            ? modalCardFooterToggles(
                paragraph,
                isSelected,
                updateParagraph,
                structureLockedParagraphIds,
                hideParagraphRequiredChrome
              )
            : undefined
        }
        actions={
          showEditorChrome
            ? modalCardFooterActions(
                paragraph,
                isSelected,
                updateParagraph,
                middleParagraphActions,
                paragraphs,
                structureLockedParagraphIds
              )
            : undefined
        }
      >
        {renderFormEditorParagraphBody(
          paragraph,
          updateParagraph,
          isSelected,
          editorKind,
          horizontalTableRowSelectionsByParagraphId,
          onHorizontalTableRowSelectionChange,
          verticalTableBodyRowSelection,
          onVerticalTableBodyRowSelectionChange,
          singleItemListActiveItemId,
          onSelectSingleItemListItem,
          paragraphBodyOptions
        )}
      </ParagraphCard>
    </div>
  )
}
