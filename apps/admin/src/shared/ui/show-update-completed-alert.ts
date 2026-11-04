/**
 * 사용자 액션 수정 API 성공 후 공통 「수정 완료」 안내.
 * `showRegisterCompletedAlert` / `showDeleteCompletedAlert`와 대칭 — cmsAlertModal(AlertModal) 1종.
 */

import { cmsAlertModal } from './cms-alert-modal-api'

export function showUpdateCompletedAlert(options?: { onConfirm?: () => void }): void {
  cmsAlertModal.show({
    title: '수정 완료',
    content: '수정되었습니다.',
    confirmLabel: '확인',
    onConfirm: options?.onConfirm,
  })
}
