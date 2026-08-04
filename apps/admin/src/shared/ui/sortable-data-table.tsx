/**
 * Ant Design Table + dnd-kit 드래그 정렬 (CMS education-regions 패턴)
 */
import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react'
import { MenuOutlined } from '@ant-design/icons'
import {
  DndContext,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
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
import { Table } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'

type RowWithId = { id: string }

type RowContextProps = {
  setActivatorNodeRef?: (element: HTMLElement | null) => void
  listeners?: SyntheticListenerMap
}

const RowContext = createContext<RowContextProps>({})

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
})

type SortableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  'data-row-key'?: string | number
}

function SortableRow(props: SortableRowProps) {
  const rowId = String(props['data-row-key'] ?? '')
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rowId })

  const style: CSSProperties = {
    ...props.style,
    transform: transform
      ? CSS.Translate.toString({
          x: 0,
          y: transform.y,
          scaleX: 1,
          scaleY: 1,
        })
      : undefined,
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  }

  const contextValue = useMemo<RowContextProps>(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners]
  )

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  )
}

export function SortableDragHandle() {
  const { setActivatorNodeRef, listeners } = useContext(RowContext)
  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      aria-label="순서 변경"
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'move',
        padding: 0,
        color: 'var(--main-BK, #3d3d3d)',
        lineHeight: 1,
      }}
      onClick={event => event.stopPropagation()}
      {...listeners}
    >
      <MenuOutlined />
    </button>
  )
}

export function SortableDataTable<T extends RowWithId>({
  rows,
  columns,
  rowSelection,
  scrollX = 1100,
  onRowsReorder,
}: {
  rows: T[]
  columns: ColumnsType<T>
  rowSelection?: TableProps<T>['rowSelection']
  scrollX?: number
  onRowsReorder: (reorderedRows: T[]) => void
}) {
  const rowIds = useMemo(() => rows.map(row => row.id), [rows])
  const rowsRef = useRef(rows)
  rowsRef.current = rows
  const lastOverIdRef = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } })
  )

  const handleDragStart = () => {
    lastOverIdRef.current = null
  }

  const handleDragOver = ({ over }: DragOverEvent) => {
    if (over) lastOverIdRef.current = String(over.id)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const activeId = String(active.id)
    const overId = over ? String(over.id) : lastOverIdRef.current
    lastOverIdRef.current = null

    if (!overId || activeId === overId) return

    const currentRows = rowsRef.current
    const activeIndex = currentRows.findIndex(row => row.id === activeId)
    const overIndex = currentRows.findIndex(row => row.id === overId)
    if (activeIndex < 0 || overIndex < 0) return

    onRowsReorder(arrayMove(currentRows, activeIndex, overIndex))
  }

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToVerticalAxis]}
      collisionDetection={closestCenter}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
        <Table<T>
          className="admin-data-table"
          rowKey="id"
          dataSource={rows}
          columns={columns}
          pagination={false}
          rowSelection={rowSelection}
          scroll={{ x: scrollX }}
          components={{ body: { row: SortableRow } }}
        />
      </SortableContext>
    </DndContext>
  )
}
