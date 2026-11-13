import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import { cmsAlertModal, setCmsAlertModalListener } from './cms-alert-modal-api'
import type { CmsAlertModalShowOptions } from './cms-alert-modal-api'
import { AlertModal } from './alert-modal'

const DEFAULT_WIDTH = 600

export type { CmsAlertModalShowOptions } from './cms-alert-modal-api'

type AlertState = CmsAlertModalShowOptions & { open: boolean }

const initialState: AlertState = {
  open: false,
  title: '',
  content: '',
  width: DEFAULT_WIDTH,
  confirmLabel: '확인',
  onConfirm: undefined,
}

export type CmsAlertModalContextValue = {
  showAlert: (options: CmsAlertModalShowOptions) => void
  closeAlert: () => void
}

const CmsAlertModalContext = createContext<CmsAlertModalContextValue | null>(null)

/** Provider 밖·HMR Context 불일치 폴백 — 참조 안정화를 위해 모듈 상수 */
const cmsAlertFallback: CmsAlertModalContextValue = {
  showAlert: options => cmsAlertModal.show(options),
  closeAlert: () => cmsAlertModal.close(),
}

export function CmsAlertModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlertState>(initialState)
  const confirmedRef = useRef(false)

  const showAlert = useCallback((options: CmsAlertModalShowOptions) => {
    setState(prev => {
      // 사용자가 직접 닫아야 하는 안내(세션 종료 등)는 다른 Alert로 덮지 않는다
      if (prev.open && prev.exclusive) return prev
      return {
        open: true,
        title: options.title,
        content: options.content,
        width: options.width ?? DEFAULT_WIDTH,
        confirmLabel: options.confirmLabel ?? '확인',
        zIndex: options.zIndex ?? CMS_ALERT_MODAL_Z_INDEX,
        onConfirm: options.onConfirm,
        onDismiss: options.onDismiss,
        exclusive: options.exclusive,
      }
    })
  }, [])

  /** 밖에서 닫기(cmsAlertModal.close 등) — exclusive 안내는 사용자가 직접 닫을 때까지 유지 */
  const closeAlert = useCallback(() => {
    setState(prev => (prev.open && prev.exclusive ? prev : { ...prev, open: false }))
  }, [])

  const handleConfirm = useCallback(() => {
    confirmedRef.current = true
    state.onConfirm?.()
  }, [state])

  /** 모달 자체의 닫기(확인 직후 포함). 확인이 아니었으면 onDismiss를 부른다 */
  const handleModalClose = useCallback(() => {
    const confirmed = confirmedRef.current
    confirmedRef.current = false
    if (!confirmed) state.onDismiss?.()
    setState(prev => ({ ...prev, open: false }))
  }, [state])

  const value = useMemo(
    () => ({
      showAlert,
      closeAlert,
    }),
    [showAlert, closeAlert]
  )

  useLayoutEffect(() => {
    setCmsAlertModalListener({ showAlert, closeAlert })
    return () => setCmsAlertModalListener(null)
  }, [showAlert, closeAlert])

  return (
    <CmsAlertModalContext.Provider value={value}>
      {children}
      <AlertModal
        open={state.open}
        onClose={handleModalClose}
        title={state.title}
        content={state.content}
        width={state.width}
        confirmLabel={state.confirmLabel}
        zIndex={state.zIndex}
        onConfirm={handleConfirm}
      />
    </CmsAlertModalContext.Provider>
  )
}

export function useCmsAlert(): CmsAlertModalContextValue {
  const ctx = useContext(CmsAlertModalContext)
  // Provider 밖·HMR로 Context 인스턴스가 어긋난 경우에도 레이아웃이 깨지지 않도록
  // imperative API로 폴백 (미등록 시 cmsAlertModal.show가 DEV 경고 후 no-op)
  return ctx ?? cmsAlertFallback
}
