/**
 * 사용자 액션 저장 API 성공 후 공통 「저장 완료」 안내.
 * `showRegisterCompletedAlert` / `showUpdateCompletedAlert`와 대칭 — cmsAlertModal(AlertModal) 1종.
 */

import { cmsAlertModal } from './cms-alert-modal-api'

export function showSaveCompletedAlert(options?: { onConfirm?: () => void }): void {
  cmsAlertModal.show({
    title: '저장 완료',
    content: '저장되었습니다.',
    confirmLabel: '확인',
    onConfirm: options?.onConfirm,
  })
}
