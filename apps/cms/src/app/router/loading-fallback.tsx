import { Spin } from 'antd'
import './router.css'

export function RouterLoadingFallback() {
  return (
    <div className="router-loading-fallback">
      <Spin size="large" />
    </div>
  )
}
