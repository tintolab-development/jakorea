import { useEffect, useRef } from 'react'
import { AdminAlertModal, type AdminAlertModalProps } from '@jakorea/admin-ui/modal'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import { CMS_ALERT_MODAL_CLOSED_EVENT } from './cms-alert-modal-api'

export type AlertModalProps = AdminAlertModalProps

/** CMS 공통: 딤 영역 클릭으로 닫히지 않는다 (maskClosable 기본 false). */
export function AlertModal({
  zIndex = CMS_ALERT_MODAL_Z_INDEX,
  maskClosable = false,
  ...props
}: AlertModalProps) {
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
      maskClosable={maskClosable}
      footerButtonSize={props.footerButtonSize ?? 'medium'}
    />
  )
}
