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
import type {
  DateTimeParagraph,
  FormEditorKind,
  FormTitleNumberingStyle,
  MultipleChoiceParagraph,
  ShortEssayParagraph,
  TitleWithPeriodParagraph,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { renderFormParagraphBody } from '@/features/template/ui/paragraph/render-form-paragraph-body'
import { CmsToggle } from '@/shared/ui/cms-toggle'
import './form-editor.css'

export interface FormEditorLeftPaneProps {
  paragraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  selectedCardId: string | null
  onSelectCard: (id: string) => void
  onReorderMiddle: (activeId: string, overId: string) => void
  updateParagraph: (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => void
  editorKind?: FormEditorKind
  /** 주관식·객관식 등 단일항목 리스트의 우측 패널/강조 연동용 */
  singleItemListActiveItemId?: string | null
  onSelectSingleItemListItem?: (paragraphId: string, itemId: string | null) => void
}

function isTitleWithPeriodParagraph(p: WritingFormParagraph): boolean {
  return p.kind === 'description' && p.variant === 'survey_title_with_period'
}

/** 카드 헤더가 아웃라인 placeholder 문구일 때(진한 제목색 대신 #85969D) */
function formCardTitleUsesPlaceholderTone(p: WritingFormParagraph): boolean {
  if (p.kind === 'description' && p.variant === 'survey_title_with_period') {
    return !p.paragraphTitle.trim() && !p.surveyTitle.trim()
  }
  if (p.kind === 'description' && p.variant === 'closing') {
    return !p.body.trim()
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
      titleClassName: formCardTitleUsesPlaceholderTone(paragraph)
        ? 'paragraph-card__title--placeholder'
        : undefined,
      titleLeading: prefix,
      descriptionValue: p.surveyDescription,
      onDescriptionChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'survey_title_with_period'
            ? { ...cur, surveyDescription: next }
            : cur
        ),
      descriptionPlaceholder: '설명 입력',
    }
  }

  if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
    const p = paragraph
    return {
      isEditMode: isSelected,
      titleValue: p.paragraphTitle,
      onTitleChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'closing'
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
          cur.kind === 'description' && cur.variant === 'closing'
            ? { ...cur, paragraphDescription: next }
            : cur
        ),
      descriptionPlaceholder: '설명 입력',
    }
  }

  if (paragraph.kind === 'single_item') {
    const p = paragraph
    return {
      isEditMode: isSelected,
      titleValue: p.paragraphTitle,
      onTitleChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'single_item' && cur.id === p.id ? { ...cur, paragraphTitle: next } : cur
        ),
      titlePlaceholder: '타이틀을 입력해 주세요',
      titleRequired: p.answerRequired ?? p.requiredMark,
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

/** 카드 하단 `toggles` — 제목형(기간 노출) 선택 시에만 */
function modalCardFooterToggles(
  paragraph: WritingFormParagraph,
  isSelected: boolean,
  updateParagraph: FormEditorLeftPaneProps['updateParagraph']
): ReactNode {
  if (!isSelected) return undefined
  if (isTitleWithPeriodParagraph(paragraph)) {
    const titleParagraph = paragraph as TitleWithPeriodParagraph
    return (
      <CmsToggle
        label="작성 기간"
        checked={titleParagraph.showWritingPeriodOnForm}
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
  if (paragraph.kind === 'single_item') {
    const answerRequired = paragraph.answerRequired ?? true
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

/** 카드 하단 `actions` 슬롯 */
function modalCardFooterActions(
  paragraph: WritingFormParagraph,
  isSelected: boolean,
  updateParagraph: FormEditorLeftPaneProps['updateParagraph']
): ReactNode {
  if (!isSelected) return undefined
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
}: PinnedCardProps) {
  const isSelected = selectedCardId === paragraph.id
  const hideCardHeading = isTitleWithPeriodParagraph(paragraph) && isSelected
  const editableHeading = hideCardHeading
    ? undefined
    : paragraphEditableHeading(
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
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelectCard(paragraph.id)}
      editableHeading={editableHeading}
      toggles={modalCardFooterToggles(paragraph, isSelected, updateParagraph)}
      actions={modalCardFooterActions(paragraph, isSelected, updateParagraph)}
    >
      {renderFormParagraphBody(
        paragraph,
        updateParagraph,
        isSelected,
        editorKind,
        singleItemListActiveItemId,
        (paragraph.variant === 'short_essay' || paragraph.variant === 'multiple_choice') &&
          onSelectSingleItemListItem
          ? itemId => onSelectSingleItemListItem(paragraph.id, itemId)
          : undefined
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
  const hideCardHeading = isTitleWithPeriodParagraph(paragraph) && isSelected
  const editableHeading = hideCardHeading
    ? undefined
    : paragraphEditableHeading(
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
        actions={modalCardFooterActions(paragraph, isSelected, updateParagraph)}
      >
        {renderFormParagraphBody(
          paragraph,
          updateParagraph,
          isSelected,
          editorKind,
          singleItemListActiveItemId,
          (paragraph.variant === 'short_essay' || paragraph.variant === 'multiple_choice') &&
            onSelectSingleItemListItem
            ? itemId => onSelectSingleItemListItem(paragraph.id, itemId)
            : undefined
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
}: FormEditorLeftPaneProps) {
  const head = paragraphs[0]
  const tail = paragraphs[paragraphs.length - 1]
  const middle = paragraphs.slice(1, -1)
  const sortableIds = middle.map(p => p.id)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 2 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over == null || active.id === over.id) return
    onReorderMiddle(String(active.id), String(over.id))
  }

  if (!head || !tail || middle.length === 0) {
    return null
  }

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
      />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
      />
    </div>
  )
}
