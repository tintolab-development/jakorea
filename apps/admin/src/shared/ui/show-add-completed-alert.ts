/**
 * 사용자 액션 추가 API 성공 후 공통 「추가 완료」 안내.
 * `showRegisterCompletedAlert`와 대칭 — cmsAlertModal(AlertModal) 1종.
 */

import { cmsAlertModal } from './cms-alert-modal-api'

export function showAddCompletedAlert(options?: { onConfirm?: () => void }): void {
  cmsAlertModal.show({
    title: '추가 완료',
    content: '추가되었습니다.',
    confirmLabel: '확인',
    onConfirm: options?.onConfirm,
  })
}
