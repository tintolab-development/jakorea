import { Spin } from 'antd'
import './router.css'

export function RouterLoadingFallback({ fullViewport = false }: { fullViewport?: boolean }) {
  return (
    <div
      className={[
        'router-loading-fallback',
        fullViewport ? 'router-loading-fallback--full-viewport' : null,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Spin size="large" />
    </div>
  )
}
