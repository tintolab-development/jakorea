/**
 * 대시보드 검색 (remote API 연동 전 빈 결과)
 */

import type { UUID } from '@/types'

export type SearchResultType =
  | 'program'
  | 'schedule'
  | 'user'
  | 'school'
  | 'instructor'
  | 'application'

export interface SearchResult {
  type: SearchResultType
  id: string
  title: string
  description?: string
  link: string
}

export async function searchInstructorContent(
  _instructorId: UUID,
  query: string
): Promise<SearchResult[]> {
  if (!query.trim()) return []
  return []
}

export async function searchAdminContent(_query: string): Promise<SearchResult[]> {
  return []
}
