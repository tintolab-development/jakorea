import type { Program } from '@/types/domain'
import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload/types'
import { parseFileObjectId } from '@/shared/lib/admin-file-upload'
import {
  fetchProgramAttachments,
  programDetailAttachmentOwner,
  programThumbnailOwner,
  putProgramAttachments,
  type ProgramAttachmentItem,
} from '@/features/program/shared/api/program-attachments'
import {
  fetchProgramThumbnail,
  putProgramThumbnail,
  type ProgramThumbnailResponse,
} from '@/features/program/shared/api/program-thumbnail'
import {
  fetchProgramRecruitmentAttachments,
  programRecruitmentAttachmentOwner,
  programRecruitmentThumbnailOwner,
  putProgramRecruitmentAttachments,
  putProgramRecruitmentThumbnail,
} from '@/features/program/shared/api/program-recruitment-rows'

/**
 * 상세 정보 섹션의 첨부·대표 이미지 저장 위치.
 * 모집 탭 표시용 program(`activeRecruitmentId`)이면 그 모집 행, 아니면 프로그램.
 */
type ProgramMediaTarget = { programId: number; recruitmentId?: number }

/** 모집 행 API는 GENERAL_*·UJAT만 받는다(그 외 400 STRUCTURED_RECRUITMENTS_GENERAL_ONLY). */
function supportsRecruitmentRowMedia(program: Program): boolean {
  const type = program.backendProgramType?.toUpperCase()
  return type == null || type === 'UJAT' || type.startsWith('GENERAL')
}

function resolveTarget(program: Program): ProgramMediaTarget | null {
  const programId = parseFileObjectId(program.id)
  if (programId == null) return null
  return program.activeRecruitmentId != null && supportsRecruitmentRowMedia(program)
    ? { programId, recruitmentId: program.activeRecruitmentId }
    : { programId }
}

export function hasProgramMediaTarget(program: Program): boolean {
  return resolveTarget(program) != null
}

export function programMediaAttachmentOwner(program: Program): AdminFileUploadOwner | null {
  const target = resolveTarget(program)
  if (!target) return null
  return target.recruitmentId != null
    ? programRecruitmentAttachmentOwner(target.recruitmentId)
    : programDetailAttachmentOwner(target.programId)
}

export function programMediaThumbnailOwner(program: Program): AdminFileUploadOwner | null {
  const target = resolveTarget(program)
  if (!target) return null
  return target.recruitmentId != null
    ? programRecruitmentThumbnailOwner(target.recruitmentId)
    : programThumbnailOwner(target.programId)
}

export async function fetchProgramMediaAttachments(
  program: Program
): Promise<ProgramAttachmentItem[]> {
  const target = resolveTarget(program)
  if (!target) return []
  return target.recruitmentId != null
    ? fetchProgramRecruitmentAttachments(target.programId, target.recruitmentId)
    : fetchProgramAttachments(target.programId)
}

export async function putProgramMediaAttachments(
  program: Program,
  fileObjectIds: number[]
): Promise<ProgramAttachmentItem[]> {
  const target = resolveTarget(program)
  if (!target) return []
  return target.recruitmentId != null
    ? putProgramRecruitmentAttachments(target.programId, target.recruitmentId, fileObjectIds)
    : putProgramAttachments(target.programId, fileObjectIds)
}

/** 모집 행 대표 이미지는 GET API가 없어 상세 응답 `recruitments[].thumbnailFileObjectId`를 쓴다. */
export async function fetchProgramMediaThumbnail(
  program: Program
): Promise<ProgramThumbnailResponse> {
  const target = resolveTarget(program)
  const empty: ProgramThumbnailResponse = {
    fileObjectId: null,
    originalFileName: null,
    contentType: null,
    fileSize: null,
    downloadPath: null,
  }
  if (!target) return empty
  if (target.recruitmentId == null) return fetchProgramThumbnail(target.programId)
  const row = program.programRecruitments?.find(item => item.id === target.recruitmentId)
  return { ...empty, fileObjectId: row?.thumbnailFileObjectId ?? null }
}

export async function putProgramMediaThumbnail(
  program: Program,
  fileObjectId: number | null
): Promise<void> {
  const target = resolveTarget(program)
  if (!target) return
  if (target.recruitmentId != null) {
    await putProgramRecruitmentThumbnail(target.programId, target.recruitmentId, fileObjectId)
    return
  }
  await putProgramThumbnail(target.programId, fileObjectId)
}
