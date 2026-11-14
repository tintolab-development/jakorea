/**
 * CMS 공통: 팝업 밖 딤 영역을 클릭해도 닫히지 않는다 (maskClosable 기본 false).
 */
import {
  AdminConfirmModal,
  type AdminConfirmModalProps as ConfirmModalProps,
} from '@jakorea/admin-ui/modal'

export type { ConfirmModalProps }

export function ConfirmModal({ maskClosable = false, ...props }: ConfirmModalProps) {
  return <AdminConfirmModal {...props} maskClosable={maskClosable} />
}
