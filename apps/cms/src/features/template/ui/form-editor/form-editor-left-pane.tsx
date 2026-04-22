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
import {
  ParagraphCard,
  TemplateFullpageModalCardDescription,
  TemplateFullpageModalCardTitle,
} from '@/features/template/ui/template-fullpage-modal'
import {
  FormParagraphCardActions,
  FormParagraphCardActionsMinimal,
} from '@/features/template/ui/paragraph/shared/paragraph-actions'
import { getFormParagraphDisplayTitle } from '@/features/template/lib/form-title-numbering'
import type {
  AgreementExplanationTextParagraph,
  FormEditorKind,
  FormTitleNumberingStyle,
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

function cardDescriptionContent(p: WritingFormParagraph): ReactNode {
  if (p.kind === 'description' && p.variant === 'survey_title_with_period') {
    const text = p.surveyDescription.trim()
    return text || <span className="form-editor-placeholder">설명 입력</span>
  }
  const text = p.paragraphDescription.trim()
  if (!text) {
    return <span className="form-editor-placeholder">설명 입력</span>
  }
  return text
}

function titleWithPeriodPlaceholder(editorKind: FormEditorKind): string {
  return editorKind === 'agreement' ? '동의서 제목 입력' : '타이틀을 입력해 주세요'
}

function cardTitleContent(
  paragraph: WritingFormParagraph,
  displayTitle: string,
  editorKind: FormEditorKind
): string {
  if (isTitleWithPeriodParagraph(paragraph)) {
    const titleParagraph = paragraph as TitleWithPeriodParagraph
    const text = titleParagraph.surveyTitle.trim()
    return text || titleWithPeriodPlaceholder(editorKind)
  }
  return displayTitle
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
  return undefined
}

/** 카드 하단 `actions` 슬롯 */
function modalCardFooterActions(paragraph: WritingFormParagraph, isSelected: boolean): ReactNode {
  if (!isSelected) return undefined
  if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
    return <FormParagraphCardActionsMinimal />
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
}

function PinnedFormCard({
  paragraph,
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  updateParagraph,
  editorKind,
}: PinnedCardProps) {
  const displayTitle = getFormParagraphDisplayTitle(paragraphs, paragraph, titleNumbering)
  const isSelected = selectedCardId === paragraph.id
  const hideCardHeading = isTitleWithPeriodParagraph(paragraph) && isSelected

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
      title={
        hideCardHeading ? undefined : (
          <TemplateFullpageModalCardTitle
            title={cardTitleContent(paragraph, displayTitle, editorKind)}
            required={paragraph.requiredMark}
            titleClassName={
              formCardTitleUsesPlaceholderTone(paragraph)
                ? 'paragraph-card__title--placeholder'
                : undefined
            }
          />
        )
      }
      description={
        hideCardHeading ? undefined : (
          <TemplateFullpageModalCardDescription>
            {cardDescriptionContent(paragraph)}
          </TemplateFullpageModalCardDescription>
        )
      }
      toggles={modalCardFooterToggles(paragraph, isSelected, updateParagraph)}
      actions={modalCardFooterActions(paragraph, isSelected)}
    >
      {renderFormParagraphBody(paragraph, updateParagraph, isSelected, editorKind)}
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
}

function SortableMiddleFormCard({
  paragraph,
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  updateParagraph,
  editorKind,
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

  const displayTitle = getFormParagraphDisplayTitle(paragraphs, paragraph, titleNumbering)
  const isSelected = selectedCardId === paragraph.id
  const hideCardHeading = isTitleWithPeriodParagraph(paragraph) && isSelected

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
        title={
          hideCardHeading ? undefined : (
            <TemplateFullpageModalCardTitle
              title={cardTitleContent(paragraph, displayTitle, editorKind)}
              required={paragraph.requiredMark}
              titleClassName={
                formCardTitleUsesPlaceholderTone(paragraph)
                  ? 'paragraph-card__title--placeholder'
                  : undefined
              }
            />
          )
        }
        description={
          hideCardHeading ? undefined : (
            <TemplateFullpageModalCardDescription>
              {cardDescriptionContent(paragraph)}
            </TemplateFullpageModalCardDescription>
          )
        }
        toggles={modalCardFooterToggles(paragraph, isSelected, updateParagraph)}
        actions={modalCardFooterActions(paragraph, isSelected)}
      >
        {renderFormParagraphBody(paragraph, updateParagraph, isSelected, editorKind)}
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
}: FormEditorLeftPaneProps) {
  const head = paragraphs[0]
  const tail = paragraphs[4]
  const middle = paragraphs.slice(1, 4)
  const sortableIds = middle.map(p => p.id)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 2 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over == null || active.id === over.id) return
    onReorderMiddle(String(active.id), String(over.id))
  }

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
      />
    </div>
  )
}
