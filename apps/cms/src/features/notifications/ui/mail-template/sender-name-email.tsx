import { splitMailSenderNameEmail } from '@/features/notifications/model/mail-template/preview'
import './sender-name-email.css'

type SenderNameEmailProps = {
  name?: string | null
  email?: string | null
  /** 이름·이메일 모두 없을 때 표시 (BE 표시 문자열 등) */
  fallback?: string
}

/** 시안 상세 표 「발신 메일」·「발송자」: 이름 | 이메일 (이름 없으면 이메일만) */
export function SenderNameEmail({ name, email, fallback = '-' }: SenderNameEmailProps) {
  const parts = splitMailSenderNameEmail(name, email)
  if (!parts.name) return <>{parts.email || fallback}</>
  if (!parts.email) return <>{parts.name}</>
  return (
    <span className="mail-sender-name-email">
      <span className="mail-sender-name-email__name">{parts.name}</span>
      <span className="mail-sender-name-email__divider" aria-hidden />
      <span className="mail-sender-name-email__email">{parts.email}</span>
    </span>
  )
}
