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
import { setCmsAlertModalListener } from './cms-alert-modal-api'
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

export function CmsAlertModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlertState>(initialState)

  const showAlert = useCallback((options: CmsAlertModalShowOptions) => {
    setState({
      open: true,
      title: options.title,
      content: options.content,
      width: options.width ?? DEFAULT_WIDTH,
      confirmLabel: options.confirmLabel ?? '확인',
      zIndex: options.zIndex ?? CMS_ALERT_MODAL_Z_INDEX,
      onConfirm: options.onConfirm,
    })
  }, [])

  const closeAlert = useCallback(() => {
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
  if (ctx == null) {
    throw new Error('useCmsAlert는 CmsAlertModalProvider 안에서만 사용할 수 있습니다.')
  }
  return ctx
}
