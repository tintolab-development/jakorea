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
  useState,
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
import { useIsMutating, useQueryClient } from '@tanstack/react-query'

export type AdminSortableRowId = { id: string }

type RowContextProps = {
  setActivatorNodeRef?: (element: HTMLElement | null) => void
  listeners?: SyntheticListenerMap
  disabled?: boolean
}

const AdminSortableRowContext = createContext<RowContextProps>({})

/**
 * DnD 잠금은 row 컴포넌트 identity를 바꾸지 말고 context로 전달한다.
 * Ant Table `components.body.row`가 바뀌면 tbody가 remount되어 썸네일·스위치가 통째로 점프한다.
 */
const AdminSortableDragLockContext = createContext(false)

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
  const lockFromShell = useContext(AdminSortableDragLockContext)
  const isDragDisabled = dragDisabled || lockFromShell
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
    disabled: isDragDisabled,
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
      listeners: isDragDisabled ? undefined : listeners,
      disabled: isDragDisabled,
    }),
    [setActivatorNodeRef, listeners, isDragDisabled]
  )

  return (
    <AdminSortableRowContext.Provider value={contextValue}>
      <tr
        {...props}
        ref={setNodeRef}
        style={style}
        {...(isDragDisabled ? {} : attributes)}
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
  /**
   * 드롭 직후 낙관적 순서 — 저장 응답 전까지 이전 순서로 되돌아갔다가 새 순서로 다시 점프하던 문제 방지.
   * `base`(드롭 시점 부모 rows)가 바뀌면(저장 성공 반영·재조회·로컬 초안 갱신) 부모 rows를 따른다.
   * 드롭 뒤 시작된 저장이 실패로 끝나면(진행 중 없음) 서버 순서로 되돌린다.
   */
  const [pendingOrder, setPendingOrder] = useState<{ base: T[]; rows: T[]; at: number } | null>(null)
  const queryClient = useQueryClient()
  // 저장 상태가 바뀔 때마다 다시 그려 낙관적 순서 유효성을 재평가
  useIsMutating()

  const displayedRowsRef = useRef(rows)

  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  const pendingValid = (() => {
    if (!pendingOrder || pendingOrder.base !== rows) return false
    const started = queryClient
      .getMutationCache()
      .getAll()
      .filter(mutation => mutation.state.submittedAt >= pendingOrder.at)
    const failed = started.some(mutation => mutation.state.status === 'error')
    const inFlight = started.some(mutation => mutation.state.status === 'pending')
    return !(failed && !inFlight)
  })()
  const items = pendingValid && pendingOrder ? pendingOrder.rows : rows

  const rowIds = useMemo(() => items.map(row => row.id), [items])

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

      const baseRows = rowsRef.current
      const currentRows = displayedRowsRef.current
      const activeIndex = currentRows.findIndex(row => row.id === activeId)
      const overIndex = currentRows.findIndex(row => row.id === overId)
      if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return

      const next = arrayMove(currentRows, activeIndex, overIndex)
      setPendingOrder({ base: baseRows, rows: next, at: Date.now() })
      onRowsReorder(next)
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

  useEffect(() => {
    displayedRowsRef.current = items
  }, [items])

  return {
    items,
    rowIds,
    dndContextProps,
  }
}

/** DndContext + SortableContext 래퍼 */
export function AdminSortableDndShell({
  rowIds,
  dndContextProps,
  dragDisabled = false,
  children,
}: {
  rowIds: string[]
  dndContextProps: ReturnType<typeof useAdminTableDndReorder>['dndContextProps']
  dragDisabled?: boolean
  children: ReactNode
}) {
  return (
    <AdminSortableDragLockContext.Provider value={Boolean(dragDisabled)}>
      <DndContext {...dndContextProps}>
        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </DndContext>
    </AdminSortableDragLockContext.Provider>
  )
}
