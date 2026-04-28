import { MenuOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ParagraphCard } from '@/features/template/ui/template-fullpage-modal'
import {
  FormParagraphCardActions,
  FormParagraphCardActionsMinimal,
} from '@/features/template/ui/paragraph/shared/paragraph-actions'
import { getFormParagraphTitleNumberPrefix } from '@/features/template/lib/form-title-numbering'
import {
  getWritingFormHeadMiddlePinnedTail,
  isAgreementLockedSystemParagraph,
  paragraphsAreOnlyTableLayoutParagraphs,
  type DateTimeParagraph,
  type FormEditorKind,
  type FormTitleNumberingStyle,
  type HorizontalTableParagraph,
  type HorizontalTableRowSelection,
  type MultipleChoiceParagraph,
  type ShortEssayParagraph,
  type TitleWithPeriodParagraph,
  type VerticalTableParagraph,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { HorizontalTableDimensionActions } from '@/features/template/ui/paragraph/shared/horizontal-table-dimension-actions'
import { VerticalTableDimensionActions } from '@/features/template/ui/paragraph/shared/vertical-table-dimension-actions'
import {
  renderFormParagraphBody,
  type RenderFormParagraphBodyOptions,
} from '@/features/template/ui/paragraph/render-form-paragraph-body'
import { CmsToggle } from '@/shared/ui/cms-toggle'
import { restrictFormEditorListToVerticalAxis } from '@/features/template/ui/form-editor/dnd-restrict-vertical-axis'
import './form-editor.css'

export type FormEditorLeftPaneLayout = 'five' | 'three'

export interface FormEditorLeftPaneProps {
  paragraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  selectedCardId: string | null
  onSelectCard: (id: string) => void
  onReorderMiddle: (activeId: string, overId: string) => void
  updateParagraph: (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => void
  editorKind?: FormEditorKind
  singleItemListActiveItemId?: string | null
  onSelectSingleItemListItem?: (paragraphId: string, itemId: string | null) => void
  layout?: FormEditorLeftPaneLayout
  horizontalTableRowSelectionsByParagraphId?: Record<string, HorizontalTableRowSelection | null>
  onHorizontalTableRowSelectionChange?: (
    paragraphId: string,
    next: HorizontalTableRowSelection | null
  ) => void
  /** 테이블 세로형: 본문 행 선택(캔버스) — 에디터에서 하나만 유지 */
  verticalTableBodyRowSelection?: { paragraphId: string; row: number } | null
  onVerticalTableBodyRowSelectionChange?: (paragraphId: string, row: number | null) => void
  /** 테이블 가로형 중간 단락: 추가·복제·삭제 */
  middleParagraphActions?: {
    onAddAfter: (paragraphId: string) => void
    onDuplicate: (paragraphId: string) => void
    onDelete: (paragraphId: string) => void
  }
  /** `renderFormParagraphBody`에 그대로 전달(동의 시스템 단락 write 모드 등) */
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
}

function renderFormEditorParagraphBody(
  paragraph: WritingFormParagraph,
  updateParagraph: FormEditorLeftPaneProps['updateParagraph'],
  isSelected: boolean,
  editorKind: FormEditorKind,
  rowSelectionsByParagraphId: FormEditorLeftPaneProps['horizontalTableRowSelectionsByParagraphId'],
  onHorizontalTableRowSelectionChange: FormEditorLeftPaneProps['onHorizontalTableRowSelectionChange'],
  verticalTableBodyRowSelection: FormEditorLeftPaneProps['verticalTableBodyRowSelection'],
  onVerticalTableBodyRowSelectionChange: FormEditorLeftPaneProps['onVerticalTableBodyRowSelectionChange'],
  singleItemListActiveItemId: FormEditorLeftPaneProps['singleItemListActiveItemId'],
  onSelectSingleItemListItem: FormEditorLeftPaneProps['onSelectSingleItemListItem'],
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
) {
  return renderFormParagraphBody(paragraph, updateParagraph, isSelected, editorKind, {
    horizontalTableRowSelection: rowSelectionsByParagraphId?.[paragraph.id] ?? null,
    onHorizontalTableRowSelectionChange:
      onHorizontalTableRowSelectionChange == null
        ? undefined
        : (next: HorizontalTableRowSelection | null) =>
            onHorizontalTableRowSelectionChange(paragraph.id, next),
    verticalTableRowSelection:
      verticalTableBodyRowSelection != null &&
      verticalTableBodyRowSelection.paragraphId === paragraph.id
        ? verticalTableBodyRowSelection.row
        : null,
    onVerticalTableRowSelectionChange:
      onVerticalTableBodyRowSelectionChange == null
        ? undefined
        : (row: number | null) => onVerticalTableBodyRowSelectionChange(paragraph.id, row),
    singleItemListActiveItemId,
    onSelectSingleItemListItem:
      (paragraph.variant === 'short_essay' || paragraph.variant === 'multiple_choice') &&
      onSelectSingleItemListItem
        ? (itemId: string | null) => onSelectSingleItemListItem(paragraph.id, itemId)
        : undefined,
    ...paragraphBodyOptions,
  })
}

function isTitleWithPeriodParagraph(p: WritingFormParagraph): boolean {
  return p.kind === 'description' && p.variant === 'survey_title_with_period'
}

function formCardTitleUsesPlaceholderTone(p: WritingFormParagraph): boolean {
  if (p.kind === 'description' && p.variant === 'survey_title_with_period') {
    return !p.paragraphTitle.trim() && !p.surveyTitle.trim()
  }
  if (p.kind === 'description' && p.variant === 'closing') {
    return !p.body.trim()
  }
  if (isAgreementLockedSystemParagraph(p)) {
    return false
  }
  if (p.kind === 'description' && p.variant === 'system') {
    return !p.paragraphTitle.trim()
  }
  return !p.paragraphTitle.trim()
}

function titleWithPeriodPlaceholder(editorKind: FormEditorKind): string {
  return editorKind === 'agreement' ? '동의서 제목 입력' : '타이틀을 입력해 주세요'
}

function paragraphEditableHeading(
  paragraph: WritingFormParagraph,
  paragraphs: WritingFormParagraph[],
  titleNumbering: FormTitleNumberingStyle,
  isSelected: boolean,
  updateParagraph: FormEditorLeftPaneProps['updateParagraph'],
  editorKind: FormEditorKind
) {
  const prefix = getFormParagraphTitleNumberPrefix(paragraphs, paragraph, titleNumbering)

  if (paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period') {
    const p = paragraph as TitleWithPeriodParagraph
    return {
      isEditMode: isSelected,
      titleValue: p.surveyTitle,
      onTitleChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'survey_title_with_period'
            ? { ...cur, surveyTitle: next }
            : cur
        ),
      titlePlaceholder: titleWithPeriodPlaceholder(editorKind),
      titleRequired: p.requiredMark,
      titleClassName: [
        'paragraph-input-explanation-title',
        formCardTitleUsesPlaceholderTone(paragraph) ? 'paragraph-card__title--placeholder' : '',
      ]
        .filter(Boolean)
        .join(' '),
      titleLeading: prefix,
      descriptionValue: p.surveyDescription,
      onDescriptionChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'survey_title_with_period'
            ? { ...cur, surveyDescription: next }
            : cur
        ),
      descriptionPlaceholder: '설명 입력',
      descriptionClassName: 'paragraph-input-explanation-title',
    }
  }

  if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
    const p = paragraph
    return {
      /* 카드 타이틀 줄 = 마무리 본문(body) — `ParagraphInput` title과 동일 UX, 우측 패널에는 유형만 */
      isEditMode: isSelected,
      titleValue: p.body,
      onTitleChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'closing' ? { ...cur, body: next } : cur
        ),
      titlePlaceholder: '마무리 문구를 입력해 주세요',
      titleRequired: p.requiredMark,
      titleClassName: [
        'paragraph-input--closing-body',
        formCardTitleUsesPlaceholderTone(paragraph) ? 'paragraph-card__title--placeholder' : '',
      ]
        .filter(Boolean)
        .join(' '),
      titleLeading: prefix,
      showDescription: false,
      descriptionValue: p.paragraphDescription,
      onDescriptionChange: () => {},
      descriptionPlaceholder: '설명 입력',
    }
  }

  if (paragraph.kind === 'description' && paragraph.variant === 'system') {
    const p = paragraph
    if (isAgreementLockedSystemParagraph(paragraph)) {
      return {
        isEditMode: false,
        titleValue: p.paragraphTitle,
        onTitleChange: () => {},
        titlePlaceholder: '타이틀을 입력해 주세요',
        titleRequired: p.requiredMark,
        titleClassName: undefined,
        titleLeading: prefix,
        showDescription: false,
        descriptionValue: '',
        onDescriptionChange: () => {},
        descriptionPlaceholder: '설명 입력',
      }
    }
    return {
      isEditMode: isSelected,
      titleValue: p.paragraphTitle,
      onTitleChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'system'
            ? { ...cur, paragraphTitle: next }
            : cur
        ),
      titlePlaceholder: '타이틀을 입력해 주세요',
      titleRequired: p.requiredMark,
      titleClassName: formCardTitleUsesPlaceholderTone(paragraph)
        ? 'paragraph-card__title--placeholder'
        : undefined,
      titleLeading: prefix,
      descriptionValue: p.paragraphDescription,
      onDescriptionChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'system'
            ? { ...cur, paragraphDescription: next }
            : cur
        ),
      descriptionPlaceholder: '설명 입력',
    }
  }

  if (paragraph.kind === 'single_item') {
    const p = paragraph
    const titleRequired =
      p.variant === 'horizontal_table'
        ? (p as HorizontalTableParagraph).answerRequired
        : p.variant === 'vertical_table'
          ? (p as VerticalTableParagraph).answerRequired
          : (p.answerRequired ?? p.requiredMark)
    return {
      isEditMode: isSelected,
      titleValue: p.paragraphTitle,
      onTitleChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'single_item' && cur.id === p.id ? { ...cur, paragraphTitle: next } : cur
        ),
      titlePlaceholder: '타이틀을 입력해 주세요',
      titleRequired,
      titleClassName: formCardTitleUsesPlaceholderTone(paragraph)
        ? 'paragraph-card__title--placeholder'
        : undefined,
      titleLeading: prefix,
      descriptionValue: p.paragraphDescription,
      onDescriptionChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'single_item' && cur.id === p.id
            ? { ...cur, paragraphDescription: next }
            : cur
        ),
      descriptionPlaceholder: '설명 입력',
    }
  }

  return undefined
}

function modalCardFooterToggles(
  paragraph: WritingFormParagraph,
  isSelected: boolean,
  updateParagraph: FormEditorLeftPaneProps['updateParagraph']
): ReactNode {
  if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
    if (!isSelected) return undefined
    const ht = paragraph as HorizontalTableParagraph
    return (
      <>
        <CmsToggle
          label="답변 필수"
          checked={ht.answerRequired ?? ht.requiredMark}
          onChange={checked =>
            updateParagraph(ht.id, p =>
              p.kind === 'single_item' && p.variant === 'horizontal_table'
                ? { ...p, answerRequired: checked, requiredMark: checked }
                : p
            )
          }
        />
        <CmsToggle
          label="하단 설명"
          checked={ht.showBottomText}
          onChange={checked =>
            updateParagraph(ht.id, p =>
              p.kind === 'single_item' && p.variant === 'horizontal_table'
                ? { ...p, showBottomText: checked }
                : p
            )
          }
        />
      </>
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'vertical_table') {
    if (!isSelected) return undefined
    const vt = paragraph as VerticalTableParagraph
    return (
      <>
        <CmsToggle
          label="답변 필수"
          checked={vt.answerRequired ?? vt.requiredMark}
          onChange={checked =>
            updateParagraph(vt.id, p =>
              p.kind === 'single_item' && p.variant === 'vertical_table'
                ? { ...p, answerRequired: checked, requiredMark: checked }
                : p
            )
          }
        />
        <CmsToggle
          label="하단 설명"
          checked={vt.showBottomText}
          onChange={checked =>
            updateParagraph(vt.id, p =>
              p.kind === 'single_item' && p.variant === 'vertical_table'
                ? { ...p, showBottomText: checked }
                : p
            )
          }
        />
      </>
    )
  }

  if (!isSelected) return undefined
  if (isTitleWithPeriodParagraph(paragraph)) {
    const titleParagraph = paragraph as TitleWithPeriodParagraph
    return (
      <CmsToggle
        label="작성 기간"
        checked={titleParagraph.showWritingPeriodOnForm ?? false}
        onChange={checked =>
          updateParagraph(titleParagraph.id, p =>
            p.kind === 'description' && p.variant === 'survey_title_with_period'
              ? { ...p, showWritingPeriodOnForm: checked }
              : p
          )
        }
      />
    )
  }

  /* 마무리글형: 답변 필수 토글 없음(해당 없음). kind가 어긋나도 single_item용 답변 필수 토글 미노출 */
  if (paragraph.variant === 'closing') {
    return undefined
  }

  if (paragraph.kind === 'single_item') {
    const answerRequired = paragraph.answerRequired ?? paragraph.requiredMark
    const toggles: ReactNode[] = [
      <CmsToggle
        key="answer-required"
        label="답변 필수"
        checked={answerRequired}
        onChange={checked =>
          updateParagraph(paragraph.id, p =>
            p.kind === 'single_item' && p.id === paragraph.id
              ? { ...p, answerRequired: checked, requiredMark: checked }
              : p
          )
        }
      />,
    ]

    if (paragraph.variant === 'short_essay') {
      const shortEssay = paragraph as ShortEssayParagraph
      const itemCount = shortEssay.items?.length ?? 1
      const showItemTitle = itemCount >= 2 ? true : (shortEssay.showItemTitle ?? false)
      toggles.push(
        <CmsToggle
          key="item-title"
          label="항목 타이틀"
          checked={showItemTitle}
          disabled={itemCount >= 2}
          onChange={checked =>
            updateParagraph(shortEssay.id, p =>
              p.kind === 'single_item' && p.variant === 'short_essay'
                ? { ...p, showItemTitle: checked }
                : p
            )
          }
        />
      )
    }

    if (paragraph.variant === 'multiple_choice') {
      const mc = paragraph as MultipleChoiceParagraph
      toggles.push(
        <CmsToggle
          key="allow-multiple"
          label="중복 선택"
          checked={mc.allowMultiple ?? false}
          onChange={checked =>
            updateParagraph(mc.id, p => {
              if (p.kind !== 'single_item' || p.variant !== 'multiple_choice') return p
              return {
                ...p,
                allowMultiple: checked,
                ...(checked
                  ? { selectedPreviewSingleId: null }
                  : { selectedPreviewMultipleIds: [] }),
              }
            })
          }
        />
      )
    }

    if (paragraph.variant === 'date_time') {
      const dt = paragraph as DateTimeParagraph
      const mode = dt.fieldMode ?? 'date'
      if (mode === 'date' || mode === 'date_time') {
        toggles.push(
          <CmsToggle
            key="date-time-period"
            label="기간"
            checked={dt.periodEnabled ?? false}
            onChange={checked =>
              updateParagraph(dt.id, p => {
                if (p.kind !== 'single_item' || p.variant !== 'date_time') return p
                return { ...p, periodEnabled: checked }
              })
            }
          />
        )
      }
    }

    return (
      <div className="form-editor-card__toggles-row" onClick={event => event.stopPropagation()}>
        {toggles}
      </div>
    )
  }

  return undefined
}

function modalCardFooterActions(
  paragraph: WritingFormParagraph,
  isSelected: boolean,
  updateParagraph: FormEditorLeftPaneProps['updateParagraph'],
  middleParagraphActions: FormEditorLeftPaneProps['middleParagraphActions']
): ReactNode {
  if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
    if (!isSelected) return undefined
    const tableParagraph = paragraph as HorizontalTableParagraph
    return (
      <>
        <HorizontalTableDimensionActions
          paragraph={tableParagraph}
          onUpdate={next => updateParagraph(tableParagraph.id, () => next)}
        />
        {middleParagraphActions ? (
          <FormParagraphCardActions
            onAdd={() => middleParagraphActions.onAddAfter(tableParagraph.id)}
            onDuplicate={() => middleParagraphActions.onDuplicate(tableParagraph.id)}
            onDelete={() => middleParagraphActions.onDelete(tableParagraph.id)}
          />
        ) : null}
      </>
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'vertical_table') {
    if (!isSelected) return undefined
    const vt = paragraph as VerticalTableParagraph
    return (
      <>
        <VerticalTableDimensionActions
          paragraph={vt}
          onUpdate={next => updateParagraph(vt.id, () => next)}
        />
        {middleParagraphActions ? (
          <FormParagraphCardActions
            onAdd={() => middleParagraphActions.onAddAfter(vt.id)}
            onDuplicate={() => middleParagraphActions.onDuplicate(vt.id)}
            onDelete={() => middleParagraphActions.onDelete(vt.id)}
          />
        ) : null}
      </>
    )
  }

  if (!isSelected) return undefined
  if (paragraph.kind === 'description' && paragraph.variant === 'system') {
    if (isAgreementLockedSystemParagraph(paragraph)) return undefined
    return <FormParagraphCardActionsMinimal />
  }
  if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
    return <FormParagraphCardActionsMinimal />
  }

  if (paragraph.kind === 'single_item') {
    if (paragraph.variant === 'short_essay') {
      return (
        <FormParagraphCardActions
          onAddItem={() =>
            updateParagraph(paragraph.id, p => {
              if (p.kind !== 'single_item' || p.variant !== 'short_essay') return p
              const currentItems =
                p.items?.length && p.items.length > 0
                  ? p.items
                  : [
                      {
                        id: 'short-essay-item-1',
                        label: 'Title 01',
                        placeholder: p.bodyPlaceholder,
                        bodyText: p.bodyText,
                      },
                    ]
              const nextIndex = currentItems.length + 1
              const nextItems = [
                ...currentItems,
                {
                  id: `short-essay-item-${nextIndex}`,
                  label: `Title ${String(nextIndex).padStart(2, '0')}`,
                  placeholder: p.bodyPlaceholder,
                  bodyText: '',
                },
              ]
              return {
                ...p,
                items: nextItems,
                bodyText: nextItems[0]?.bodyText ?? '',
                showItemTitle: true,
              }
            })
          }
        />
      )
    }
    return <FormParagraphCardActions />
  }

  if (isTitleWithPeriodParagraph(paragraph)) {
    return <FormParagraphCardActionsMinimal />
  }

  return undefined
}

interface PinnedCardProps {
  paragraph: WritingFormParagraph
  paragraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  selectedCardId: string | null
  onSelectCard: (id: string) => void
  updateParagraph: FormEditorLeftPaneProps['updateParagraph']
  editorKind: FormEditorKind
  singleItemListActiveItemId?: string | null
  onSelectSingleItemListItem?: FormEditorLeftPaneProps['onSelectSingleItemListItem']
  horizontalTableRowSelectionsByParagraphId: FormEditorLeftPaneProps['horizontalTableRowSelectionsByParagraphId']
  onHorizontalTableRowSelectionChange: FormEditorLeftPaneProps['onHorizontalTableRowSelectionChange']
  verticalTableBodyRowSelection: FormEditorLeftPaneProps['verticalTableBodyRowSelection']
  onVerticalTableBodyRowSelectionChange: FormEditorLeftPaneProps['onVerticalTableBodyRowSelectionChange']
  middleParagraphActions: FormEditorLeftPaneProps['middleParagraphActions']
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
}

function PinnedFormCard({
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
}: PinnedCardProps) {
  const isSelected = selectedCardId === paragraph.id
  const editableHeading = paragraphEditableHeading(
    paragraph,
    paragraphs,
    titleNumbering,
    isSelected,
    updateParagraph,
    editorKind
  )

  return (
    <ParagraphCard
      className={[
        'form-editor-card',
        'paragraph-card--selectable',
        selectedCardId === paragraph.id ? 'paragraph-card--active' : '',
        isTitleWithPeriodParagraph(paragraph) ? 'paragraph-card--survey-title-with-period' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelectCard(paragraph.id)}
      editableHeading={editableHeading}
      toggles={modalCardFooterToggles(paragraph, isSelected, updateParagraph)}
      actions={modalCardFooterActions(paragraph, isSelected, updateParagraph, middleParagraphActions)}
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

interface SortableMiddleCardProps {
  paragraph: WritingFormParagraph
  paragraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  selectedCardId: string | null
  onSelectCard: (id: string) => void
  updateParagraph: FormEditorLeftPaneProps['updateParagraph']
  editorKind: FormEditorKind
  singleItemListActiveItemId?: string | null
  onSelectSingleItemListItem?: FormEditorLeftPaneProps['onSelectSingleItemListItem']
  horizontalTableRowSelectionsByParagraphId: FormEditorLeftPaneProps['horizontalTableRowSelectionsByParagraphId']
  onHorizontalTableRowSelectionChange: FormEditorLeftPaneProps['onHorizontalTableRowSelectionChange']
  verticalTableBodyRowSelection: FormEditorLeftPaneProps['verticalTableBodyRowSelection']
  onVerticalTableBodyRowSelectionChange: FormEditorLeftPaneProps['onVerticalTableBodyRowSelectionChange']
  middleParagraphActions: FormEditorLeftPaneProps['middleParagraphActions']
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
}

function SortableMiddleFormCard({
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
}: SortableMiddleCardProps) {
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
  const editableHeading = paragraphEditableHeading(
    paragraph,
    paragraphs,
    titleNumbering,
    isSelected,
    updateParagraph,
    editorKind
  )

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <ParagraphCard
        className={[
          'form-editor-card',
          'paragraph-card--selectable',
          selectedCardId === paragraph.id ? 'paragraph-card--active' : '',
          isTitleWithPeriodParagraph(paragraph) ? 'paragraph-card--survey-title-with-period' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => onSelectCard(paragraph.id)}
        actionSlot={
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
        }
        editableHeading={editableHeading}
        toggles={modalCardFooterToggles(paragraph, isSelected, updateParagraph)}
        actions={modalCardFooterActions(paragraph, isSelected, updateParagraph, middleParagraphActions)}
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

export function FormEditorLeftPane({
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  onReorderMiddle,
  updateParagraph,
  editorKind = 'survey',
  singleItemListActiveItemId,
  onSelectSingleItemListItem,
  layout = 'five',
  horizontalTableRowSelectionsByParagraphId,
  onHorizontalTableRowSelectionChange,
  verticalTableBodyRowSelection,
  onVerticalTableBodyRowSelectionChange,
  middleParagraphActions,
  paragraphBodyOptions,
}: FormEditorLeftPaneProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 2 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over == null || active.id === over.id) return
    onReorderMiddle(String(active.id), String(over.id))
  }

  if (layout === 'three') {
    if (editorKind === 'horizontal_table' && paragraphsAreOnlyTableLayoutParagraphs(paragraphs)) {
      const middle = paragraphs
      const sortableIds = middle.map(p => p.id)
      if (middle.length < 1) return null
      return (
        <div className="form-editor-left">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictFormEditorListToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {middle.map(p => (
                <SortableMiddleFormCard
                  key={p.id}
                  paragraph={p}
                  paragraphs={paragraphs}
                  titleNumbering={titleNumbering}
                  selectedCardId={selectedCardId}
                  onSelectCard={onSelectCard}
                  updateParagraph={updateParagraph}
                  editorKind={editorKind}
                  singleItemListActiveItemId={singleItemListActiveItemId}
                  onSelectSingleItemListItem={onSelectSingleItemListItem}
                  horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
                  onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
                  verticalTableBodyRowSelection={verticalTableBodyRowSelection}
                  onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
                  middleParagraphActions={middleParagraphActions}
                  paragraphBodyOptions={paragraphBodyOptions}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )
    }

    const tail = paragraphs[paragraphs.length - 1]
    const middle = paragraphs.slice(0, -1)
    const sortableIds = middle.map(p => p.id)
    if (!tail || middle.length < 1) return null

    return (
      <div className="form-editor-left">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictFormEditorListToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {middle.map(p => (
              <SortableMiddleFormCard
                key={p.id}
                paragraph={p}
                paragraphs={paragraphs}
                titleNumbering={titleNumbering}
                selectedCardId={selectedCardId}
                onSelectCard={onSelectCard}
                updateParagraph={updateParagraph}
                editorKind={editorKind}
                singleItemListActiveItemId={singleItemListActiveItemId}
                onSelectSingleItemListItem={onSelectSingleItemListItem}
                horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
                onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
                verticalTableBodyRowSelection={verticalTableBodyRowSelection}
                onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
                middleParagraphActions={middleParagraphActions}
                paragraphBodyOptions={paragraphBodyOptions}
              />
            ))}
          </SortableContext>
        </DndContext>
        <PinnedFormCard
          paragraph={tail}
          paragraphs={paragraphs}
          titleNumbering={titleNumbering}
          selectedCardId={selectedCardId}
          onSelectCard={onSelectCard}
          updateParagraph={updateParagraph}
          editorKind={editorKind}
          singleItemListActiveItemId={singleItemListActiveItemId}
          onSelectSingleItemListItem={onSelectSingleItemListItem}
          horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
          onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
          verticalTableBodyRowSelection={verticalTableBodyRowSelection}
          onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
          middleParagraphActions={middleParagraphActions}
          paragraphBodyOptions={paragraphBodyOptions}
        />
      </div>
    )
  }

  const split = getWritingFormHeadMiddlePinnedTail(paragraphs)
  if (split == null) return null
  const { head, middle, pinnedTail } = split
  const pinnedSystemRows = pinnedTail.filter(isAgreementLockedSystemParagraph)
  const pinnedCardTail = pinnedTail.filter(p => !isAgreementLockedSystemParagraph(p))
  const sortableIds = middle.map(p => p.id)

  if (middle.length < 1) return null

  return (
    <div className="form-editor-left">
      <PinnedFormCard
        paragraph={head}
        paragraphs={paragraphs}
        titleNumbering={titleNumbering}
        selectedCardId={selectedCardId}
        onSelectCard={onSelectCard}
        updateParagraph={updateParagraph}
        editorKind={editorKind}
        singleItemListActiveItemId={singleItemListActiveItemId}
        onSelectSingleItemListItem={onSelectSingleItemListItem}
        horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
        onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
        verticalTableBodyRowSelection={verticalTableBodyRowSelection}
        onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
        middleParagraphActions={middleParagraphActions}
        paragraphBodyOptions={paragraphBodyOptions}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictFormEditorListToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {middle.map(p => (
            <SortableMiddleFormCard
              key={p.id}
              paragraph={p}
              paragraphs={paragraphs}
              titleNumbering={titleNumbering}
              selectedCardId={selectedCardId}
              onSelectCard={onSelectCard}
              updateParagraph={updateParagraph}
              editorKind={editorKind}
              singleItemListActiveItemId={singleItemListActiveItemId}
              onSelectSingleItemListItem={onSelectSingleItemListItem}
              horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
              onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
              verticalTableBodyRowSelection={verticalTableBodyRowSelection}
              onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
              middleParagraphActions={middleParagraphActions}
              paragraphBodyOptions={paragraphBodyOptions}
            />
          ))}
        </SortableContext>
      </DndContext>
      {pinnedCardTail.map(p => (
        <PinnedFormCard
          key={p.id}
          paragraph={p}
          paragraphs={paragraphs}
          titleNumbering={titleNumbering}
          selectedCardId={selectedCardId}
          onSelectCard={onSelectCard}
          updateParagraph={updateParagraph}
          editorKind={editorKind}
          singleItemListActiveItemId={singleItemListActiveItemId}
          onSelectSingleItemListItem={onSelectSingleItemListItem}
          horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
          onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
          verticalTableBodyRowSelection={verticalTableBodyRowSelection}
          onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
          middleParagraphActions={middleParagraphActions}
          paragraphBodyOptions={paragraphBodyOptions}
        />
      ))}
      {pinnedSystemRows.length > 0 ? (
        <div className="form-editor-left__system-fixed">
          {pinnedSystemRows.map(p => (
            <div key={p.id} className="form-editor-left__system-fixed-row">
              {renderFormParagraphBody(p, updateParagraph, false, editorKind, paragraphBodyOptions)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
