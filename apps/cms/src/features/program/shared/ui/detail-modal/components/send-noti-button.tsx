import { CmsButton } from '@/shared/ui'
import type { CmsButtonProps } from '@/shared/ui'

export interface SendNotiButtonProps {
  /** 기본값은 알림 재발송. 최초 발송이 필요할 때만 `send`. */
  mode?: 'send' | 'resend'
  onClick?: CmsButtonProps['onClick']
}

/** 프로그램 상세 신청자 기본 정보 — 승인·반려 결과 알림. onClick 없으면 렌더하지 않음. */
export function SendNotiButton({ mode = 'resend', onClick }: SendNotiButtonProps) {
  if (!onClick) return null
  const label = mode === 'resend' ? '알림 재발송' : '알림 발송'
  return (
    <CmsButton variant="secondary" size="small" type="button" onClick={onClick}>
      {label}
    </CmsButton>
  )
}
