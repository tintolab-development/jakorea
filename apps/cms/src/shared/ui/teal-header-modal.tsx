/**
 * CMS 공통: 팝업 밖 딤 영역을 클릭해도 닫히지 않는다 (maskClosable 기본 false).
 * 헤더 X·취소 버튼으로만 닫는다. 필요 시 개별 호출에서 `maskClosable` 로 재정의.
 */
import {
  AdminTealHeaderModal,
  type AdminTealHeaderModalProps as TealHeaderModalProps,
  type ModalSize,
} from '@jakorea/admin-ui/modal'

export type { TealHeaderModalProps, ModalSize }

export function TealHeaderModal({ maskClosable = false, ...props }: TealHeaderModalProps) {
  return <AdminTealHeaderModal {...props} maskClosable={maskClosable} />
}
