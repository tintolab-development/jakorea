import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import { loadSensitiveAdminFileBlob } from '@/shared/lib/admin-file-upload'
import { downloadBlob } from '@/shared/utils/file-download'
import { fetchAllApiPages } from '@/shared/lib/fetch-all-api-pages'

export type ProgramAbsenceReasonAttachment = {
  attachmentId?: number
  fileObjectId?: number
  originalFileName?: string | null
  downloadUrl?: string | null
}

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
  attachments?: Array<ProgramAbsenceReasonAttachment | null>
  latestRevision?: boolean
}

export type ProgramAbsenceReasonEvidence = {
  fileObjectIds: number[]
  originalFileNames: string[]
}

function readPositiveFileObjectId(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

/** GET absence-reasons — fileObjectIds와 attachments[] 모두에서 증빙을 읽는다. */
export function resolveProgramAbsenceReasonEvidence(
  item: ProgramAbsenceReasonItem
): ProgramAbsenceReasonEvidence {
  const fileObjectIds = (item.fileObjectIds ?? [])
    .map(readPositiveFileObjectId)
    .filter((id): id is number => id != null)
  const originalFileNames = (item.originalFileNames ?? [])
    .map(name => (typeof name === 'string' ? name.trim() : ''))
    .filter(name => name.length > 0)

  if (fileObjectIds.length > 0) {
    return { fileObjectIds, originalFileNames }
  }

  const fromAttachments: ProgramAbsenceReasonEvidence = {
    fileObjectIds: [],
    originalFileNames: [],
  }
  for (const attachment of item.attachments ?? []) {
    if (!attachment) continue
    const fileObjectId = readPositiveFileObjectId(attachment.fileObjectId)
    if (fileObjectId == null) continue
    fromAttachments.fileObjectIds.push(fileObjectId)
    const name = attachment.originalFileName?.trim()
    if (name) fromAttachments.originalFileNames.push(name)
  }
  return fromAttachments
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
