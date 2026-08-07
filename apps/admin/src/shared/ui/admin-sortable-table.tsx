/**
 * Admin Ant Design Table + dnd-kit 세로 정렬 공통
 * - DnD 중 useSortable transform 으로 위치 실시간 동기화 (포인터 1:1, transition 없음)
 * - dragOver 시 DOM arrayMove 하지 않음 → 테이블 full re-render 지연 제거
 * - API·store 반영(onRowsReorder)은 dragEnd 1회
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { SortOrderDragHandle } from '@/shared/ui/sort-order-drag-handle'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Modifier,
} from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export type AdminSortableRowId = { id: string }

type RowContextProps = {
  setActivatorNodeRef?: (element: HTMLElement | null) => void
  listeners?: SyntheticListenerMap
  disabled?: boolean
}

const AdminSortableRowContext = createContext<RowContextProps>({})

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
})

/** transition 0 → transform 이 마우스/포인터와 동일 속도 */
const INSTANT_TRANSITION = {
  duration: 0,
  easing: 'linear',
} as const

type SortableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  'data-row-key'?: string | number
}

/** Ant Table `components.body.row` — 모든 feature sortable 테이블 공용 */
export const AdminSortableTableRow: React.FC<
  SortableRowProps & { dragDisabled?: boolean }
> = ({ dragDisabled = false, ...props }) => {
  const rowId = String(props['data-row-key'] ?? '')
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: rowId,
    disabled: dragDisabled,
    transition: INSTANT_TRANSITION,
  })

  const style: CSSProperties = {
    ...props.style,
    /* 드래그 행: 포인터 delta 그대로 / 밀려나는 행: strategy transform 즉시 반영 */
    transform: transform
      ? CSS.Translate.toString({
          x: 0,
          y: transform.y,
          scaleX: 1,
          scaleY: 1,
        })
      : undefined,
    /* 애니메이션 지연 제거 — 마우스 속도와 1:1 */
    transition: 'none',
    willChange: transform ? 'transform' : undefined,
    ...(isDragging ? { position: 'relative' as const, zIndex: 9999 } : {}),
  }

  const contextValue = useMemo<RowContextProps>(
    () => ({
      setActivatorNodeRef,
      listeners: dragDisabled ? undefined : listeners,
      disabled: dragDisabled,
    }),
    [setActivatorNodeRef, listeners, dragDisabled]
  )

  return (
    <AdminSortableRowContext.Provider value={contextValue}>
      <tr
        {...props}
        ref={setNodeRef}
        style={style}
        {...(dragDisabled ? {} : attributes)}
        data-dragging={isDragging ? 'true' : undefined}
      />
    </AdminSortableRowContext.Provider>
  )
}

/** 순서 핸들 — feature별 DragHandle 래퍼에서 재export */
export function AdminSortableDragHandle({
  ariaLabel,
}: {
  ariaLabel?: string
} = {}) {
  const { setActivatorNodeRef, listeners, disabled } = useContext(
    AdminSortableRowContext
  )
  return (
    <SortOrderDragHandle
      setActivatorNodeRef={setActivatorNodeRef}
      listeners={listeners}
      disabled={disabled}
      aria-label={ariaLabel}
    />
  )
}

/**
 * 정렬 이벤트 — dragEnd 에만 arrayMove (dragOver re-render 없음 → 반응 속도 유지)
 */
export function useAdminTableDndReorder<T extends AdminSortableRowId>({
  rows,
  onRowsReorder,
  disabled = false,
}: {
  rows: T[]
  onRowsReorder: (reorderedRows: T[]) => void
  disabled?: boolean
}) {
  const rowsRef = useRef(rows)
  const lastOverIdRef = useRef<string | null>(null)

  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  const rowIds = useMemo(() => rows.map(row => row.id), [rows])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      /* 즉시 시작(거리 0) — 드래그 반응 지연 최소화. 클릭과 구분용 2px */
      activationConstraint: { distance: 2 },
    })
  )

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    lastOverIdRef.current = null
  }, [])

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    if (over) lastOverIdRef.current = String(over.id)
  }, [])

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      const activeId = String(active.id)
      const overId = over ? String(over.id) : lastOverIdRef.current
      lastOverIdRef.current = null

      if (disabled || !overId || activeId === overId) return

      const currentRows = rowsRef.current
      const activeIndex = currentRows.findIndex(row => row.id === activeId)
      const overIndex = currentRows.findIndex(row => row.id === overId)
      if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return

      onRowsReorder(arrayMove(currentRows, activeIndex, overIndex))
    },
    [disabled, onRowsReorder]
  )

  const handleDragCancel = useCallback(() => {
    lastOverIdRef.current = null
  }, [])

  const dndContextProps = useMemo(
    () => ({
      sensors,
      modifiers: [restrictToVerticalAxis] as Modifier[],
      collisionDetection: closestCenter,
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
      onDragCancel: handleDragCancel,
    }),
    [
      sensors,
      handleDragStart,
      handleDragOver,
      handleDragEnd,
      handleDragCancel,
    ]
  )

  return {
    items: rows,
    rowIds,
    dndContextProps,
  }
}

/** DndContext + SortableContext 래퍼 */
export function AdminSortableDndShell({
  rowIds,
  dndContextProps,
  children,
}: {
  rowIds: string[]
  dndContextProps: ReturnType<typeof useAdminTableDndReorder>['dndContextProps']
  children: ReactNode
}) {
  return (
    <DndContext {...dndContextProps}>
      <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}
