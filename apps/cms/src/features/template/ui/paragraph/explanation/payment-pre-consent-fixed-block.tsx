import type { ReactNode } from 'react'
import './payment-pre-consent-sheet-bar.css'

type PaymentPreConsentFixedBlockTone = 'disabled' | 'white'

interface PaymentPreConsentFixedBlockProps {
  tone: PaymentPreConsentFixedBlockTone
  className?: string
  children: ReactNode
}

/** 지급조서 사전동의서의 고정 문구/날짜/서명 블록. 단락 입력 카드가 아니라 시트 내 고정 영역으로 보인다. */
export function PaymentPreConsentFixedBlock({
  tone,
  className,
  children,
}: PaymentPreConsentFixedBlockProps) {
  return (
    <div
      className={[
        'payment-pre-consent-fixed-block',
        `payment-pre-consent-fixed-block--${tone}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
