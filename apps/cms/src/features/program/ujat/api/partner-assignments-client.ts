/**
 * @deprecated Prefer `education-execution-api.ts` (`fetchUjatPartnerAssignments`).
 * Thin wrapper kept for legacy imports.
 */

import {
  fetchUjatPartnerAssignments,
  type UjatPartnerAssignmentResponse,
} from './education-execution-api'

export async function fetchUjatPartnerAssignmentsByPath(
  path: string
): Promise<UjatPartnerAssignmentResponse[]> {
  const match = path.match(
    /\/programs\/([^/]+)\/schedules\/([^/]+)\/ujat\/partner-assignments/
  )
  if (!match) {
    throw new Error(`Unsupported partner-assignments path: ${path}`)
  }
  return fetchUjatPartnerAssignments(match[1], match[2])
}

export function isUjatPartnerPair(assignment: UjatPartnerAssignmentResponse): boolean {
  return Boolean(assignment.primaryParticipantId && assignment.secondaryParticipantId)
}

export function isUjatSoloPrimary(assignment: UjatPartnerAssignmentResponse): boolean {
  return Boolean(assignment.primaryParticipantId) && !assignment.secondaryParticipantId
}
