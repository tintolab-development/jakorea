import { useEffect, useRef } from 'react'
import { AdminAlertModal, type AdminAlertModalProps } from '@jakorea/admin-ui/modal'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import { CMS_ALERT_MODAL_CLOSED_EVENT } from './cms-alert-modal-api'

export type AlertModalProps = Omit<AdminAlertModalProps, 'content'> & {
  content: string
}

export function AlertModal({ zIndex = CMS_ALERT_MODAL_Z_INDEX, ...props }: AlertModalProps) {
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (wasOpenRef.current && !props.open) {
      window.dispatchEvent(new CustomEvent(CMS_ALERT_MODAL_CLOSED_EVENT))
    }
    wasOpenRef.current = props.open
  }, [props.open])

  return (
    <AdminAlertModal
      {...props}
      zIndex={zIndex}
      footerButtonSize={props.footerButtonSize ?? 'large'}
    />
  )
}
