import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type RefObject,
  type SyntheticEvent,
} from 'react'
import { Resizable, type ResizeCallbackData } from 'react-resizable'
import type { UjatEssayColumnKey } from './ujat-volunteer-doc-screening-columns'
import {
  clearEssayColumnWidthDom,
  getTableWrapElement,
  syncEssayColumnWidthDom,
  syncTableScrollWidthDom,
} from './ujat-volunteer-doc-screening-column-resize-dom'
import 'react-resizable/css/styles.css'

export type ResizableHeaderCellProps = HTMLAttributes<HTMLTableCellElement> & {
  width?: number
  essayColKey?: UjatEssayColumnKey
  tableWrapRef?: RefObject<HTMLElement | null>
  essayColumnWidths?: Record<UjatEssayColumnKey, number>
  onResizeStart?: () => void
  onResizeStop?: (e: SyntheticEvent, data: ResizeCallbackData) => void
}

export const UjatVolunteerDocScreeningResizableTitle = memo(function UjatVolunteerDocScreeningResizableTitle({
  onResizeStop,
  onResizeStart,
  width,
  essayColKey,
  tableWrapRef,
  essayColumnWidths,
  ...restProps
}: ResizableHeaderCellProps) {
  const [liveWidth, setLiveWidth] = useState(width ?? 0)
  const resizeRafRef = useRef<number>(0)
  const pendingWidthRef = useRef(width ?? 0)
  const essayWidthsRef = useRef(essayColumnWidths)
  essayWidthsRef.current = essayColumnWidths

  useEffect(() => {
    if (width != null) {
      setLiveWidth(width)
      pendingWidthRef.current = width
    }
  }, [width])

  const applyResizeDom = useCallback(
    (nextWidth: number) => {
      const tableRoot = tableWrapRef ? getTableWrapElement(tableWrapRef) : null
      if (!tableRoot || !essayColKey || !essayWidthsRef.current) return

      syncEssayColumnWidthDom(tableRoot, essayColKey, nextWidth)
      syncTableScrollWidthDom(tableRoot, {
        ...essayWidthsRef.current,
        [essayColKey]: nextWidth,
      })
    },
    [essayColKey, tableWrapRef]
  )

  const handleResize = useCallback(
    (_e: SyntheticEvent, { size }: ResizeCallbackData) => {
      pendingWidthRef.current = size.width
      if (resizeRafRef.current) return

      resizeRafRef.current = requestAnimationFrame(() => {
        resizeRafRef.current = 0
        const nextWidth = pendingWidthRef.current
        setLiveWidth(nextWidth)
        applyResizeDom(nextWidth)
      })
    },
    [applyResizeDom]
  )

  const handleResizeStart = useCallback(
    (_e: SyntheticEvent) => {
      onResizeStart?.()
    },
    [onResizeStart]
  )

  const handleResizeStop = useCallback(
    (e: SyntheticEvent, data: ResizeCallbackData) => {
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current)
        resizeRafRef.current = 0
      }

      const nextWidth = data.size.width
      pendingWidthRef.current = nextWidth
      setLiveWidth(nextWidth)

      const tableRoot = tableWrapRef ? getTableWrapElement(tableWrapRef) : null
      if (tableRoot && essayColKey) {
        clearEssayColumnWidthDom(tableRoot, essayColKey)
      }

      onResizeStop?.(e, data)
    },
    [essayColKey, onResizeStop, tableWrapRef]
  )

  useEffect(
    () => () => {
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current)
    },
    []
  )

  if (!width || !onResizeStop) {
    return <th {...restProps} />
  }

  return (
    <Resizable
      width={liveWidth}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        />
      }
      onResizeStart={handleResizeStart}
      onResize={handleResize}
      onResizeStop={handleResizeStop}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} data-essay-col-key={essayColKey} />
    </Resizable>
  )
})
