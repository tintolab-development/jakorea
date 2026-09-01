import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import { isAdminAccessDeniedAlert } from '@/shared/lib/admin-role-policy'
import { clearForbiddenApiErrorAlertDedupe } from '@/shared/lib/show-global-api-error-alert'
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

  const showAlert = useCallback((options: CmsAlertModalShowOptions) => {
    setState(prev => {
      if (prev.open && isAdminAccessDeniedAlert(prev)) {
        return prev
      }
      return {
        open: true,
        title: options.title,
        content: options.content,
        width: options.width ?? DEFAULT_WIDTH,
        confirmLabel: options.confirmLabel ?? '확인',
        zIndex: options.zIndex ?? CMS_ALERT_MODAL_Z_INDEX,
        onConfirm: options.onConfirm,
      }
    })
  }, [])

  const closeAlert = useCallback(() => {
    clearForbiddenApiErrorAlertDedupe()
    setState(prev => ({ ...prev, open: false }))
  }, [])

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
        onClose={closeAlert}
        title={state.title}
        content={state.content}
        width={state.width}
        confirmLabel={state.confirmLabel}
        zIndex={state.zIndex}
        onConfirm={state.onConfirm}
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
