import { Spin } from 'antd'
import { useSyncExternalStore } from 'react'
import {
  isFileUploadOverlayActive,
  subscribeFileUploadOverlay,
} from '@/shared/ui/file-upload-overlay-store'
import './file-upload-overlay.css'

export function FileUploadOverlay() {
  const active = useSyncExternalStore(
    subscribeFileUploadOverlay,
    isFileUploadOverlayActive,
    () => false
  )
  if (!active) return null
  return (
    <Spin spinning fullscreen size="large" rootClassName="file-upload-overlay" />
  )
}
