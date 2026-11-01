import type { ProgramFile, ProgramPost } from '@/types/domain'

/**
 * 참여 기관 상세 게시글 목록.
 * `schoolId`(= organizationApplicationId 문자열)가 있으면 해당 기관 스코프 글만.
 * 프로그램 전체 공지(schoolId 없음)는 기관 탭에서 제외 — school-detail-posts-tab-spec.
 */
export function resolveEnrollmentProgramPostsList(options: {
  membersRemote: boolean
  postsOverride: ProgramPost[] | null | undefined
  programId: string
  schoolId?: string
}): ProgramPost[] {
  const { membersRemote, postsOverride, schoolId } = options
  const scopeId = schoolId?.trim()
  if (postsOverride != null) {
    if (!scopeId) return postsOverride
    return postsOverride.filter(post => post.schoolId === scopeId)
  }
  if (membersRemote) return []
  return []
}

export function resolveEnrollmentProgramFilesList(options: {
  membersRemote: boolean
  postsOverride: ProgramPost[] | null | undefined
  filesOverride?: ProgramFile[] | null
  programId: string
}): ProgramFile[] {
  const { membersRemote, postsOverride, filesOverride } = options
  if (filesOverride != null) return filesOverride
  if (membersRemote && postsOverride == null) return []
  return []
}
