import { Spin } from 'antd'
import { useSyncExternalStore } from 'react'
import {
  isBlockingOverlayActive,
  subscribeBlockingOverlay,
} from '@/shared/ui/blocking-overlay-store'
import './blocking-overlay.css'

export function BlockingOverlay() {
  const active = useSyncExternalStore(
    subscribeBlockingOverlay,
    isBlockingOverlayActive,
    () => false
  )
  if (!active) return null
  return (
    <Spin spinning fullscreen size="large" rootClassName="blocking-overlay" />
  )
}
