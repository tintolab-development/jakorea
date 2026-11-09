import type { QueryClient } from '@tanstack/react-query'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import {
  projectProgramPrivacyValue,
  reportProgramPrivacyLeak,
} from '@/features/program/shared/lib/project-program-privacy'
import customInstance from '@/shared/api/orval-mutator'
import { queryClient } from '@/shared/lib/query-client'

/** 로컬 BE `ProgramMyAssignmentResponse`. Orval 생성 스키마와 동일 필드. */
export interface ProgramMyAssignment {
  programId?: number
  adminAccountId?: number
  assigned?: boolean
  assignmentRole?: string | null
  masterBypass?: boolean
  capabilities?: string[]
}

export const PROGRAM_ASSIGNMENT_QUERY_ROOT = ['program-my-assignment'] as const

export const PROGRAM_CAPABILITY = {
  view: 'PROGRAM_VIEW',
  edit: 'PROGRAM_EDIT',
  sensitivePii: 'SENSITIVE_PII_READ',
  adminManage: 'PROGRAM_ADMIN_MANAGE',
} as const

const ASSIGNMENT_ROLES = new Set(['PM', 'PARTNER', 'VIEWER'])

export function programMyAssignmentQueryKey(programId: string, adminAccountId: number | null) {
  return [...PROGRAM_ASSIGNMENT_QUERY_ROOT, programId, adminAccountId ?? 'none'] as const
}

export function clearProgramAssignmentQueryCache(): void {
  void queryClient.cancelQueries({ queryKey: PROGRAM_ASSIGNMENT_QUERY_ROOT })
  queryClient.removeQueries({ queryKey: PROGRAM_ASSIGNMENT_QUERY_ROOT })
}

const PROGRAM_UNMASK_DETAIL_KEY_PARTS = [
  'organization-detail',
  'instructor-detail',
  'individual-detail',
  'volunteer-detail',
  'participant-detail',
]

/** 역할 회수·프로그램 전환 시 신청/참여 원문 DTO 캐시를 제거한다. */
export function evictProgramUnmaskDetailCaches(programId?: string | number | null): void {
  const id = programId == null ? '' : String(programId).trim()
  queryClient.removeQueries({
    predicate: query => {
      const key = query.queryKey
      if (!Array.isArray(key)) return false
      const serialized = key.map(part => String(part))
      if (!PROGRAM_UNMASK_DETAIL_KEY_PARTS.some(part => serialized.includes(part))) return false
      if (!id) return true
      return serialized.includes(id)
    },
  })
}

export async function fetchProgramMyAssignment(programId: string): Promise<ProgramMyAssignment> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/my-assignment`,
      method: 'GET',
    })
  )
}

export function normalizeAssignmentRole(
  role: string | null | undefined
): 'PM' | 'PARTNER' | 'VIEWER' | null {
  const normalized = role?.trim().toUpperCase() ?? ''
  if (!normalized) return null
  return ASSIGNMENT_ROLES.has(normalized) ? (normalized as 'PM' | 'PARTNER' | 'VIEWER') : null
}

function capabilitySet(assignment: ProgramMyAssignment | null | undefined): Set<string> {
  return new Set(
    (assignment?.capabilities ?? []).map(item => item.trim().toUpperCase()).filter(Boolean)
  )
}

export function isUnknownAssignmentRole(
  assignment: ProgramMyAssignment | null | undefined
): boolean {
  const raw = assignment?.assignmentRole
  if (raw == null || String(raw).trim() === '') return false
  return normalizeAssignmentRole(raw) == null
}

/**
 * 일반 프로필 원문.
 * BE requireUnmaskedProfileAccess: PROGRAM_VIEW + 배정 역할 PM/PARTNER.
 * PROGRAM_EDIT는 원문 capability가 아니다. 전역 PROGRAM_VIEWER 천장(PM 배정이어도 PROGRAM_VIEW만)을
 * 역할 이름으로 승격하지 않기 위한 fail-closed 구분이다.
 */
export function canRevealProgramGeneralPii(
  assignment: ProgramMyAssignment | null | undefined
): boolean {
  if (!assignment || isUnknownAssignmentRole(assignment)) return false
  const caps = capabilitySet(assignment)
  if (caps.size === 0) return false
  if (caps.has(PROGRAM_CAPABILITY.sensitivePii)) return true
  if (assignment.assigned !== true) return false
  const role = normalizeAssignmentRole(assignment.assignmentRole)
  return (
    (role === 'PM' || role === 'PARTNER') &&
    caps.has(PROGRAM_CAPABILITY.view) &&
    caps.has(PROGRAM_CAPABILITY.edit)
  )
}

/** 주민번호·계좌. SENSITIVE_PII_READ가 있을 때만. */
export function canRevealProgramSensitivePii(
  assignment: ProgramMyAssignment | null | undefined
): boolean {
  if (!assignment || isUnknownAssignmentRole(assignment)) return false
  return capabilitySet(assignment).has(PROGRAM_CAPABILITY.sensitivePii)
}

/** 담당자 정보 조회 — 권한 설정 V1.2 프로그램 권한: Owner·Assistant·Viewer 모두(PROGRAM_VIEW). BE GET …/managers와 동일 기준. */
export function canListProgramManagers(
  assignment: ProgramMyAssignment | null | undefined
): boolean {
  if (!assignment || isUnknownAssignmentRole(assignment)) return false
  return capabilitySet(assignment).has(PROGRAM_CAPABILITY.view)
}

/** 프로그램 내 파일·목록 다운로드 — Program Owner·Assistant(FILE_DOWNLOAD). Program Viewer(프로그램 상세)는 제한. */
export function canDownloadProgramFiles(
  assignment: ProgramMyAssignment | null | undefined
): boolean {
  if (!assignment || isUnknownAssignmentRole(assignment)) return false
  return capabilitySet(assignment).has('FILE_DOWNLOAD')
}

/** 담당자 등록·역할 변경·삭제 — Program Owner(PROGRAM_ADMIN_MANAGE)만. */
export function canManageProgramManagers(
  assignment: ProgramMyAssignment | null | undefined
): boolean {
  if (!assignment || isUnknownAssignmentRole(assignment)) return false
  return capabilitySet(assignment).has(PROGRAM_CAPABILITY.adminManage)
}

export function sanitizeProgramPrivacyOverlay<T>(programId: string | number, dto: T): T {
  const projected = projectProgramPrivacyValue(dto, cachedProgramAllowsSensitivePii(programId))
  reportProgramPrivacyLeak(projected.leakedFields)
  return projected.value
}

export function cacheProjectedProgramPrivacy<T>(
  client: QueryClient,
  queryKey: readonly unknown[],
  programId: string | number,
  dto: T
): T {
  const projected = projectProgramPrivacyValue(dto, cachedProgramAllowsSensitivePii(programId))
  reportProgramPrivacyLeak(projected.leakedFields)
  client.setQueryData(queryKey, projected.value)
  return projected.value
}

export function cachedProgramAllowsSensitivePii(programId: string | number): boolean {
  const id = String(programId)
  const entries = queryClient.getQueriesData<ProgramMyAssignment>({
    queryKey: [...PROGRAM_ASSIGNMENT_QUERY_ROOT, id],
  })
  return entries.some(([, assignment]) => canRevealProgramSensitivePii(assignment))
}
