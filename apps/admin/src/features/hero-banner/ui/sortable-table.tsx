/**
 * Ant Design Table drag-sorting-handler 패턴
 * @see https://ant.design/components/table#table-demo-drag-sorting-handler
 */
import React, {
  createContext,
  useContext,
  useEffect,
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
import type { HeroBanner } from '@/entities/hero-banner/model/types'

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

const SortableRow: React.FC<SortableRowProps> = props => {
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

export function HeroBannerDragHandle() {
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

export function HeroBannersSortableTable({
  rows,
  columns,
  loading,
  rowSelection,
  onRowsReorder,
}: {
  rows: HeroBanner[]
  columns: ColumnsType<HeroBanner>
  loading?: boolean
  rowSelection?: TableProps<HeroBanner>['rowSelection']
  onRowsReorder: (reorderedRows: HeroBanner[]) => void
}) {
  const rowIds = useMemo(() => rows.map(row => row.id), [rows])
  const rowsRef = useRef(rows)
  const lastOverIdRef = useRef<string | null>(null)

  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

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
        <Table<HeroBanner>
          className="cms-data-table hero-banner-table"
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          pagination={false}
          rowSelection={rowSelection}
          components={{ body: { row: SortableRow } }}
        />
      </SortableContext>
    </DndContext>
  )
}
