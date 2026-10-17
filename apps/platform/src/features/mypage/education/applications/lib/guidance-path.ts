import { educationApplicationDetailPath } from '@/features/mypage/lib/constants'

/** 교육현황 — 기관 안내사항 작성·수정 (교사) */
export function educationInstitutionGuidanceWritePath(
  applicationId: string,
  applicationType?: string,
): string {
  return `${educationApplicationDetailPath(applicationId, applicationType)}/guidance/write`
}

/** 기관 신청 안내(4항목·성범죄) 수정 후 복귀 — 신청 내용 탭 */
export function educationInstitutionGuidanceApplicationTabPath(
  applicationId: string,
  applicationType?: string,
): string {
  return `${educationApplicationDetailPath(applicationId, applicationType)}?section=application`
}

