import { MenuOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ParagraphCard,
  TemplateFullpageModalCardDescription,
  TemplateFullpageModalCardTitle,
} from './template-fullpage-modal'

export interface TemplateModalLeftCardConfig {
  id: string
  title: string
  description: string
  required?: boolean
  children?: ReactNode
  /** true면 항상 목록 맨 위에 두고, 드래그 정렬·핸들 없음 */
  pinned?: boolean
}

/** 우측 네비 등에서 넘어온 id 순서를 반영하되, `pinned` 카드는 항상 앞쪽에 유지 */
export function mergeLeftCardOrderByDragIds(
  prev: TemplateModalLeftCardConfig[],
  orderedIds: string[]
): TemplateModalLeftCardConfig[] {
  const idSet = new Set(orderedIds)
  const pinned = prev.filter(c => c.pinned && idSet.has(c.id))
  const pinnedIdSet = new Set(pinned.map(p => p.id))
  const sortableOrdered = orderedIds
    .filter(id => !pinnedIdSet.has(id))
    .map(id => prev.find(c => c.id === id))
    .filter((c): c is TemplateModalLeftCardConfig => c != null && idSet.has(c.id))
  return [...pinned, ...sortableOrdered]
}

export function normalizeLeftCardOrder(
  cards: TemplateModalLeftCardConfig[]
): TemplateModalLeftCardConfig[] {
  return [...cards.filter(c => c.pinned), ...cards.filter(c => !c.pinned)]
}

interface TemplateModalLeftContentProps {
  config: TemplateModalLeftCardConfig[]
  selectedCardId?: string | null
  onSelectCard?: (id: string) => void
  onReorderCards?: (cards: TemplateModalLeftCardConfig[]) => void
}

interface LeftCardShellProps {
  card: TemplateModalLeftCardConfig
  selectedCardId?: string | null
  onSelectCard?: (id: string) => void
  actionSlot?: ReactNode
}

function LeftCardShell({ card, selectedCardId, onSelectCard, actionSlot }: LeftCardShellProps) {
  return (
    <ParagraphCard
      className={[
        onSelectCard ? 'paragraph-card--selectable' : '',
        selectedCardId === card.id ? 'paragraph-card--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onSelectCard ? () => onSelectCard(card.id) : undefined}
      actionSlot={actionSlot}
      title={<TemplateFullpageModalCardTitle title={card.title} required={card.required} />}
      description={<TemplateFullpageModalCardDescription>{card.description}</TemplateFullpageModalCardDescription>}
    >
      {card.children}
    </ParagraphCard>
  )
}

interface SortableLeftCardProps {
  card: TemplateModalLeftCardConfig
  selectedCardId?: string | null
  onSelectCard?: (id: string) => void
}

function SortableLeftCard({ card, selectedCardId, onSelectCard }: SortableLeftCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <LeftCardShell
        card={card}
        selectedCardId={selectedCardId}
        onSelectCard={onSelectCard}
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
      />
    </div>
  )
}

interface PinnedLeftCardProps {
  card: TemplateModalLeftCardConfig
  selectedCardId?: string | null
  onSelectCard?: (id: string) => void
}

function PinnedLeftCard({ card, selectedCardId, onSelectCard }: PinnedLeftCardProps) {
  return <LeftCardShell card={card} selectedCardId={selectedCardId} onSelectCard={onSelectCard} />
}

export function TemplateModalLeftContent({
  config,
  selectedCardId,
  onSelectCard,
  onReorderCards,
}: TemplateModalLeftContentProps) {
  const [items, setItems] = useState<TemplateModalLeftCardConfig[]>(() =>
    normalizeLeftCardOrder(config)
  )

  const pinnedItems = useMemo(() => items.filter(c => c.pinned), [items])
  const sortableItems = useMemo(() => items.filter(c => !c.pinned), [items])
  const sortableIds = useMemo(() => sortableItems.map(item => item.id), [sortableItems])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 2 } }))

  useEffect(() => {
    setItems(normalizeLeftCardOrder(config))
  }, [config])

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over == null || active.id === over.id) return
    const oldIndex = sortableIds.findIndex(id => id === active.id)
    const newIndex = sortableIds.findIndex(id => id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    setItems(prev => {
      const pinned = prev.filter(c => c.pinned)
      const sortable = prev.filter(c => !c.pinned)
      const moved = arrayMove(sortable, oldIndex, newIndex)
      const merged = [...pinned, ...moved]
      onReorderCards?.(merged)
      return merged
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {pinnedItems.map(card => (
        <PinnedLeftCard
          key={card.id}
          card={card}
          selectedCardId={selectedCardId}
          onSelectCard={onSelectCard}
        />
      ))}
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        {sortableItems.map(card => (
          <SortableLeftCard
            key={card.id}
            card={card}
            selectedCardId={selectedCardId}
            onSelectCard={onSelectCard}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
