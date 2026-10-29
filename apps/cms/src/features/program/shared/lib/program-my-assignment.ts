import type { QueryClient } from '@tanstack/react-query'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import {
  projectProgramPrivacyValue,
  reportProgramPrivacyLeak,
} from '@/features/program/shared/lib/project-program-privacy'
import customInstance from '@/shared/api/orval-mutator'
import { queryClient } from '@/shared/lib/query-client'

/** 로컬 BE `ProgramMyAssignmentResponse`. 생성 클라이언트에는 아직 없다. */
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

export function programMyAssignmentQueryKey(
  programId: string,
  adminAccountId: number | null
) {
  return [...PROGRAM_ASSIGNMENT_QUERY_ROOT, programId, adminAccountId ?? 'none'] as const
}

export function clearProgramAssignmentQueryCache(): void {
  void queryClient.cancelQueries({ queryKey: PROGRAM_ASSIGNMENT_QUERY_ROOT })
  queryClient.removeQueries({ queryKey: PROGRAM_ASSIGNMENT_QUERY_ROOT })
}

export async function fetchProgramMyAssignment(
  programId: string
): Promise<ProgramMyAssignment> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/my-assignment`,
      method: 'GET',
    })
  )
}

export function normalizeAssignmentRole(role: string | null | undefined): 'PM' | 'PARTNER' | 'VIEWER' | null {
  const normalized = role?.trim().toUpperCase() ?? ''
  if (!normalized) return null
  return ASSIGNMENT_ROLES.has(normalized) ? (normalized as 'PM' | 'PARTNER' | 'VIEWER') : null
}

function capabilitySet(assignment: ProgramMyAssignment | null | undefined): Set<string> {
  return new Set(
    (assignment?.capabilities ?? []).map(item => item.trim().toUpperCase()).filter(Boolean)
  )
}

export function isUnknownAssignmentRole(assignment: ProgramMyAssignment | null | undefined): boolean {
  const raw = assignment?.assignmentRole
  if (raw == null || String(raw).trim() === '') return false
  return normalizeAssignmentRole(raw) == null
}

/** 일반 개인정보. 역할 이름만으로 만들지 않고 capability를 본다. */
export function canRevealProgramGeneralPii(assignment: ProgramMyAssignment | null | undefined): boolean {
  if (!assignment || isUnknownAssignmentRole(assignment)) return false
  const caps = capabilitySet(assignment)
  if (caps.size === 0) return false
  if (caps.has(PROGRAM_CAPABILITY.sensitivePii)) return true
  const role = normalizeAssignmentRole(assignment.assignmentRole)
  const partnerOrPm = role === 'PM' || role === 'PARTNER'
  return partnerOrPm && caps.has(PROGRAM_CAPABILITY.edit)
}

/** 주민번호·계좌. SENSITIVE_PII_READ가 있을 때만. */
export function canRevealProgramSensitivePii(assignment: ProgramMyAssignment | null | undefined): boolean {
  if (!assignment || isUnknownAssignmentRole(assignment)) return false
  return capabilitySet(assignment).has(PROGRAM_CAPABILITY.sensitivePii)
}

export function canListProgramManagers(assignment: ProgramMyAssignment | null | undefined): boolean {
  if (!assignment || isUnknownAssignmentRole(assignment)) return false
  return capabilitySet(assignment).has(PROGRAM_CAPABILITY.adminManage)
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
