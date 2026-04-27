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
import { HorizontalTableDimensionActions } from '@/features/template/ui/paragraph/shared/horizontal-table-dimension-actions'
import { getFormParagraphTitleNumberPrefix } from '@/features/template/lib/form-title-numbering'
import type {
  AgreementExplanationTextParagraph,
  FormEditorKind,
  FormTitleNumberingStyle,
  HorizontalTableParagraph,
  HorizontalTableRowSelection,
  TitleWithPeriodParagraph,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { renderFormParagraphBody } from '@/features/template/ui/paragraph/render-form-paragraph-body'
import { CmsToggle } from '@/shared/ui/cms-toggle'
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
  /** 설문·동의: five(5단락). 테이블 가로형: three(3단락) */
  layout?: FormEditorLeftPaneLayout
  /** 테이블 가로형: 캔버스 행 선택 ↔ 우측 패널 동기화 */
  horizontalTableRowSelection?: HorizontalTableRowSelection | null
  onHorizontalTableRowSelectionChange?: (next: HorizontalTableRowSelection | null) => void
  /** 테이블 가로형 중간 단락: 추가·복제·삭제 */
  middleParagraphActions?: {
    onAddAfter: (paragraphId: string) => void
    onDuplicate: (paragraphId: string) => void
    onDelete: (paragraphId: string) => void
  }
}

function renderFormEditorParagraphBody(
  paragraph: WritingFormParagraph,
  updateParagraph: FormEditorLeftPaneProps['updateParagraph'],
  isSelected: boolean,
  editorKind: FormEditorKind,
  horizontalTableRowSelection: FormEditorLeftPaneProps['horizontalTableRowSelection'],
  onHorizontalTableRowSelectionChange: FormEditorLeftPaneProps['onHorizontalTableRowSelectionChange']
) {
  const opts =
    horizontalTableRowSelection !== undefined && onHorizontalTableRowSelectionChange !== undefined
      ? { horizontalTableRowSelection, onHorizontalTableRowSelectionChange }
      : undefined
  return renderFormParagraphBody(paragraph, updateParagraph, isSelected, editorKind, opts)
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
          cur.kind === 'description' && cur.variant === 'closing' ? { ...cur, paragraphTitle: next } : cur
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
          cur.kind === 'description' && cur.variant === 'closing' ? { ...cur, paragraphDescription: next } : cur
        ),
      descriptionPlaceholder: '설명 입력',
    }
  }

  if (paragraph.kind === 'single_item') {
    const p = paragraph
    const titleRequired =
      p.variant === 'horizontal_table'
        ? (p as HorizontalTableParagraph).answerRequired
        : p.requiredMark
    return {
      isEditMode: isSelected,
      titleValue: p.paragraphTitle,
      onTitleChange: (next: string) =>
        updateParagraph(p.id, cur => (cur.kind === 'single_item' && cur.id === p.id ? { ...cur, paragraphTitle: next } : cur)),
      titlePlaceholder: '타이틀을 입력해 주세요',
      titleRequired,
      titleClassName: formCardTitleUsesPlaceholderTone(paragraph)
        ? 'paragraph-card__title--placeholder'
        : undefined,
      titleLeading: prefix,
      descriptionValue: p.paragraphDescription,
      onDescriptionChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'single_item' && cur.id === p.id ? { ...cur, paragraphDescription: next } : cur
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
  if (paragraph.kind === 'single_item' && paragraph.variant === 'agreement_explanation_text') {
    const textParagraph = paragraph as AgreementExplanationTextParagraph
    return (
      <CmsToggle
        label="답변 필수"
        checked={textParagraph.answerRequired}
        onChange={checked =>
          updateParagraph(textParagraph.id, p =>
            p.kind === 'single_item' && p.variant === 'agreement_explanation_text'
              ? { ...p, answerRequired: checked }
              : p
          )
        }
      />
    )
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
    const tableParagraph = paragraph as HorizontalTableParagraph
    return (
      <>
        <CmsToggle
          label="답변 필수"
          checked={tableParagraph.answerRequired}
          onChange={checked =>
            updateParagraph(tableParagraph.id, p =>
              p.kind === 'single_item' && p.variant === 'horizontal_table'
                ? { ...p, answerRequired: checked }
                : p
            )
          }
        />
        <CmsToggle
          label="하단 텍스트"
          checked={tableParagraph.showBottomText}
          onChange={checked =>
            updateParagraph(tableParagraph.id, p =>
              p.kind === 'single_item' && p.variant === 'horizontal_table'
                ? { ...p, showBottomText: checked }
                : p
            )
          }
        />
      </>
    )
  }
  return undefined
}

/** 카드 하단 `actions` 슬롯 */
function modalCardFooterActions(
  paragraph: WritingFormParagraph,
  isSelected: boolean,
  updateParagraph: FormEditorLeftPaneProps['updateParagraph'],
  middleParagraphActions: FormEditorLeftPaneProps['middleParagraphActions']
): ReactNode {
  if (!isSelected) return undefined
  if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
    return <FormParagraphCardActionsMinimal />
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
    const p = paragraph as HorizontalTableParagraph
    return (
      <>
        <HorizontalTableDimensionActions
          paragraph={p}
          onUpdate={next =>
            updateParagraph(p.id, cur =>
              cur.kind === 'single_item' && cur.variant === 'horizontal_table' ? next : cur
            )
          }
        />
        <FormParagraphCardActions
          onAdd={() => middleParagraphActions?.onAddAfter(p.id)}
          onDuplicate={() => middleParagraphActions?.onDuplicate(p.id)}
          onDelete={() => middleParagraphActions?.onDelete(p.id)}
        />
      </>
    )
  }
  if (paragraph.kind === 'single_item') {
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
  horizontalTableRowSelection: FormEditorLeftPaneProps['horizontalTableRowSelection']
  onHorizontalTableRowSelectionChange: FormEditorLeftPaneProps['onHorizontalTableRowSelectionChange']
  middleParagraphActions: FormEditorLeftPaneProps['middleParagraphActions']
}

function PinnedFormCard({
  paragraph,
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  updateParagraph,
  editorKind,
  horizontalTableRowSelection,
  onHorizontalTableRowSelectionChange,
  middleParagraphActions,
}: PinnedCardProps) {
  const isSelected = selectedCardId === paragraph.id
  const hideCardHeading = isTitleWithPeriodParagraph(paragraph) && isSelected
  const editableHeading = hideCardHeading
    ? undefined
    : paragraphEditableHeading(paragraph, paragraphs, titleNumbering, isSelected, updateParagraph, editorKind)

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
      actions={modalCardFooterActions(paragraph, isSelected, updateParagraph, middleParagraphActions)}
    >
      {renderFormEditorParagraphBody(
        paragraph,
        updateParagraph,
        isSelected,
        editorKind,
        horizontalTableRowSelection,
        onHorizontalTableRowSelectionChange
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
  horizontalTableRowSelection: FormEditorLeftPaneProps['horizontalTableRowSelection']
  onHorizontalTableRowSelectionChange: FormEditorLeftPaneProps['onHorizontalTableRowSelectionChange']
  middleParagraphActions: FormEditorLeftPaneProps['middleParagraphActions']
}

function SortableMiddleFormCard({
  paragraph,
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  updateParagraph,
  editorKind,
  horizontalTableRowSelection,
  onHorizontalTableRowSelectionChange,
  middleParagraphActions,
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
    : paragraphEditableHeading(paragraph, paragraphs, titleNumbering, isSelected, updateParagraph, editorKind)

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
        actions={modalCardFooterActions(paragraph, isSelected, updateParagraph, middleParagraphActions)}
      >
        {renderFormEditorParagraphBody(
          paragraph,
          updateParagraph,
          isSelected,
          editorKind,
          horizontalTableRowSelection,
          onHorizontalTableRowSelectionChange
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
  layout = 'five',
  horizontalTableRowSelection,
  onHorizontalTableRowSelectionChange,
  middleParagraphActions,
}: FormEditorLeftPaneProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 2 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over == null || active.id === over.id) return
    onReorderMiddle(String(active.id), String(over.id))
  }

  if (layout === 'three') {
    const head = paragraphs[0]
    const tail = paragraphs[paragraphs.length - 1]
    const middle = paragraphs.slice(1, -1)
    const sortableIds = middle.map(p => p.id)
    if (!head || !tail || middle.length < 1) {
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
          horizontalTableRowSelection={horizontalTableRowSelection}
          onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
          middleParagraphActions={middleParagraphActions}
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
                horizontalTableRowSelection={horizontalTableRowSelection}
                onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
                middleParagraphActions={middleParagraphActions}
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
          horizontalTableRowSelection={horizontalTableRowSelection}
          onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
          middleParagraphActions={middleParagraphActions}
        />
      </div>
    )
  }

  const head = paragraphs[0]
  const tail = paragraphs[4]
  const middle = paragraphs.slice(1, 4)
  const sortableIds = middle.map(p => p.id)

  if (!head || !tail || middle.length !== 3) {
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
        horizontalTableRowSelection={horizontalTableRowSelection}
        onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
        middleParagraphActions={middleParagraphActions}
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
              horizontalTableRowSelection={horizontalTableRowSelection}
              onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
              middleParagraphActions={middleParagraphActions}
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
        horizontalTableRowSelection={horizontalTableRowSelection}
        onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
        middleParagraphActions={middleParagraphActions}
      />
    </div>
  )
}
