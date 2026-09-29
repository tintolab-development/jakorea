/**
 * 프로그램 신청 목록(기관·참여자·강사·봉사자) 승인 API 성공 후 공통 안내.
 * 단건·일괄 동일 copy.
 */

import { cmsAlertModal } from './cms-alert-modal-api'

export function showApplicationApprovalCompletedAlert(options?: { onConfirm?: () => void }): void {
  cmsAlertModal.show({
    title: '승인 완료',
    content: '승인되었습니다.',
    confirmLabel: '확인',
    onConfirm: options?.onConfirm,
  })
}
