/**
 * CMS 공통: 팝업 밖 딤 영역을 클릭해도 닫히지 않는다 (maskClosable 기본 false).
 */
import {
  AdminContentModal,
  CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS,
  type AdminContentModalProps as ContentModalProps,
} from '@jakorea/admin-ui/modal'

export { CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS }
export type { ContentModalProps }

export function ContentModal({ maskClosable = false, ...props }: ContentModalProps) {
  return <AdminContentModal {...props} maskClosable={maskClosable} />
}
