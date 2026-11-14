/** 프로그램 상세 풀페이지 LNB 아이콘 — 시안 `Icon / LNB / w24` 원본(24, currentColor) */

import { LnbInfoIcon, LnbManagerIcon, LnbOrganizationIcon, LnbProgramIcon } from '@/shared/ui/icons'

/** 프로그램·프로젝트 정보 — 시안 `Icon / LNB / w24` info 원본 */
export function LnbIconProjectInfo() {
  return <LnbInfoIcon className="detail-fullpage-modal__lnb-icon" />
}

/** 기관·참여자 신청 목록 — 시안 `Icon / LNB / w24` organization 원본 */
export function LnbIconApplicants() {
  return <LnbOrganizationIcon className="detail-fullpage-modal__lnb-icon" />
}

/** 프로그램 진행 현황 — 시안 `Icon / LNB / w24` program 원본 */
export function LnbIconProgress() {
  return <LnbProgramIcon className="detail-fullpage-modal__lnb-icon" />
}

/** 담당자 정보 — 시안 `Icon / LNB / w24` manager 원본 */
export function LnbIconManagers() {
  return <LnbManagerIcon className="detail-fullpage-modal__lnb-icon" />
}
