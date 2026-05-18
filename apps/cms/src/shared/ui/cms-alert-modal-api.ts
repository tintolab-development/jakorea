export type CmsAlertModalShowOptions = {
  title: string
  content: string
  width?: number
  confirmLabel?: string
  zIndex?: number
}

type CmsAlertModalListener = {
  showAlert: (options: CmsAlertModalShowOptions) => void
  closeAlert: () => void
}

let listener: CmsAlertModalListener | null = null

/** @internal `CmsAlertModalProvider`에서만 사용합니다. */
export function setCmsAlertModalListener(next: CmsAlertModalListener | null): void {
  listener = next
}

export function isCmsAlertModalReady(): boolean {
  return listener != null
}

/**
 * 인터셉터·유틸 등 React 밖에서 공통 Alert 모달을 띄울 때 사용합니다.
 * `CmsAlertModalProvider`가 마운트되기 전에 `show`를 호출하면 개발 모드에서 경고 후 무시됩니다.
 */
export const cmsAlertModal = {
  show(options: CmsAlertModalShowOptions): void {
    if (listener == null) {
      if (import.meta.env.DEV) {
        console.warn(
          '[cmsAlertModal.show] CmsAlertModalProvider가 마운트되기 전이거나 등록되지 않았습니다. 호출이 무시됩니다.'
        )
      }
      return
    }
    listener.showAlert(options)
  },

  close(): void {
    listener?.closeAlert()
  },
}
