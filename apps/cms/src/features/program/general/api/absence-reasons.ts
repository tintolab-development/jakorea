import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import { loadSensitiveAdminFileBlob } from '@/shared/lib/admin-file-upload'
import { downloadBlob } from '@/shared/utils/file-download'

export type ProgramAbsenceReasonItem = {
  submissionId?: number
  participantId?: number
  memberId?: number
  scheduleId?: number
  scheduleName?: string
  scheduleStartAt?: string
  reason?: string
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
  const page = unwrapApiBody<AbsenceReasonPage | ProgramAbsenceReasonItem[]>(
    await customInstance({
      url: `/api/admin/program-execution/programs/${programId}/absence-reasons`,
      method: 'GET',
      params: { latestOnly: true, page: 0, size: 100 },
    })
  )
  if (Array.isArray(page)) return page
  return page.items ?? page.content ?? []
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
