/**
 * UJAT 참여 기관 교육 학급 카탈로그·학년/학급 remapping
 * GET|POST .../education-classes
 * POST .../education-class-remappings (operationId: remapEducationClasses)
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIDashboardSubset } from '@/shared/api/generated/dashboard/dashboard-api'
import type { EducationClassAddRequest } from '@/shared/api/generated/dashboard/schemas/educationClassAddRequest'
import type { EducationClassListResponse } from '@/shared/api/generated/dashboard/schemas/educationClassListResponse'
import type { EducationClassRemappingMapping } from '@/shared/api/generated/dashboard/schemas/educationClassRemappingMapping'
import type { EducationClassRemappingRequest } from '@/shared/api/generated/dashboard/schemas/educationClassRemappingRequest'
import type { EducationClassRemappingResponse } from '@/shared/api/generated/dashboard/schemas/educationClassRemappingResponse'

const dashboardApi = getJAKoreaCMSBackendAPIDashboardSubset()

function toNumericId(value: string, label: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${label}: ${value}`)
  }
  return parsed
}

export type UjatEducationClassRemappingItemRequest = EducationClassRemappingMapping
export type UjatEducationClassRemappingRequest = EducationClassRemappingRequest
export type UjatEducationClassRemappingResponse = EducationClassRemappingResponse

export async function fetchUjatEducationClasses(
  programId: string,
  applicationId: string
): Promise<EducationClassListResponse> {
  return unwrapApiBody(
    await dashboardApi.listEducationClasses(
      toNumericId(programId, 'programId'),
      toNumericId(applicationId, 'applicationId')
    )
  )
}

export async function postUjatEducationClasses(
  programId: string,
  applicationId: string,
  body: EducationClassAddRequest
): Promise<EducationClassListResponse> {
  return unwrapApiBody(
    await dashboardApi.addEducationClasses(
      toNumericId(programId, 'programId'),
      toNumericId(applicationId, 'applicationId'),
      body
    )
  )
}

/** POST .../education-class-remappings — 교육 학년 및 학급 변경 저장 */
export async function postUjatEducationClassRemappings(
  programId: string,
  applicationId: string,
  body: UjatEducationClassRemappingRequest
): Promise<UjatEducationClassRemappingResponse> {
  return unwrapApiBody(
    await dashboardApi.remapEducationClasses(
      toNumericId(programId, 'programId'),
      toNumericId(applicationId, 'applicationId'),
      body
    )
  )
}
