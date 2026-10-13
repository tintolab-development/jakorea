import { axiosClient } from '@/shared/api/axios-instance'
import { fetchBlobOnce, readDownloadUrlFromJsonBlob } from '@/shared/lib/download-attachment'
import type {
  PortalOrganizationPortraitConsent,
  PortalStudentDocumentPolicy,
  PortalStudentRosterResponse,
} from './student-documents-types'

const ORGANIZATION_APPLICATIONS_PATH = '/api/portal/me/organization-applications'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

function organizationApplicationPath(applicationId: string): string {
  return `${ORGANIZATION_APPLICATIONS_PATH}/${encodeURIComponent(applicationId)}`
}

function saveBlobFile(fileName: string, blob: Blob) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

async function saveBlobResponse(blob: Blob, fileName: string): Promise<void> {
  const signedUrl = await readDownloadUrlFromJsonBlob(blob)
  if (signedUrl) {
    const fileBlob = await fetchBlobOnce(signedUrl)
    saveBlobFile(fileName, fileBlob)
    return
  }
  if (/\bjson\b/i.test(blob.type) && blob.size < 16_384) {
    throw new Error('양식 파일을 받지 못했습니다.')
  }
  saveBlobFile(fileName, blob)
}

async function postOrganizationApplicationDownload(
  applicationId: string,
  pathSuffix: string,
  fileName: string,
): Promise<void> {
  const { data } = await axiosClient.post<Blob>(
    `${organizationApplicationPath(applicationId)}${pathSuffix}`,
    {},
    { responseType: 'blob' },
  )
  await saveBlobResponse(data, fileName)
}

export async function fetchOrganizationStudentRoster(
  applicationId: string,
  signal?: AbortSignal,
): Promise<PortalStudentRosterResponse> {
  const { data } = await axiosClient.get<unknown>(
    `${organizationApplicationPath(applicationId)}/student-roster`,
    { signal },
  )
  return unwrapEnvelope<PortalStudentRosterResponse>(data)
}

export async function importOrganizationStudentRoster(
  applicationId: string,
  sourceFileObjectId: number,
): Promise<PortalStudentRosterResponse> {
  const { data } = await axiosClient.post<unknown>(
    `${organizationApplicationPath(applicationId)}/student-roster/import`,
    { sourceFileObjectId },
  )
  return unwrapEnvelope<PortalStudentRosterResponse>(data)
}

export async function downloadOrganizationStudentRosterTemplate(
  applicationId: string,
): Promise<void> {
  await postOrganizationApplicationDownload(
    applicationId,
    '/student-roster/template',
    '학생명단_양식.xlsx',
  )
}

export async function fetchOrganizationStudentDocumentPolicy(
  applicationId: string,
  signal?: AbortSignal,
): Promise<PortalStudentDocumentPolicy> {
  const { data } = await axiosClient.get<unknown>(
    `${organizationApplicationPath(applicationId)}/student-documents/policy`,
    { signal },
  )
  return unwrapEnvelope<PortalStudentDocumentPolicy>(data)
}

export async function fetchOrganizationPortraitConsent(
  applicationId: string,
  signal?: AbortSignal,
): Promise<PortalOrganizationPortraitConsent | null> {
  const { data } = await axiosClient.get<unknown>(
    `${organizationApplicationPath(applicationId)}/portrait-consent`,
    { signal },
  )
  const unwrapped = unwrapEnvelope<PortalOrganizationPortraitConsent | null>(data)
  if (unwrapped == null) return null
  if (typeof unwrapped === 'object' && Object.keys(unwrapped).length === 0) return null
  return unwrapped
}

export async function submitOrganizationPortraitConsent(
  applicationId: string,
  fileObjectId: number,
): Promise<PortalOrganizationPortraitConsent> {
  const { data } = await axiosClient.put<unknown>(
    `${organizationApplicationPath(applicationId)}/portrait-consent`,
    { fileObjectId },
  )
  return unwrapEnvelope<PortalOrganizationPortraitConsent>(data)
}

export async function downloadOrganizationPortraitConsentTemplate(
  applicationId: string,
): Promise<void> {
  await postOrganizationApplicationDownload(
    applicationId,
    '/portrait-consent/template',
    '학생_초상권_동의서_양식.pdf',
  )
}
