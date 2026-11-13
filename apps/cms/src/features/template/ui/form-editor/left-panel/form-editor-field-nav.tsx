import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { SortOrderDragIcon } from '@/shared/ui/sort-order-drag-icon'
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
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import '../form-editor.css'

export interface FormEditorFieldNavItem {
  id: string
  displayLine: string
  /**
   * 템플릿 관리 전용 — 회색 안내 줄(빈 제목 「타이틀을 입력해 주세요」·「설문 제목 입력」, 기본 마무리글).
   * 시안 12723:137188·5767:42989·5767:43362·5767:49321·5767:41865. 다른 화면은 무시.
   */
  placeholder?: boolean
  /** 템플릿 관리 전용 — sortable 목록 안에서도 이동 핸들 없이 고정(설문 제목·마무리글 행) */
  pinned?: boolean
}

function navItemLabelClassName(item: FormEditorFieldNavItem, templateManagement: boolean) {
  return templateManagement && item.placeholder === true
    ? 'template-modal-nav-item__label template-modal-nav-item__label--placeholder'
    : 'template-modal-nav-item__label'
}

interface FormEditorFieldNavProps {
  sectionTitle: string
  /** 가로형 등 상단 고정 항목이 없을 때 생략 */
  pinnedTop?: FormEditorFieldNavItem | null
  sortableMiddle: FormEditorFieldNavItem[]
  /** sortable 목록 중 핸들을 숨길 단락 id(좌측 `hideDragHandleForParagraphIds`와 맞춤) */
  hideSortableDragHandleForIds?: ReadonlySet<string>
  /** 구조 잠금(가로형 시드)이어도 단락 순서 변경은 허용 — 신청 양식 */
  allowReorderWhenStructureLocked?: boolean
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
  templateManagement,
}: {
  item: FormEditorFieldNavItem
  selected: boolean
  onSelect: () => void
  templateManagement: boolean
}) {
  return (
    <button
      type="button"
      className={`template-modal-nav-item template-modal-nav-item--pinned ${selected ? 'template-modal-nav-item--selected' : ''}`}
      onClick={onSelect}
    >
      <span className={navItemLabelClassName(item, templateManagement)} title={item.displayLine}>
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
  templateManagement,
}: {
  item: FormEditorFieldNavItem
  selected: boolean
  onSelect: () => void
  /** true면 DnD 핸들 미노출(해당 행은 드래그 소스로 쓰이지 않음) */
  hideDragHandle?: boolean
  templateManagement: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: hideDragHandle })
  /** 템플릿 관리 고정 행 — 시안처럼 핸들 아이콘 자체를 그리지 않는다 */
  const omitHandle = templateManagement && item.pinned === true

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`template-modal-nav-item ${omitHandle ? 'template-modal-nav-item--pinned' : ''} ${selected ? 'template-modal-nav-item--selected' : ''}`}
      onClick={onSelect}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <span className={navItemLabelClassName(item, templateManagement)} title={item.displayLine}>
        {item.displayLine}
      </span>
      {omitHandle ? null : !hideDragHandle ? (
        <span
          ref={setActivatorNodeRef}
          className="template-modal-nav-item__handle"
          aria-label="드래그 핸들"
          onClick={event => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <SortOrderDragIcon />
        </span>
      ) : (
        <span
          className="template-modal-nav-item__handle template-modal-nav-item__handle--non-interactive"
          aria-hidden
        >
          <SortOrderDragIcon />
        </span>
      )}
    </button>
  )
}

export function FormEditorFieldNav({
  sectionTitle,
  pinnedTop,
  sortableMiddle,
  hideSortableDragHandleForIds,
  allowReorderWhenStructureLocked = false,
  pinnedBottom,
  selectedItemId,
  onSelectItem,
  onReorderMiddle,
  fieldListBottomSlot,
  children,
}: FormEditorFieldNavProps) {
  const childProps =
    isValidElement(children)
      ? (children.props as {
          editorKind?: string
          structureLockedParagraphIds?: ReadonlySet<string>
        })
      : undefined
  const structureControlsDisabled =
    childProps?.editorKind === 'horizontal_table' &&
    childProps.structureLockedParagraphIds != null
  const reorderDisabled = structureControlsDisabled && !allowReorderWhenStructureLocked
  const pinnedBottomList =
    pinnedBottom == null ? [] : Array.isArray(pinnedBottom) ? pinnedBottom : [pinnedBottom]
  const sortableIds = sortableMiddle.map(i => i.id)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 2 } }))
  const templateManagement = useIsTemplateManagementScreen()
  const isPinnedInTemplateManagement = (id: string) =>
    templateManagement && sortableMiddle.some(item => item.id === id && item.pinned === true)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (reorderDisabled) return
    if (over == null || active.id === over.id) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (
      hideSortableDragHandleForIds?.has(activeId) ||
      hideSortableDragHandleForIds?.has(overId) ||
      isPinnedInTemplateManagement(activeId) ||
      isPinnedInTemplateManagement(overId)
    ) {
      return
    }
    onReorderMiddle(activeId, overId)
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
            templateManagement={templateManagement}
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
                hideDragHandle={
                  reorderDisabled ||
                  (hideSortableDragHandleForIds?.has(item.id) ?? false) ||
                  (templateManagement && item.pinned === true)
                }
                templateManagement={templateManagement}
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
            templateManagement={templateManagement}
          />
        ))}
      </div>
      {structureControlsDisabled && isValidElement(fieldListBottomSlot)
        ? cloneElement(
            fieldListBottomSlot as ReactElement<{ disabled?: boolean }>,
            { disabled: true }
          )
        : fieldListBottomSlot}
      <hr className="template-modal-nav__children-divider" aria-hidden="true" />
      {children}
    </>
  )
}
