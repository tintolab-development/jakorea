import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from 'react'
import { PFText } from '../pf-text'
import signatureDrawIconUrl from '@/assets/autograph/icon-signature-draw.png'
import styles from './pf-electronic-signature-modal.module.css'

type DrawCanvasPanelProps = {
  onHasStrokeChange: (hasStroke: boolean) => void
  canvasRef: RefObject<HTMLCanvasElement | null>
  resetToken: number
}

export function DrawCanvasPanel({
  onHasStrokeChange,
  canvasRef,
  resetToken,
}: DrawCanvasPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [hasStroke, setHasStroke] = useState(false)

  const syncHasStroke = useCallback(
    (next: boolean) => {
      setHasStroke(next)
      onHasStrokeChange(next)
    },
    [onHasStrokeChange],
  )

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ratio = window.devicePixelRatio || 1
    const { width, height } = container.getBoundingClientRect()
    canvas.width = Math.max(1, Math.floor(width * ratio))
    canvas.height = Math.max(1, Math.floor(height * ratio))
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
  }, [canvasRef])

  useEffect(() => {
    resizeCanvas()
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const snapshot = canvas.toDataURL()
      const hadContent = hasStroke
      resizeCanvas()
      if (!hadContent) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight)
      }
      img.src = snapshot
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [canvasRef, hasStroke, resizeCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    syncHasStroke(false)
    drawingRef.current = false
    lastPointRef.current = null
  }, [canvasRef, resetToken, syncHasStroke])

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const point = getPoint(event)
    if (!canvas || !point) return
    canvas.setPointerCapture(event.pointerId)
    drawingRef.current = true
    lastPointRef.current = point
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const point = getPoint(event)
    const last = lastPointRef.current
    if (!canvas || !ctx || !point || !last) return

    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
    if (!hasStroke) syncHasStroke(true)
  }

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    drawingRef.current = false
    lastPointRef.current = null
  }

  return (
    <div className={styles.panelBody}>
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.guide}>
        아래 영역에 서명을 그려 주세요. 서명을 마친 뒤{' '}
        <PFText as="span" typo="bd-md-rg" color="primary-500" className={styles.guideHighlight}>
          [서명하기]
        </PFText>
        를 눌러 전자서명을 완료해 주세요.
      </PFText>

      <div className={styles.canvasShell} ref={containerRef}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          aria-label="서명 그리기 영역"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        {!hasStroke ? (
          <div className={styles.canvasEmpty} aria-hidden="true">
            <img className={styles.emptyIcon} src={signatureDrawIconUrl} alt="" aria-hidden="true" />
            <PFText
              as="span"
              typo="hl-lg"
              color="neutral-cool-500"
              className={styles.emptyHint}
            >
              이 영역에 서명을 그려주세요.
            </PFText>
          </div>
        ) : null}
      </div>
    </div>
  )
}
