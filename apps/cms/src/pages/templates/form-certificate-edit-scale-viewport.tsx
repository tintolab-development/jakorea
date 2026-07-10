import { useEffect, useRef, useState, type ReactNode } from 'react'
import './form-certificate-edit-scale-viewport.css'

/** `form-certificate-preview__bg` 디자인 고정 크기 */
const DESIGN_W = 1208
const DESIGN_H = 1682

/**
 * 수료증·인증서 편집 좌측 미리보기 —
 * 절대좌표 캔버스(1208×1682)를 컨테이너 폭에 맞게 `transform: scale`로만 축소한다.
 * `max-width`로 캔버스만 줄이면 배경은 줄고 오버레이 px는 그대로라 레이아웃이 깨진다.
 */
export function FormCertificateEditScaleViewport({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const update = () => {
      const w = el.clientWidth
      if (w <= 0) return
      setScale(Math.min(1, w / DESIGN_W))
    }

    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scaledW = DESIGN_W * scale
  const scaledH = DESIGN_H * scale

  return (
    <div ref={viewportRef} className="form-certificate-edit-scale-viewport">
      <div
        className="form-certificate-edit-scale-viewport__clip"
        style={{ width: scaledW, height: scaledH }}
      >
        <div
          className="form-certificate-edit-scale-viewport__inner"
          style={{
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
