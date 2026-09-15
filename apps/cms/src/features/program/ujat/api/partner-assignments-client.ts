/**
 * UJAT Partner assignment — OpenAPI DTO 경로 호출 (codegen 재생성 없이 기존 스키마 사용)
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { UjatDgbongPartnerAssignmentResponse } from '@/shared/api/generated/dashboard/schemas/ujatDgbongPartnerAssignmentResponse'

export async function fetchUjatPartnerAssignmentsByPath(
  path: string
): Promise<UjatDgbongPartnerAssignmentResponse[]> {
  const body = await unwrapApiBody<
    UjatDgbongPartnerAssignmentResponse[] | { items?: UjatDgbongPartnerAssignmentResponse[] }
  >(
    await customInstance({
      url: path.startsWith('/') ? path : `/${path}`,
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

/** PRIMARY + SECONDARY 동일 group / 1인 PRIMARY */
export function isUjatPartnerPair(
  assignment: UjatDgbongPartnerAssignmentResponse
): boolean {
  return Boolean(assignment.primaryParticipantId && assignment.secondaryParticipantId)
}

export function isUjatSoloPrimary(
  assignment: UjatDgbongPartnerAssignmentResponse
): boolean {
  return Boolean(assignment.primaryParticipantId) && !assignment.secondaryParticipantId
}
