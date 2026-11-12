import { useNavigate } from 'react-router-dom'
import { PFFloatingAction, PFText } from '@/shared/ui'
import { CTA_SECTION_BUTTON_LABEL, TALENT_DONATION_APPLY_PATH } from '../lib/constants'

/** QA-0232 — 스크롤해도 따라다니는 신청하기 버튼. 본문 CTA와 같은 신청 화면으로 간다. */
export function FloatingCta() {
  const navigate = useNavigate()

  return (
    <PFFloatingAction onClick={() => navigate(TALENT_DONATION_APPLY_PATH)}>
      <PFText as="span" typo="hl-lg" color="inherit">
        {CTA_SECTION_BUTTON_LABEL}
      </PFText>
    </PFFloatingAction>
  )
}
