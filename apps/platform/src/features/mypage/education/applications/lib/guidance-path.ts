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

/**
 * UJAT 일정협의 배너 클릭 목적지.
 * ACTION_REQUIRED · REVISION_REQUIRED 모두 1/2(`progress/confirm`)로 보낸 뒤
 * 제출 시 2/2(`guidance/write`)로 이어진다.
 */
export function educationUjatScheduleBannerPath(
  applicationId: string,
  applicationType?: string,
): string {
  return educationUjatProgressConfirmPath(applicationId, applicationType)
}

/** 기관 신청 안내(4항목·성범죄) 수정 후 복귀 — 신청 내용 탭 */
export function educationInstitutionGuidanceApplicationTabPath(
  applicationId: string,
  applicationType?: string,
): string {
  return `${educationApplicationDetailPath(applicationId, applicationType)}?section=application`
}

