import type { EducationJournalGeneratedFileJobResponse } from '@/shared/api/generated/dashboard/schemas/educationJournalGeneratedFileJobResponse'

const PENDING_STATUSES = new Set([
  'REQUESTED',
  'QUEUED',
  'PENDING',
  'STARTED',
  'PROCESSING',
  'RUNNING',
  'RENDERING',
  'IN_PROGRESS',
])

const COMPLETED_STATUSES = new Set(['COMPLETED', 'SUCCEEDED', 'SUCCESS', 'DONE'])

const FAILED_STATUSES = new Set([
  'FAILED',
  'ERROR',
  'CANCELLED',
  'CANCELED',
  'EXPIRED',
])

function statusOf(job: EducationJournalGeneratedFileJobResponse | null | undefined): string {
  return job?.jobStatus?.trim().toUpperCase() ?? ''
}

export function isEducationJournalZipJobPending(
  job: EducationJournalGeneratedFileJobResponse | null | undefined
): boolean {
  const status = statusOf(job)
  return status === '' || PENDING_STATUSES.has(status)
}

export function isEducationJournalZipJobCompleted(
  job: EducationJournalGeneratedFileJobResponse | null | undefined
): boolean {
  return COMPLETED_STATUSES.has(statusOf(job))
}

export function isEducationJournalZipJobFailed(
  job: EducationJournalGeneratedFileJobResponse | null | undefined
): boolean {
  return FAILED_STATUSES.has(statusOf(job))
}

export function educationJournalZipJobStatusLabel(
  job: EducationJournalGeneratedFileJobResponse | null | undefined
): string {
  if (isEducationJournalZipJobFailed(job)) return '실패'
  if (isEducationJournalZipJobCompleted(job)) return '완료'
  return '생성 중'
}
