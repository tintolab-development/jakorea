import { AppButton } from '@/shared/ui/app-button'

export interface SendNotiButtonProps {
  /** 승인 완료 후: 알림 재발송 */
  mode?: 'send' | 'resend'
}

/** 프로그램 상세 신청자 기본 정보 — 승인·반려 시 알림 발송 */
export function SendNotiButton({ mode = 'send' }: SendNotiButtonProps) {
  const label = mode === 'resend' ? '알림 재발송' : '알림 발송'
  return (
    <AppButton variant="default" size="large" htmlType="button">
      {label}
    </AppButton>
  )
}
