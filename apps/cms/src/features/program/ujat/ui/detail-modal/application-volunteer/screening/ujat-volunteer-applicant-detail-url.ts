import {
  getUjatVolunteerApplicants,
  getUjatVolunteerDocPassedApplicants,
} from '@/data/mock/ujat-volunteer-applicants-mock'
import type { UjatVolunteerApplicantDetailTab } from '@/features/program/ujat/lib/ujat-program-detail-url'

/** 현재 탭 목록에 속한 지원자만 상세 딥링크로 허용 */
export function isUjatVolunteerApplicantInTabList(
  programId: string,
  tab: UjatVolunteerApplicantDetailTab,
  applicantId: string
): boolean {
  const half = tab.startsWith('vh2') ? 'h2' : 'h1'
  if (tab.endsWith('_doc_passed')) {
    return getUjatVolunteerDocPassedApplicants(programId, half).some(row => row.id === applicantId)
  }
  return getUjatVolunteerApplicants(programId, half).some(row => row.id === applicantId)
}
