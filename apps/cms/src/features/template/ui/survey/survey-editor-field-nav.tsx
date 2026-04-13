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
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './survey-editor.css'

export interface SurveyFieldNavItem {
  id: string
  displayLine: string
}

interface SurveyEditorFieldNavProps {
  sectionTitle: string
  pinnedTop: SurveyFieldNavItem
  sortableMiddle: SurveyFieldNavItem[]
  pinnedBottom: SurveyFieldNavItem
  selectedItemId: string | null
  onSelectItem: (id: string) => void
  onReorderMiddle: (activeId: string, overId: string) => void
  children?: ReactNode
}

function PinnedNavRow({
  item,
  selected,
  onSelect,
}: {
  item: SurveyFieldNavItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`template-modal-nav-item template-modal-nav-item--pinned ${selected ? 'template-modal-nav-item--selected' : ''}`}
      onClick={onSelect}
    >
      <span className="template-modal-nav-item__label" title={item.displayLine}>
        {item.displayLine}
      </span>
    </button>
  )
}

function SortableNavRow({
  item,
  selected,
  onSelect,
}: {
  item: SurveyFieldNavItem
  selected: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`template-modal-nav-item ${selected ? 'template-modal-nav-item--selected' : ''}`}
      onClick={onSelect}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <span className="template-modal-nav-item__label" title={item.displayLine}>
        {item.displayLine}
      </span>
      <span
        ref={setActivatorNodeRef}
        className="template-modal-nav-item__handle"
        aria-label="드래그 핸들"
        onClick={event => event.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <MenuOutlined />
      </span>
    </button>
  )
}

export function SurveyEditorFieldNav({
  sectionTitle,
  pinnedTop,
  sortableMiddle,
  pinnedBottom,
  selectedItemId,
  onSelectItem,
  onReorderMiddle,
  children,
}: SurveyEditorFieldNavProps) {
  const sortableIds = sortableMiddle.map(i => i.id)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 2 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over == null || active.id === over.id) return
    onReorderMiddle(String(active.id), String(over.id))
  }

  return (
    <>
      <span className="full-page-modal__nav-title">{sectionTitle}</span>
      <div className="template-modal-nav-list">
        <PinnedNavRow
          item={pinnedTop}
          selected={selectedItemId === pinnedTop.id}
          onSelect={() => onSelectItem(pinnedTop.id)}
        />
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {sortableMiddle.map(item => (
              <SortableNavRow
                key={item.id}
                item={item}
                selected={selectedItemId === item.id}
                onSelect={() => onSelectItem(item.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
        <PinnedNavRow
          item={pinnedBottom}
          selected={selectedItemId === pinnedBottom.id}
          onSelect={() => onSelectItem(pinnedBottom.id)}
        />
      </div>
      <hr className="template-modal-nav__children-divider" aria-hidden="true" />
      {children}
    </>
  )
}
