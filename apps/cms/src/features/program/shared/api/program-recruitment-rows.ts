import customInstance from '@/shared/api/orval-mutator'
import type { AdminFilePurpose } from '@/shared/lib/admin-file-upload/purposes'
import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload/types'
import { ADMIN_FILE_PURPOSE } from '@/shared/lib/admin-file-upload'
import type { ProgramRecruitmentRequest } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequest'
import type { ProgramRecruitmentAttachmentResponse } from '@/shared/api/generated/dashboard/schemas/programRecruitmentAttachmentResponse'
import type { ProgramRecruitmentResponse } from '@/shared/api/generated/dashboard/schemas/programRecruitmentResponse'
import type { ProgramThumbnailResponse } from '@/features/program/shared/api/program-thumbnail'

function unwrapApiBody<T>(payload: unknown): T {
  if (payload != null && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (body.success === true && 'data' in body) {
      return unwrapApiBody<T>(body.data)
    }
  }
  return payload as T
}

function rowPath(programId: number, recruitmentId: number): string {
  return `/api/admin/programs/${programId}/recruitments/${recruitmentId}`
}

/** 모집 행 첨부·대표 이미지 업로드 owner (BE: PROGRAM_CONTENT / PROGRAM_RECRUITMENT / {recruitmentId}) */
export function programRecruitmentFileOwner(
  recruitmentId: number,
  filePurpose: AdminFilePurpose
): AdminFileUploadOwner {
  return {
    ownerDomain: 'PROGRAM_CONTENT',
    ownerType: 'PROGRAM_RECRUITMENT',
    ownerId: recruitmentId,
    filePurpose,
  }
}

export function programRecruitmentAttachmentOwner(recruitmentId: number): AdminFileUploadOwner {
  return programRecruitmentFileOwner(recruitmentId, ADMIN_FILE_PURPOSE.PROGRAM_DETAIL_ATTACHMENT)
}

export function programRecruitmentThumbnailOwner(recruitmentId: number): AdminFileUploadOwner {
  return programRecruitmentFileOwner(recruitmentId, ADMIN_FILE_PURPOSE.PROGRAM_THUMBNAIL)
}

/** PATCH …/recruitments/{recruitmentId} — 보낸 필드만 바꾼다. `""`는 비움, null·생략은 유지 */
export async function patchProgramRecruitment(
  programId: number,
  recruitmentId: number,
  body: ProgramRecruitmentRequest
): Promise<ProgramRecruitmentResponse> {
  return unwrapApiBody(
    await customInstance({ url: rowPath(programId, recruitmentId), method: 'PATCH', data: body })
  )
}

/** DELETE …/recruitments/{recruitmentId}. 신청자 409 RECRUITMENT_HAS_APPLICATIONS, 구조 잠금 409 PROGRAM_STRUCTURE_EDIT_PERIOD_ENDED. 실패 시 행을 지우지 않는다. */
export async function deleteProgramRecruitment(
  programId: number,
  recruitmentId: number
): Promise<void> {
  await customInstance({ url: rowPath(programId, recruitmentId), method: 'DELETE' })
}

export async function fetchProgramRecruitmentAttachments(
  programId: number,
  recruitmentId: number
): Promise<ProgramRecruitmentAttachmentResponse[]> {
  const data = unwrapApiBody<ProgramRecruitmentAttachmentResponse[] | null>(
    await customInstance({ url: `${rowPath(programId, recruitmentId)}/attachments`, method: 'GET' })
  )
  return Array.isArray(data) ? data : []
}

/** PUT …/attachments — 배열 순서가 표시 순서, `[]`면 모두 제거. 다른 모집 첨부는 그대로 */
export async function putProgramRecruitmentAttachments(
  programId: number,
  recruitmentId: number,
  fileObjectIds: number[]
): Promise<ProgramRecruitmentAttachmentResponse[]> {
  const data = unwrapApiBody<ProgramRecruitmentAttachmentResponse[] | null>(
    await customInstance({
      url: `${rowPath(programId, recruitmentId)}/attachments`,
      method: 'PUT',
      data: { fileObjectIds },
    })
  )
  return Array.isArray(data) ? data : []
}

/** PUT …/thumbnail — null 이면 그 모집 대표 이미지를 지운다 */
export async function putProgramRecruitmentThumbnail(
  programId: number,
  recruitmentId: number,
  fileObjectId: number | null
): Promise<ProgramThumbnailResponse> {
  return unwrapApiBody(
    await customInstance({
      url: `${rowPath(programId, recruitmentId)}/thumbnail`,
      method: 'PUT',
      data: { fileObjectId },
    })
  )
}
