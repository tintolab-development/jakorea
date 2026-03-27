import { AppButton } from '@/shared/ui/app-button'

/** 프로그램 상세 신청자 기본 정보 — 승인·반려 시 알림 발송 */
export function SendNotiButton() {
  return (
    <AppButton variant="default" size="large" htmlType="button">
      알림 발송
    </AppButton>
  )
}
