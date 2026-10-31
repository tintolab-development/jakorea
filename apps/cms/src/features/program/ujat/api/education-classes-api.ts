/**
 * UJAT 참여 기관 교육 학급 카탈로그·학년/학급 remapping
 * GET|POST .../education-classes
 * POST .../education-class-remappings (operationId: remapEducationClasses)
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { EducationClassAddRequest } from '@/shared/api/generated/dashboard/schemas/educationClassAddRequest'
import type { EducationClassListResponse } from '@/shared/api/generated/dashboard/schemas/educationClassListResponse'
import type { EducationClassResponse } from '@/shared/api/generated/dashboard/schemas/educationClassResponse'

function programPath(programId: string, suffix: string): string {
  return `/api/admin/programs/${encodeURIComponent(programId)}${suffix}`
}

export type UjatEducationClassRemappingItemRequest = {
  fromGrade: string
  fromClassName: string
  toGrade?: string | null
  toClassName?: string | null
  unassign?: boolean
}

export type UjatEducationClassRemappingRequest = {
  expectedRevision: number
  applyFromScheduleId?: number | null
  applyFromDate?: string | null
  mappings: UjatEducationClassRemappingItemRequest[]
}

export type UjatEducationClassRemappingResponse = {
  programId?: number | null
  organizationApplicationId?: number | null
  revision?: number | null
  applyFromScheduleId?: number | null
  applyFromDate?: string | null
  affectedScheduleIds?: number[] | null
  classes?: EducationClassResponse[] | null
}

export async function fetchUjatEducationClasses(
  programId: string,
  applicationId: string
): Promise<EducationClassListResponse> {
  return unwrapApiBody(
    await customInstance({
      url: programPath(
        programId,
        `/ujat/organization-applications/${encodeURIComponent(applicationId)}/education-classes`
      ),
      method: 'GET',
    })
  )
}

export async function postUjatEducationClasses(
  programId: string,
  applicationId: string,
  body: EducationClassAddRequest
): Promise<EducationClassListResponse> {
  return unwrapApiBody(
    await customInstance({
      url: programPath(
        programId,
        `/ujat/organization-applications/${encodeURIComponent(applicationId)}/education-classes`
      ),
      method: 'POST',
      data: body,
    })
  )
}

/** POST .../education-class-remappings — 교육 학년 및 학급 변경 저장 */
export async function postUjatEducationClassRemappings(
  programId: string,
  applicationId: string,
  body: UjatEducationClassRemappingRequest
): Promise<UjatEducationClassRemappingResponse> {
  return unwrapApiBody(
    await customInstance({
      url: programPath(
        programId,
        `/ujat/organization-applications/${encodeURIComponent(applicationId)}/education-class-remappings`
      ),
      method: 'POST',
      data: body,
    })
  )
}
