/**
 * 위젯 카드 타이틀용: 좌측 2단 햄버거 아이콘 + 자식(타이틀 텍스트 등)
 * index 대시보드에서 위젯 타이틀 좌측에 통일된 햄버거 표시
 */

interface WidgetTitleWithHandleProps {
  children?: React.ReactNode
}

export function WidgetTitleWithHandle({ children }: WidgetTitleWithHandleProps) {
  return (
    <div className="widget-card-header">
      <div className="widget-drag-handle" aria-hidden>
        <span className="widget-drag-handle-bar" />
        <span className="widget-drag-handle-bar" />
      </div>
      {children}
    </div>
  )
}
