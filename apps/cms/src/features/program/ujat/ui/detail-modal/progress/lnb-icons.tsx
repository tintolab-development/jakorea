/**
 * UJAT 교육 진행 현황 LNB — 책(상·하반기), 클립보드(요약). `fill="currentColor"`로 활성/비활성 제어
 */

import { LnbPostIcon, LnbProgramIcon } from '@/shared/ui/icons'

/** 교육 진행 현황 — 시안 `Icon / LNB / w24` program 원본 */
export function UjatLnbEducationBookIcon() {
  return <LnbProgramIcon className="detail-fullpage-modal__lnb-icon" />
}

/** 교육 진행 요약 — 시안 `Icon / LNB / w24` post 원본 */
export function UjatLnbEducationSummaryClipboardIcon() {
  return <LnbPostIcon className="detail-fullpage-modal__lnb-icon" />
}
