/**
 * 일반 프로그램 상세 LNB — 시안 `Icon / LNB / w24` 원본(24, currentColor) + 펼침 화살표.
 */

import { LnbOrganizationIcon, LnbSurveyIcon, LnbVolunteerIcon } from '@/shared/ui/icons'
import type { SVGProps } from 'react'

const arrowClass = 'detail-fullpage-modal__lnb-item-arrow'

/** 기관 신청 목록 — 시안 `Icon / LNB / w24` organization 원본 */
export function LnbFigmaInstitutionApplicationIcon() {
  return <LnbOrganizationIcon className="detail-fullpage-modal__lnb-icon" />
}

/** 봉사자 신청 목록 — 시안 `Icon / LNB / w24` volunteer 원본 */
export function LnbFigmaVolunteerApplicationIcon() {
  return <LnbVolunteerIcon className="detail-fullpage-modal__lnb-icon" />
}

/** 설문 관리 — 시안 `Icon / LNB / w24` survey 원본 */
export function LnbFigmaSurveyManagementIcon() {
  return <LnbSurveyIcon className="detail-fullpage-modal__lnb-icon" />
}

/** 1depth 펼침 화살표 — Icon / Field / w22 (펼침 시 CSS로 180° 회전) */
export function LnbFigmaArrowDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      className={arrowClass}
      aria-hidden
      {...props}
    >
      <path
        d="M11.3787 14.3247C11.1119 14.501 10.7489 14.4711 10.514 14.2361L5.014 8.73612C4.74551 8.46763 4.74551 8.03243 5.014 7.76395C5.28248 7.49546 5.71768 7.49546 5.98616 7.76395L11.0001 12.7779L16.014 7.76395C16.2825 7.49546 16.7177 7.49546 16.9862 7.76395C17.2546 8.03243 17.2546 8.46763 16.9862 8.73612L11.4862 14.2361L11.3787 14.3247Z"
        fill="currentColor"
      />
    </svg>
  )
}
