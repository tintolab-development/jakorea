/**
 * 회원 탈퇴 API 성공 후 공통 「회원 탈퇴 완료」 안내.
 * cmsAlertModal(AlertModal) 1종.
 */

import { cmsAlertModal } from './cms-alert-modal-api'

export function showWithdrawCompletedAlert(options?: { onConfirm?: () => void }): void {
  cmsAlertModal.show({
    title: '회원 탈퇴 완료',
    content: '회원 탈퇴가 완료되었습니다.',
    confirmLabel: '확인',
    onConfirm: options?.onConfirm,
  })
}
