import type { TabKey } from '@/features/program/general/ui/detail-modal/program-detail-nav-types'
import type { DownloadAccessLogMeta } from '@/shared/lib/download-access-log-meta'

/** ApplicantList / useApplicantsDetail 메뉴 키 (일반 상세 개인 신청 목록 포함) */
export type ApplicantListMenu = TabKey | 'individual-applications'

export type InstitutionColumnPreset = 'legacy' | 'general-detail' | 'company-school'

export type InstructorColumnPreset = 'legacy' | 'general-detail'

export type SessionLinePreset = 'legacy' | 'general-detail'

/** 신청자 목록 엑셀 client 이력 — 메뉴마다 담기는 데이터가 다르다. 그 밖의 메뉴는 종류를 보내지 않는다. */
export function resolveApplicantListAccessLog(
  menu: ApplicantListMenu | ''
): DownloadAccessLogMeta | undefined {
  switch (menu) {
    case 'institutions':
      return { downloadKind: 'PROGRAM_INSTITUTION_APPLICATION_EXPORT', containedPiiTypes: ['NAME'] }
    case 'instructors':
      return { downloadKind: 'PROGRAM_INSTRUCTOR_APPLICATION_EXPORT', containedPiiTypes: ['NAME'] }
    case 'individual-applications':
      return { downloadKind: 'PROGRAM_INDIVIDUAL_APPLICATION_EXPORT', containedPiiTypes: ['NAME'] }
    default:
      return undefined
  }
}
