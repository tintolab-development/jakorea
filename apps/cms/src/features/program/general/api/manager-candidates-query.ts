/**
 * 담당자 추가 모달 — 등록 후보 관리자 검색
 * GET /api/admin/admin-accounts?status=ACTIVE&keyword=… (첫 페이지, size 100)
 *
 * 담당자 탭 진입 시에는 호출하지 않는다. 표의 연락처·CMS 권한은 GET …/managers 응답
 * (`adminPhone`·`adminRoleCode`)을 그대로 쓴다.
 */

import { fetchAdminsPageRemote } from '@/features/user/api/members-api-client'

export type AssignableManagerCandidate = {
  id: string
  name: string
  email: string
  phone: string
  adminId?: number
  cmsRoleCode?: string
}

/** GET /api/admin/admin-accounts 서버 size 상한 */
export const MANAGER_CANDIDATES_PAGE_SIZE = 100

export function normalizeManagerCandidateKeyword(keyword: string | undefined | null): string {
  return (keyword ?? '').trim()
}

export async function fetchAssignableManagerCandidates(
  keyword: string
): Promise<AssignableManagerCandidate[]> {
  const normalized = normalizeManagerCandidateKeyword(keyword)
  const page = await fetchAdminsPageRemote({
    page: 0,
    size: MANAGER_CANDIDATES_PAGE_SIZE,
    status: 'ACTIVE',
    ...(normalized ? { keyword: normalized } : {}),
  })
  return (page.items ?? [])
    .filter(item => item.adminAccountId != null && item.name?.trim())
    .map(item => ({
      id: String(item.adminAccountId),
      name: item.name!.trim(),
      email: item.email?.trim() || '',
      phone: item.phone?.trim() || '',
      adminId: item.adminAccountId,
      cmsRoleCode: item.roleCode?.trim() || undefined,
    }))
}
