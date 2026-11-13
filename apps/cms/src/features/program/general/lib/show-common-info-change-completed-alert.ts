import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export const COMMON_INFO_CHANGE_COMPLETED_ALERT = {
  title: '변경 완료',
  content: '변경되었습니다.',
} as const

/** 일반 프로그램 상세 — 공통 정보 수정 저장 성공 안내(시안 「변경 완료 / 변경되었습니다.」) */
export function showCommonInfoChangeCompletedAlert(): void {
  cmsAlertModal.show({ ...COMMON_INFO_CHANGE_COMPLETED_ALERT, confirmLabel: '확인' })
}
