import type { UjatVolunteerApplicantDetailTab } from '@/features/program/ujat/lib/ujat-program-detail-url'

/** 상세 딥링크는 remote 목록이 소유. mock 카탈로그 검증하지 않는다. */
export function isUjatVolunteerApplicantInTabList(
  programId: string,
  _tab: UjatVolunteerApplicantDetailTab,
  applicantId: string
): boolean {
  void _tab
  return Boolean(programId && applicantId)
}
