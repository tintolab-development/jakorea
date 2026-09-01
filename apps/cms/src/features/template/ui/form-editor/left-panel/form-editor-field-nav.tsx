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
import { restrictFormEditorListToVerticalAxis } from '@/features/template/ui/form-editor/dnd-restrict-vertical-axis'
import '../form-editor.css'

export interface FormEditorFieldNavItem {
  id: string
  displayLine: string
}

interface FormEditorFieldNavProps {
  sectionTitle: string
  /** 가로형 등 상단 고정 항목이 없을 때 생략 */
  pinnedTop?: FormEditorFieldNavItem | null
  sortableMiddle: FormEditorFieldNavItem[]
  /** sortable 목록 중 핸들을 숨길 단락 id(좌측 `hideDragHandleForParagraphIds`와 맞춤) */
  hideSortableDragHandleForIds?: ReadonlySet<string>
  /** 가로형(테이블만) 등 하단 고정 항이 없을 때 생략 — 동의 양식은 복수 고정(날짜·서명·마무리) */
  pinnedBottom?: FormEditorFieldNavItem | FormEditorFieldNavItem[] | null
  selectedItemId: string | null
  onSelectItem: (id: string) => void
  onReorderMiddle: (activeId: string, overId: string) => void
  fieldListBottomSlot?: ReactNode
  children?: ReactNode
}

function PinnedNavRow({
  item,
  selected,
  onSelect,
}: {
  item: FormEditorFieldNavItem
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
  hideDragHandle = false,
}: {
  item: FormEditorFieldNavItem
  selected: boolean
  onSelect: () => void
  /** true면 DnD 핸들 미노출(해당 행은 드래그 소스로 쓰이지 않음) */
  hideDragHandle?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

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
      {!hideDragHandle ? (
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
      ) : null}
    </button>
  )
}

export function FormEditorFieldNav({
  sectionTitle,
  pinnedTop,
  sortableMiddle,
  hideSortableDragHandleForIds,
  pinnedBottom,
  selectedItemId,
  onSelectItem,
  onReorderMiddle,
  fieldListBottomSlot,
  children,
}: FormEditorFieldNavProps) {
  const pinnedBottomList =
    pinnedBottom == null ? [] : Array.isArray(pinnedBottom) ? pinnedBottom : [pinnedBottom]
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
        {pinnedTop != null && (
          <PinnedNavRow
            item={pinnedTop}
            selected={selectedItemId === pinnedTop.id}
            onSelect={() => onSelectItem(pinnedTop.id)}
          />
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictFormEditorListToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {sortableMiddle.map(item => (
              <SortableNavRow
                key={item.id}
                item={item}
                selected={selectedItemId === item.id}
                onSelect={() => onSelectItem(item.id)}
                hideDragHandle={hideSortableDragHandleForIds?.has(item.id) ?? false}
              />
            ))}
          </SortableContext>
        </DndContext>
        {pinnedBottomList.map(item => (
          <PinnedNavRow
            key={item.id}
            item={item}
            selected={selectedItemId === item.id}
            onSelect={() => onSelectItem(item.id)}
          />
        ))}
      </div>
      {fieldListBottomSlot}
      <hr className="template-modal-nav__children-divider" aria-hidden="true" />
      {children}
    </>
  )
}
