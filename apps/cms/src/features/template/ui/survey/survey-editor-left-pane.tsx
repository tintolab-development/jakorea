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
  TemplateFullpageModalCard,
  TemplateFullpageModalCardDescription,
  TemplateFullpageModalCardTitle,
} from '@/features/template/ui/template-fullpage-modal'
import { getSurveyParagraphDisplayTitle } from '@/features/template/lib/survey-title-numbering'
import type { SurveyParagraph } from '@/features/template/model/survey-draft.schema'
import type { SurveyTitleNumberingStyle } from '@/features/template/model/survey-draft.schema'
import { renderSurveyParagraphBody } from '@/features/template/ui/paragraph/render-survey-paragraph-body'
import './survey-editor.css'

export interface SurveyEditorLeftPaneProps {
  paragraphs: SurveyParagraph[]
  titleNumbering: SurveyTitleNumberingStyle
  selectedCardId: string | null
  onSelectCard: (id: string) => void
  onReorderMiddle: (activeId: string, overId: string) => void
  updateParagraph: (id: string, updater: (p: SurveyParagraph) => SurveyParagraph) => void
}

function isSurveyTitleWithPeriodParagraph(p: SurveyParagraph): boolean {
  return p.kind === 'description' && p.variant === 'survey_title_with_period'
}

/** 카드 헤더가 아웃라인 placeholder 문구일 때(진한 제목색 대신 #85969D) */
function surveyCardTitleUsesPlaceholderTone(p: SurveyParagraph): boolean {
  if (p.kind === 'description' && p.variant === 'survey_title_with_period') {
    return !p.paragraphTitle.trim() && !p.surveyTitle.trim()
  }
  if (p.kind === 'description' && p.variant === 'closing') {
    return !p.body.trim()
  }
  return !p.paragraphTitle.trim()
}

function cardDescriptionContent(p: SurveyParagraph): ReactNode {
  if (p.kind === 'description' && p.variant === 'survey_title_with_period') {
    const text = p.surveyDescription.trim()
    return text || <span className="survey-editor-placeholder">설명 입력</span>
  }
  const text = p.paragraphDescription.trim()
  if (!text) {
    return <span className="survey-editor-placeholder">설명 입력</span>
  }
  return text
}

interface PinnedCardProps {
  paragraph: SurveyParagraph
  paragraphs: SurveyParagraph[]
  titleNumbering: SurveyTitleNumberingStyle
  selectedCardId: string | null
  onSelectCard: (id: string) => void
  updateParagraph: SurveyEditorLeftPaneProps['updateParagraph']
}

function PinnedSurveyCard({
  paragraph,
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  updateParagraph,
}: PinnedCardProps) {
  const displayTitle = getSurveyParagraphDisplayTitle(paragraphs, paragraph, titleNumbering)
  const isSelected = selectedCardId === paragraph.id
  const hideCardHeading = isSurveyTitleWithPeriodParagraph(paragraph) && isSelected

  return (
    <TemplateFullpageModalCard
      className={[
        'survey-editor-card',
        'full-page-modal-card--selectable',
        selectedCardId === paragraph.id ? 'full-page-modal-card--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelectCard(paragraph.id)}
    >
      {hideCardHeading ? null : (
        <>
          <TemplateFullpageModalCardTitle
            title={displayTitle}
            required={paragraph.requiredMark}
            titleClassName={
              surveyCardTitleUsesPlaceholderTone(paragraph)
                ? 'full-page-modal-card__title--placeholder'
                : undefined
            }
          />
          <TemplateFullpageModalCardDescription>
            {cardDescriptionContent(paragraph)}
          </TemplateFullpageModalCardDescription>
        </>
      )}
      {renderSurveyParagraphBody(paragraph, updateParagraph, isSelected)}
    </TemplateFullpageModalCard>
  )
}

interface SortableMiddleCardProps {
  paragraph: SurveyParagraph
  paragraphs: SurveyParagraph[]
  titleNumbering: SurveyTitleNumberingStyle
  selectedCardId: string | null
  onSelectCard: (id: string) => void
  updateParagraph: SurveyEditorLeftPaneProps['updateParagraph']
}

function SortableMiddleSurveyCard({
  paragraph,
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  updateParagraph,
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

  const displayTitle = getSurveyParagraphDisplayTitle(paragraphs, paragraph, titleNumbering)
  const isSelected = selectedCardId === paragraph.id
  const hideCardHeading = isSurveyTitleWithPeriodParagraph(paragraph) && isSelected

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <TemplateFullpageModalCard
        className={[
          'survey-editor-card',
          'full-page-modal-card--selectable',
          selectedCardId === paragraph.id ? 'full-page-modal-card--active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => onSelectCard(paragraph.id)}
        actionSlot={
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="full-page-modal-card__drag-handle"
            aria-label="카드 순서 변경"
            onClick={event => event.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <MenuOutlined />
          </button>
        }
      >
        {hideCardHeading ? null : (
          <>
            <TemplateFullpageModalCardTitle
              title={displayTitle}
              required={paragraph.requiredMark}
              titleClassName={
                surveyCardTitleUsesPlaceholderTone(paragraph)
                  ? 'full-page-modal-card__title--placeholder'
                  : undefined
              }
            />
            <TemplateFullpageModalCardDescription>
              {cardDescriptionContent(paragraph)}
            </TemplateFullpageModalCardDescription>
          </>
        )}
        {renderSurveyParagraphBody(paragraph, updateParagraph, isSelected)}
      </TemplateFullpageModalCard>
    </div>
  )
}

export function SurveyEditorLeftPane({
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  onReorderMiddle,
  updateParagraph,
}: SurveyEditorLeftPaneProps) {
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
    <div className="survey-editor-left">
      <PinnedSurveyCard
        paragraph={head}
        paragraphs={paragraphs}
        titleNumbering={titleNumbering}
        selectedCardId={selectedCardId}
        onSelectCard={onSelectCard}
        updateParagraph={updateParagraph}
      />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {middle.map(p => (
            <SortableMiddleSurveyCard
              key={p.id}
              paragraph={p}
              paragraphs={paragraphs}
              titleNumbering={titleNumbering}
              selectedCardId={selectedCardId}
              onSelectCard={onSelectCard}
              updateParagraph={updateParagraph}
            />
          ))}
        </SortableContext>
      </DndContext>
      <PinnedSurveyCard
        paragraph={tail}
        paragraphs={paragraphs}
        titleNumbering={titleNumbering}
        selectedCardId={selectedCardId}
        onSelectCard={onSelectCard}
        updateParagraph={updateParagraph}
      />
    </div>
  )
}
