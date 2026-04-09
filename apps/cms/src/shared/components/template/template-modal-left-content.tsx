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
  TemplateFullpageModalCard,
  TemplateFullpageModalCardDescription,
  TemplateFullpageModalCardTitle,
} from './template-fullpage-modal'

export interface TemplateModalLeftCardConfig {
  id: string
  title: string
  description: string
  required?: boolean
  children?: ReactNode
}

interface TemplateModalLeftContentProps {
  config: TemplateModalLeftCardConfig[]
  selectedCardId?: string | null
  onSelectCard?: (id: string) => void
  onReorderCards?: (cards: TemplateModalLeftCardConfig[]) => void
}

interface SortableLeftCardProps {
  card: TemplateModalLeftCardConfig
  selectedCardId?: string | null
  onSelectCard?: (id: string) => void
}

function SortableLeftCard({ card, selectedCardId, onSelectCard }: SortableLeftCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id })

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
          onSelectCard ? 'full-page-modal-card--selectable' : '',
          selectedCardId === card.id ? 'full-page-modal-card--active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={onSelectCard ? () => onSelectCard(card.id) : undefined}
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
        <TemplateFullpageModalCardTitle title={card.title} required={card.required} />
        <TemplateFullpageModalCardDescription>{card.description}</TemplateFullpageModalCardDescription>
        {card.children}
      </TemplateFullpageModalCard>
    </div>
  )
}

export function TemplateModalLeftContent({
  config,
  selectedCardId,
  onSelectCard,
  onReorderCards,
}: TemplateModalLeftContentProps) {
  const [items, setItems] = useState<TemplateModalLeftCardConfig[]>(config)
  const itemIds = useMemo(() => items.map(item => item.id), [items])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 2 } }))

  useEffect(() => {
    setItems(config)
  }, [config])

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over == null || active.id === over.id) return
    const oldIndex = itemIds.findIndex(id => id === active.id)
    const newIndex = itemIds.findIndex(id => id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    setItems(prev => {
      const moved = arrayMove(prev, oldIndex, newIndex)
      onReorderCards?.(moved)
      return moved
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {items.map(card => (
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
