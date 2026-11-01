/**
 * Platform 실제 화면 미리보기 — CMS 빌드에 포함된 `/platform-preview/` 번들을 iframe으로 띄운다.
 */

import { ModalCloseIcon } from '@/shared/ui/icons'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  PLATFORM_PROGRAM_PREVIEW_PATH,
  PLATFORM_PROGRAM_PREVIEW_READY_MESSAGE_TYPE,
  type PlatformProgramPreviewMessage,
} from '@jakorea/domain/portal/program-detail'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import '@/features/template/ui/modal/template-preview-modal.css'
import './platform-preview-modal.css'

const PREVIEW_VIEWPORT_WIDTH = 1600

const READY_TIMEOUT_MS = 8000

/** 프로그램 상세·등록 풀페이지 모달(1100) 위 */
const PLATFORM_PREVIEW_MODAL_Z_INDEX = 1500

type LoadState = 'loading' | 'ready' | 'failed'

export type PlatformPreviewModalProps = {
  open: boolean
  onClose: () => void
  title: string
  /** null이면 준비 중(포스터 로드 등) — iframe은 띄우되 전송을 미룬다 */
  message: PlatformProgramPreviewMessage | null
  zIndex?: number
}

/** 모달 본문은 portal로 늦게 마운트되므로 callback ref로 노드가 붙는 시점에 측정한다. */
function useElementSize<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    if (!node) {
      setSize({ width: 0, height: 0 })
      return
    }
    const update = () => setSize({ width: node.clientWidth, height: node.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])
  return [setNode, size] as const
}

export function PlatformPreviewModal({
  open,
  onClose,
  title,
  message,
  zIndex = PLATFORM_PREVIEW_MODAL_Z_INDEX,
}: PlatformPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [stageRef, stageSize] = useElementSize<HTMLDivElement>()

  const scale = stageSize.width > 0 ? Math.min(1, stageSize.width / PREVIEW_VIEWPORT_WIDTH) : 1
  const frameHeight = stageSize.height > 0 ? stageSize.height / scale : 0

  const postPreview = useCallback(() => {
    const target = iframeRef.current?.contentWindow
    if (!target || !message) return
    target.postMessage(message, window.location.origin)
  }, [message])

  useEffect(() => {
    if (open) setLoadState('loading')
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      const data = event.data as { type?: unknown } | null
      if (data?.type !== PLATFORM_PROGRAM_PREVIEW_READY_MESSAGE_TYPE) return
      setLoadState('ready')
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [open])

  useEffect(() => {
    if (!open || loadState !== 'loading') return
    const timer = window.setTimeout(() => setLoadState('failed'), READY_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [open, loadState])

  useEffect(() => {
    if (loadState === 'ready') postPreview()
  }, [loadState, postPreview])

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      className="template-preview-modal teal-header-modal--full platform-preview-modal"
      zIndex={zIndex}
    >
      <div className="template-preview-modal__shell">
        <header className="template-preview-modal__title-row">
          <div className="template-preview-modal__title-left">
            <span className="template-preview-modal__title-text">{title}</span>
            <span className="template-preview-modal__badge">미리보기</span>
          </div>
          <button
            type="button"
            className="template-preview-modal__title-close"
            onClick={onClose}
            aria-label="닫기"
          >
            <ModalCloseIcon tone="white" />
          </button>
        </header>

        <div className="template-preview-modal__body platform-preview-modal__body">
          <div className="template-preview-modal__notice-wrap">
            <div className="template-preview-modal__notice">
              <span className="template-preview-modal__notice-text">
                현재 화면은 미리보기 화면입니다.
              </span>
              <div className="template-preview-modal__notice-actions">
                <CmsButton
                  type="button"
                  variant="secondary"
                  size="large" className="template-preview-modal__notice-close-btn"
                  onClick={onClose} >
                  미리보기 닫기
                </CmsButton>
              </div>
            </div>
          </div>

          <div ref={stageRef} className="platform-preview-modal__stage">
            {loadState === 'failed' ? (
              <div className="platform-preview-modal__failed" role="alert">
                미리보기를 불러올 수 없습니다
              </div>
            ) : (
              <div
                className="platform-preview-modal__frame-box"
                style={{ width: PREVIEW_VIEWPORT_WIDTH * scale, height: stageSize.height }}
              >
                {open && frameHeight > 0 ? (
                  <iframe
                    ref={iframeRef}
                    title={title}
                    src={PLATFORM_PROGRAM_PREVIEW_PATH}
                    className="platform-preview-modal__frame"
                    style={{
                      width: PREVIEW_VIEWPORT_WIDTH,
                      height: frameHeight,
                      transform: `scale(${scale})`,
                    }}
                    onError={() => setLoadState('failed')}
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </TealHeaderModal>
  )
}
