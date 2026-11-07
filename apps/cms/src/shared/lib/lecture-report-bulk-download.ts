import { LectureReportBulkDownloadErrorCode } from '@/shared/api/generated/members/schemas/lectureReportBulkDownloadErrorCode'
import { customInstance } from '@/shared/api/orval-mutator'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { resolveAdminRoleCodeFromUser } from '@/shared/lib/admin-role-policy'
import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
import { generateFilename } from '@/shared/utils/file-download'
import { downloadFromBulkEndpoint } from '@/features/user/api/download-bulk-endpoint'

export const LECTURE_REPORT_NO_DOWNLOADABLE_FILES =
  LectureReportBulkDownloadErrorCode.LECTURE_REPORT_NO_DOWNLOADABLE_FILES

export const LECTURE_REPORT_NO_DOWNLOADABLE_FILES_MESSAGE =
  '다운로드할 수 있는 강의보고서 파일이 없습니다. 제출된 보고서의 첨부파일이 없거나 파일 검사가 완료되지 않았습니다.'

export const LECTURE_REPORT_NO_ATTACHMENT_CTA = '다운로드할 첨부파일이 없습니다'

export const LECTURE_REPORT_BULK_JOB_TYPE = 'LECTURE_REPORT_BULK_DOWNLOAD'

const COMPLETED_JOB_STATUSES = new Set(['COMPLETED', 'SUCCEEDED', 'SUCCESS', 'DONE'])
const FAILED_JOB_STATUSES = new Set(['FAILED', 'ERROR', 'CANCELLED', 'CANCELED', 'EXPIRED'])
const PENDING_JOB_STATUSES = new Set(['PENDING', 'QUEUED', 'IN_PROGRESS', 'PROCESSING', 'RUNNING'])

export type LectureReportBulkDownloadJob = {
  jobType?: string | null
  programId?: number | null
  generatedFileJobId?: number | null
  status?: string | null
  jobStatus?: string | null
  fileObjectId?: number | null
  downloadUrl?: string | null
}

function readPositiveId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed
  }
  return null
}

export function nonemptyDownloadUrl(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function fileObjectIdFromLectureReportDownloadUrl(
  url: string | null | undefined
): number | null {
  const nonempty = nonemptyDownloadUrl(url)
  if (!nonempty) return null
  const match = nonempty.match(/\/api\/admin\/files\/(\d+)\/download(?:[/?]|$)/i)
  return match?.[1] ? readPositiveId(match[1]) : null
}

export function hasLectureReportZipTargets(
  rows: ReadonlyArray<{
    fileObjectIds?: readonly number[] | null
    fileCount?: number | null
  }>
): boolean {
  return rows.some(
    row =>
      (row.fileObjectIds?.length ?? 0) > 0 ||
      (typeof row.fileCount === 'number' && row.fileCount > 0)
  )
}

export function hasFileDownloadPermission(): boolean {
  const user = useAuthStore.getState().user
  if (resolveAdminRoleCodeFromUser(user) === 'MASTER') return true
  const codes = user?.permissionCodes
  if (codes == null) return true
  return codes.includes('FILE_DOWNLOAD')
}

function jobStatusOf(job: LectureReportBulkDownloadJob): string {
  return (job.status ?? job.jobStatus ?? '').trim().toUpperCase()
}

async function fetchGeneratedFileJob(jobId: number): Promise<LectureReportBulkDownloadJob> {
  return unwrapApiBody<LectureReportBulkDownloadJob>(
    await customInstance({
      url: `/api/admin/generated-files/jobs/${encodeURIComponent(jobId)}`,
      method: 'GET',
    })
  )
}

export async function waitForLectureReportBulkDownloadJob(
  job: LectureReportBulkDownloadJob,
  fetchJob: (jobId: number) => Promise<LectureReportBulkDownloadJob> = fetchGeneratedFileJob,
  delayMs = 1_000
): Promise<LectureReportBulkDownloadJob> {
  const initialStatus = jobStatusOf(job)
  if (COMPLETED_JOB_STATUSES.has(initialStatus)) return job
  if (FAILED_JOB_STATUSES.has(initialStatus)) {
    throw new Error('강의보고서 일괄 다운로드 작업이 실패했습니다.')
  }

  const jobId = readPositiveId(job.generatedFileJobId)
  if (jobId == null) {
    if (PENDING_JOB_STATUSES.has(initialStatus) || !initialStatus) {
      throw new Error('강의보고서 다운로드 작업 ID가 없습니다.')
    }
    return job
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const next = await fetchJob(jobId)
    const status = jobStatusOf(next)
    if (COMPLETED_JOB_STATUSES.has(status)) return next
    if (FAILED_JOB_STATUSES.has(status)) {
      throw new Error('강의보고서 일괄 다운로드 작업이 실패했습니다.')
    }
    if (attempt < 29 && delayMs > 0) {
      await new Promise<void>(resolve => {
        window.setTimeout(resolve, delayMs)
      })
    }
  }
  throw new Error('강의보고서 다운로드 준비 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.')
}

export async function saveLectureReportBulkDownloadJob(
  job: LectureReportBulkDownloadJob,
  filenamePrefix = '강의보고서_일괄'
): Promise<void> {
  const ready = await waitForLectureReportBulkDownloadJob(job)
  const fileObjectId =
    readPositiveId(ready.fileObjectId) ?? fileObjectIdFromLectureReportDownloadUrl(ready.downloadUrl)
  if (fileObjectId != null) {
    await downloadAdminFile({
      fileObjectId,
      fileName: generateFilename(filenamePrefix, 'zip'),
    })
    return
  }
  const downloadUrl = nonemptyDownloadUrl(ready.downloadUrl)
  if (downloadUrl) {
    await downloadFromBulkEndpoint(downloadUrl, filenamePrefix, 'zip')
    return
  }
  throw new Error('강의보고서 다운로드 URL이 없습니다.')
}
