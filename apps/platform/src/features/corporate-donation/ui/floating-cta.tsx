import { PFFloatingAction, PFText } from '@/shared/ui'
import { CTA_SECTION_BUTTON_LABEL } from '../lib/constants'

/** QA-0232 — 스크롤해도 따라다니는 문의하기 버튼. 본문 CTA와 같은 문의 모달을 연다. */
export function FloatingCta({ onInquiryClick }: { onInquiryClick: () => void }) {
  return (
    <PFFloatingAction onClick={onInquiryClick}>
      <PFText as="span" typo="hl-lg" color="inherit">
        {CTA_SECTION_BUTTON_LABEL}
      </PFText>
    </PFFloatingAction>
  )
}
