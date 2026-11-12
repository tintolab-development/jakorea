import { ANALYTICS_CLICK_METRICS, recordMetric } from '@/features/analytics'
import { PFFloatingAction, PFText } from '@/shared/ui'
import { usePublicPersonalDonationCta } from '../api/hooks'

/** QA-0232 — 스크롤해도 따라다니는 후원하기 버튼. 본문 CTA와 같은 링크·문구를 쓴다. */
export function FloatingCta() {
  const donation = usePublicPersonalDonationCta()
  const href = donation.href

  return (
    <PFFloatingAction
      disabled={!href}
      onClick={() => {
        if (!href) return
        recordMetric(ANALYTICS_CLICK_METRICS.donationOutbound)
        window.open(href, '_blank', 'noopener,noreferrer')
      }}
    >
      <PFText as="span" typo="hl-lg" color="inherit">
        {donation.label}
      </PFText>
    </PFFloatingAction>
  )
}
