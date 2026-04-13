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

export interface TemplateModalRightNavigationConfig {
  sectionTitle: string
  items: TemplateModalRightNavigationItem[]
}

export interface TemplateModalRightNavigationItem {
  id: string
  label: string
  /** 설정 시 목록·title 속성에 `${index + 1}. ${label}` 대신 이 문자열을 그대로 사용 */
  displayLine?: string
}

interface TemplateModalRightNavigationProps {
  config: TemplateModalRightNavigationConfig
  selectedItemId?: string | null
  onSelectItem?: (id: string) => void
  onReorderItems?: (items: TemplateModalRightNavigationItem[]) => void
  /** 목록·구분선 아래 추가 영역 (타이틀·폼·버튼 등; 구분선은 항상 컴포넌트에서 렌더) */
  children?: ReactNode
}

interface SortableNavigationItemProps {
  id: string
  item: TemplateModalRightNavigationItem
  index: number
  selected: boolean
  onSelect: () => void
}

function navigationItemLine(item: TemplateModalRightNavigationItem, index: number): string {
  return item.displayLine ?? `${index + 1}. ${item.label}`
}

function SortableNavigationItem({
  id,
  item,
  index,
  selected,
  onSelect,
}: SortableNavigationItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const line = navigationItemLine(item, index)

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
      <span className="template-modal-nav-item__label" title={line}>
        {line}
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

export function TemplateModalRightNavigation({
  config,
  selectedItemId,
  onSelectItem,
  onReorderItems,
  children,
}: TemplateModalRightNavigationProps) {
  const [items, setItems] = useState<TemplateModalRightNavigationItem[]>(config.items)
  const [internalSelectedItemId, setInternalSelectedItemId] = useState<string | null>(
    config.items[0]?.id ?? null
  )
  const activeSelectedItemId = selectedItemId ?? internalSelectedItemId
  const itemIds = useMemo(() => items.map(item => item.id), [items])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 2 } }))

  useEffect(() => {
    setItems(config.items)
    if (!onSelectItem) {
      setInternalSelectedItemId(config.items[0]?.id ?? null)
    }
  }, [config.items, onSelectItem])

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over == null || active.id === over.id) return
    const oldIndex = itemIds.findIndex(id => id === active.id)
    const newIndex = itemIds.findIndex(id => id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    setItems(prev => {
      const moved = arrayMove(prev, oldIndex, newIndex)
      onReorderItems?.(moved)
      return moved
    })
  }

  return (
    <>
      <span className="full-page-modal__nav-title">{config.sectionTitle}</span>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="template-modal-nav-list">
            {items.map((section, index) => (
              <SortableNavigationItem
                key={section.id}
                id={itemIds[index]}
                item={section}
                index={index}
                selected={activeSelectedItemId === section.id}
                onSelect={() => {
                  onSelectItem?.(section.id)
                  if (!onSelectItem) {
                    setInternalSelectedItemId(section.id)
                  }
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <hr className="template-modal-nav__children-divider" aria-hidden="true" />
      {children}
    </>
  )
}
