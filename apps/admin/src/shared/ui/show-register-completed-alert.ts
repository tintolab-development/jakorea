/**
 * 사용자 액션 등록 API 성공 후 공통 「등록 완료」 안내.
 * `showDeleteCompletedAlert`와 대칭 — cmsAlertModal(AlertModal) 1종.
 */

import { cmsAlertModal } from './cms-alert-modal-api'

export function showRegisterCompletedAlert(options?: { onConfirm?: () => void }): void {
  cmsAlertModal.show({
    title: '등록 완료',
    content: '등록되었습니다.',
    confirmLabel: '확인',
    onConfirm: options?.onConfirm,
  })
}
