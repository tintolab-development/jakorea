import { CmsButton } from '@/shared/ui'
import type { CmsButtonProps } from '@/shared/ui'
import './send-noti-button.css'

function defaultSendNotiClick() {
  window.alert('준비 중입니다.')
}

export interface SendNotiButtonProps {
  /** 승인 완료 후: 알림 재발송 */
  mode?: 'send' | 'resend'
  onClick?: CmsButtonProps['onClick']
}

/** 프로그램 상세 신청자 기본 정보 — 승인·반려 시 알림 발송 */
export function SendNotiButton({ mode = 'send', onClick }: SendNotiButtonProps) {
  const label = mode === 'resend' ? '알림 재발송' : '알림 발송'
  return (
    <CmsButton
      variant="default"
      size="large"
      type="button"
      className="send-noti-button"
      onClick={onClick ?? defaultSendNotiClick}
    >
      {label}
    </CmsButton>
  )
}
