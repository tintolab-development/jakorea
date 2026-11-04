/**
 * 사용자 액션 변경 API 성공 후 공통 「변경 완료」 안내.
 * 신청 확인 처리·비밀번호 변경 등 — cmsAlertModal(AlertModal) 1종.
 */

import { cmsAlertModal } from './cms-alert-modal-api'

export function showChangeCompletedAlert(options?: { onConfirm?: () => void }): void {
  cmsAlertModal.show({
    title: '변경 완료',
    content: '변경되었습니다.',
    confirmLabel: '확인',
    onConfirm: options?.onConfirm,
  })
}
