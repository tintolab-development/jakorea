import type { Program } from '@/types/domain'
import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload/types'
import { parseFileObjectId } from '@/shared/lib/admin-file-upload'
import { queryClient } from '@/shared/lib/query-client'
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
import {
  readRecruitDetailMediaFromOverlay,
  recruitDetailOverlayPrefixForProgram,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'

/**
 * 상세 정보 섹션의 첨부·대표 이미지 저장 위치.
 * 모집 탭 표시용 program(`activeRecruitmentId`)이면 그 모집 행, 아니면 프로그램.
 */
type ProgramMediaTarget = { programId: number; recruitmentId?: number }

const PROGRAM_MEDIA_ATTACHMENTS_STALE_MS = 30_000

export const programMediaQueryKeys = {
  all: ['cms', 'programs', 'media'] as const,
  attachments: (programId: number, recruitmentId?: number) =>
    [...programMediaQueryKeys.all, 'attachments', programId, recruitmentId ?? 'program'] as const,
}

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

/** UJAT 등록 위저드 초안 — 미디어는 overlay가 아니라 typed 모집 RHF가 SSOT */
export function isUjatTypedRecruitmentDraftProgram(program: Program): boolean {
  if (hasProgramMediaTarget(program)) return false
  const id = String(program.id ?? '')
  return program.backendProgramType === 'UJAT' || id.startsWith('ujat-')
}

/** GENERAL_*·UJAT 모집 탭. 첨부와 대표 이미지는 그 행만 쓴다. */
export function usesRecruitmentRowMedia(program: Program): boolean {
  return resolveTarget(program)?.recruitmentId != null
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

/** 등록 위저드(ujat-local 등)는 프로그램 번호가 없으므로 ownerId=null draft로 올린다. */
export function resolveProgramMediaThumbnailUploadOwner(program: Program): AdminFileUploadOwner {
  return programMediaThumbnailOwner(program) ?? programThumbnailOwner(null)
}

export function resolveProgramMediaAttachmentUploadOwner(program: Program): AdminFileUploadOwner {
  return programMediaAttachmentOwner(program) ?? programDetailAttachmentOwner(null)
}

export async function fetchProgramMediaAttachments(
  program: Program
): Promise<ProgramAttachmentItem[]> {
  const target = resolveTarget(program)
  if (!target) return []
  return queryClient.fetchQuery({
    queryKey: programMediaQueryKeys.attachments(target.programId, target.recruitmentId),
    queryFn: () =>
      target.recruitmentId != null
        ? fetchProgramRecruitmentAttachments(target.programId, target.recruitmentId)
        : fetchProgramAttachments(target.programId),
    staleTime: PROGRAM_MEDIA_ATTACHMENTS_STALE_MS,
  })
}

export async function putProgramMediaAttachments(
  program: Program,
  fileObjectIds: number[]
): Promise<ProgramAttachmentItem[]> {
  const target = resolveTarget(program)
  if (!target) return []
  const linked =
    target.recruitmentId != null
      ? await putProgramRecruitmentAttachments(target.programId, target.recruitmentId, fileObjectIds)
      : await putProgramAttachments(target.programId, fileObjectIds)
  queryClient.setQueryData(
    programMediaQueryKeys.attachments(target.programId, target.recruitmentId),
    linked
  )
  return linked
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
  const fileObjectId = row?.thumbnailFileObjectId ?? null
  // 파일명은 활성 행 유형의 overlay prefix에서만 읽는다(참여자 썸네일명이 강사·봉사자 탭에 새지 않게).
  const overlayName =
    fileObjectId != null
      ? readRecruitDetailMediaFromOverlay(program.registrationOverlay ?? {}, [
          recruitDetailOverlayPrefixForProgram(program),
        ]).thumbFileName
      : undefined
  return {
    ...empty,
    fileObjectId,
    originalFileName: overlayName?.trim() || null,
  }
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
