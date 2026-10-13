import { educationApplicationDetailPath } from '@/features/mypage/lib/constants'

/** 교육현황 — CMS 프로그램 게시글(안내사항) 작성 */
export function educationProgramNoticeWritePath(applicationId: string): string {
  return `${educationApplicationDetailPath(applicationId)}/notices/write`
}

export function educationProgramNoticeTabPath(applicationId: string): string {
  return `${educationApplicationDetailPath(applicationId)}?section=notice`
}
