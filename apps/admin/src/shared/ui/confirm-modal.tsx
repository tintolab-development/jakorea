import { AdminConfirmModal, type AdminConfirmModalProps } from '@jakorea/admin-ui/modal'

export type ConfirmModalProps = AdminConfirmModalProps

export function ConfirmModal(props: ConfirmModalProps) {
  return <AdminConfirmModal {...props} footerButtonSize={props.footerButtonSize ?? 'large'} />
}
