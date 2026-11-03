import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import { loadSensitiveAdminFileBlob } from '@/shared/lib/admin-file-upload'
import { downloadBlob } from '@/shared/utils/file-download'
import { fetchAllApiPages } from '@/shared/lib/fetch-all-api-pages'

export type ProgramAbsenceReasonItem = {
  submissionId?: number
  attendanceId?: number
  programId?: number
  participantId?: number
  memberId?: number
  scheduleId?: number
  scheduleName?: string
  scheduleStartAt?: string
  reason?: string
  reviewStatus?: string
  revisionNo?: number
  fileObjectIds?: number[]
  originalFileNames?: Array<string | null>
  latestRevision?: boolean
}

type AbsenceReasonPage = {
  items?: ProgramAbsenceReasonItem[]
  content?: ProgramAbsenceReasonItem[]
}

/** GET /api/admin/program-execution/programs/{programId}/absence-reasons — latest */
export async function fetchProgramAbsenceReasons(
  programId: number
): Promise<ProgramAbsenceReasonItem[]> {
  return fetchAllApiPages(async (page, size) => {
    const response = unwrapApiBody<AbsenceReasonPage | ProgramAbsenceReasonItem[]>(
      await customInstance({
        url: `/api/admin/program-execution/programs/${programId}/absence-reasons`,
        method: 'GET',
        params: { latestOnly: true, page, size },
      })
    )
    if (Array.isArray(response)) {
      return { items: response, totalPages: 1 }
    }
    const items = response.items ?? response.content ?? []
    const record = response as { totalPages?: number }
    return { items, totalPages: record.totalPages }
  })
}

/**
 * 민감 증빙은 claim 후 stream으로만 받는다.
 * GET /api/admin/files/{id}/download 는 SENSITIVE_FILE_RELAY_REQUIRED 이다.
 */
export async function downloadAbsenceEvidenceFile(
  fileObjectId: number,
  fileName: string
): Promise<void> {
  const blob = await loadSensitiveAdminFileBlob({
    fileObjectId,
    reason: '프로그램 출결 증빙 서류 확인',
  })
  await downloadBlob(blob, fileName.trim() || `증빙서류-${fileObjectId}`)
}
