import { educationApplicationDetailPath } from '@/features/mypage/lib/constants'

/** 교육현황 — 기관 안내사항 작성·수정 (교사) */
export function educationInstitutionGuidanceWritePath(
  applicationId: string,
  applicationType?: string,
): string {
  return `${educationApplicationDetailPath(applicationId, applicationType)}/guidance/write`
}

/** UJAT 기관 — 교육 진행 정보 확인/수정 1/2 */
export function educationUjatProgressConfirmPath(
  applicationId: string,
  applicationType?: string,
): string {
  return `${educationApplicationDetailPath(applicationId, applicationType)}/progress/confirm`
}

/** 기관 신청 안내(4항목·성범죄) 수정 후 복귀 — 신청 내용 탭 */
export function educationInstitutionGuidanceApplicationTabPath(
  applicationId: string,
  applicationType?: string,
): string {
  return `${educationApplicationDetailPath(applicationId, applicationType)}?section=application`
}

