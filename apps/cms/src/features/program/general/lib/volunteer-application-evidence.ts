import type { VolunteerApplicationEvidenceAttachment } from '@/features/program/general/model/volunteer-applicant'

function finiteId(value: unknown): number | null {
  const id = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

/** 상세 응답 `application.attachments`. 없거나 비정상이면 [] */
export function readVolunteerApplicationAttachments(
  application: unknown,
): VolunteerApplicationEvidenceAttachment[] {
  if (!application || typeof application !== 'object') return []
  const raw = (application as { attachments?: unknown }).attachments
  if (!Array.isArray(raw)) return []
  const files: VolunteerApplicationEvidenceAttachment[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const submissionFileId = finiteId(row.submissionFileId)
    const fileObjectId = finiteId(row.fileObjectId)
    const originalFileName = typeof row.originalFileName === 'string' ? row.originalFileName.trim() : ''
    const downloadPolicyPath =
      typeof row.downloadPolicyPath === 'string' ? row.downloadPolicyPath.trim() : ''
    const questionKey = typeof row.questionKey === 'string' ? row.questionKey : ''
    if (submissionFileId == null || fileObjectId == null || !originalFileName || !downloadPolicyPath) {
      continue
    }
    files.push({
      submissionFileId,
      questionKey,
      fileObjectId,
      originalFileName,
      contentType: typeof row.contentType === 'string' ? row.contentType : null,
      fileSize: typeof row.fileSize === 'number' ? row.fileSize : null,
      downloadPolicyPath,
    })
  }
  return files
}
