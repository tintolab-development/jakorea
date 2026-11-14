import { fetchAdminProgramLectureReportContentRemote } from '@/features/program/general/api/programs-api-client'
import type { MemberLectureReportTableRow } from '@/features/user/api/map-member-lecture-reports'

export interface MemberLectureReportDownloadFile {
  fileObjectId: number
  originalFileName?: string
}

function isUsableFileObjectId(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * 「강의보고서 보기」로 내려받을 파일을 고른다.
 *
 * 회원 목록 응답의 `reportFileIds`는 file_object id라는 보장이 없다 — 보고서 본문 응답은
 * 같은 첨부를 `sourceId`(form_submission_file)와 `fileObjectId`로 나눠 주므로, 목록 id를
 * 그대로 `/api/admin/files/{id}/download`에 넣으면 다른 파일이 내려올 수 있다.
 * 그래서 보고서 본문(`…/lecture-reports/{reportId}/content`)이 준 `fileObjectId`를 먼저 쓰고,
 * 보고서 id가 없거나 본문을 못 읽을 때만 목록 id로 되돌아간다.
 */
export async function resolveMemberLectureReportFiles(
  record: MemberLectureReportTableRow
): Promise<MemberLectureReportDownloadFile[]> {
  if (isUsableFileObjectId(record.reportId)) {
    const detail = await fetchAdminProgramLectureReportContentRemote(record.reportId)
    const files = (detail.files ?? [])
      .filter(file => file.downloadable !== false && isUsableFileObjectId(file.fileObjectId))
      .map(file => ({
        fileObjectId: file.fileObjectId!,
        originalFileName: file.originalFileName?.trim() || undefined,
      }))
    if (files.length > 0) return files
  }

  return (record.reportFileIds ?? [])
    .filter(isUsableFileObjectId)
    .map(fileObjectId => ({ fileObjectId }))
}
