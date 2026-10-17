import { isAxiosError } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { portalMePaths } from '@/features/auth/sign-in'
import {
  parseInstructorRoleRequestDetail,
  parseInstructorRoleRequestSummary,
  parseInstructorRoleWorkflowResponse,
} from './parse'
import type {
  InstructorRoleRequestCreateRequest,
  InstructorRoleRequestDetail,
  InstructorRoleRequestSummary,
  InstructorRoleWorkflowResponse,
} from './types'

/** POST /api/portal/me/instructor-role-requests */
export async function postInstructorRoleRequest(
  body: InstructorRoleRequestCreateRequest,
): Promise<InstructorRoleWorkflowResponse> {
  const { data } = await axiosClient.post<unknown>(portalMePaths.instructorRoleRequests(), body)
  return parseInstructorRoleWorkflowResponse(data)
}

/** GET /api/portal/me/instructor-role-requests/current — 신청 없음(404)은 신규 신청 가능으로 취급 */
export async function getCurrentInstructorRoleRequest(
  signal?: AbortSignal,
): Promise<InstructorRoleRequestSummary> {
  try {
    const { data } = await axiosClient.get<unknown>(portalMePaths.instructorRoleRequestCurrent(), {
      signal,
    })
    return parseInstructorRoleRequestSummary(data)
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return { canRequest: true }
    }
    throw error
  }
}

/** GET /api/portal/me/instructor-role-requests/current/detail */
export async function getCurrentInstructorRoleRequestDetail(
  signal?: AbortSignal,
): Promise<InstructorRoleRequestDetail | null> {
  try {
    const { data } = await axiosClient.get<unknown>(
      portalMePaths.instructorRoleRequestCurrentDetail(),
      { signal },
    )
    return parseInstructorRoleRequestDetail(data)
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}
