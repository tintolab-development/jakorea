/**
 * 사용자 액션 삭제 API 성공 후 공통 「삭제 완료」 안내.
 * 호출부에서 배치 성공 후 1회만 호출 (axios DELETE 자동 노출 아님).
 */

import { cmsAlertModal } from './cms-alert-modal-api'

export function showDeleteCompletedAlert(options?: { onConfirm?: () => void }): void {
  cmsAlertModal.show({
    title: '삭제 완료',
    content: '삭제가 완료되었습니다.',
    confirmLabel: '확인',
    onConfirm: options?.onConfirm,
  })
}
