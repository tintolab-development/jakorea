import { axiosClient } from '@/shared/api/axios-instance'
import { fetchBlobOnce } from '@/shared/lib/download-attachment'

const EDUCATION_JOURNAL_FILE_PURPOSE = 'EDUCATION_JOURNAL'
const EDUCATION_JOURNAL_DOWNLOAD_PURPOSE = '교육일지 제출 파일 확인'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

function educationJournalsPath(programId: string, organizationApplicationId: string): string {
  return `/api/portal/me/programs/${encodeURIComponent(programId)}/organization-applications/${encodeURIComponent(organizationApplicationId)}/education-journals`
}

export type PortalEducationJournal = {
  journalId?: number
  programId?: number
  organizationApplicationId?: number
  submittedByMemberId?: number
  fileObjectId?: number
  journalTitle?: string
  journalMemo?: string
  originalFilename?: string
  submittedAt?: string
  createdAt?: string
  updatedAt?: string
  availableActions?: string[]
}

export type PortalEducationJournalDownload = {
  fileObjectId?: number
  downloadUrl?: string
  expiresAt?: string
  requiredHeaders?: Record<string, string>
}

export async function fetchPortalEducationJournals(
  programId: string,
  organizationApplicationId: string,
  signal?: AbortSignal,
): Promise<PortalEducationJournal[]> {
  const { data } = await axiosClient.get<unknown>(
    educationJournalsPath(programId, organizationApplicationId),
    { signal },
  )
  const body = unwrapEnvelope<PortalEducationJournal[] | { items?: PortalEducationJournal[] }>(data)
  return Array.isArray(body) ? body : body?.items ?? []
}

export async function submitPortalEducationJournal(input: {
  programId: string
  organizationApplicationId: string
  fileObjectId: number
  journalTitle?: string
  journalMemo?: string
}): Promise<PortalEducationJournal> {
  const { data } = await axiosClient.post<unknown>(
    educationJournalsPath(input.programId, input.organizationApplicationId),
    {
      organizationApplicationId: Number(input.organizationApplicationId),
      fileObjectId: input.fileObjectId,
      journalTitle: input.journalTitle?.trim() || undefined,
      journalMemo: input.journalMemo?.trim() || undefined,
    },
  )
  return unwrapEnvelope<PortalEducationJournal>(data)
}

export async function requestPortalEducationJournalDownload(
  fileObjectId: number,
): Promise<PortalEducationJournalDownload> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/files/${encodeURIComponent(fileObjectId)}/download-requests`,
    { purpose: EDUCATION_JOURNAL_DOWNLOAD_PURPOSE },
  )
  return unwrapEnvelope<PortalEducationJournalDownload>(data)
}

function saveBlobFile(fileName: string, blob: Blob): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

export async function downloadPortalEducationJournal(input: {
  fileObjectId: number
  fileName: string
}): Promise<void> {
  const resolved = await requestPortalEducationJournalDownload(input.fileObjectId)
  const url = resolved.downloadUrl?.trim()
  if (!url) throw new Error('교육일지 다운로드 주소를 받지 못했습니다.')
  const requiredHeaders = resolved.requiredHeaders ?? {}
  const blob =
    Object.keys(requiredHeaders).length === 0
      ? await fetchBlobOnce(url)
      : await fetchBlobWithHeaders(url, requiredHeaders)
  if (blob.size === 0 || /\bjson\b/i.test(blob.type)) {
    throw new Error('교육일지 파일을 받지 못했습니다.')
  }
  saveBlobFile(input.fileName.trim() || `교육일지_${input.fileObjectId}`, blob)
}

async function fetchBlobWithHeaders(
  url: string,
  headers: Record<string, string>,
): Promise<Blob> {
  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'omit',
    mode: 'cors',
  })
  if (!response.ok) {
    throw new Error(`교육일지 다운로드에 실패했습니다. (${response.status})`)
  }
  return response.blob()
}

export { EDUCATION_JOURNAL_FILE_PURPOSE }
