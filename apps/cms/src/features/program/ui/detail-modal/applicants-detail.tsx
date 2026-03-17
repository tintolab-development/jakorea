import type { TabKey } from './detail-modal-sidebar'

export interface ApplicantDetailsProps {
  menu: TabKey | ''
}

export function ApplicantDetails({ menu: _menu }: ApplicantDetailsProps) {
  return <div>{/* 신청 기관 관련 콘텐츠 */}</div>
}
