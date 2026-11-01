import { axiosClient } from '@/shared/api/axios-instance'
import { downloadFromGeneratedFileJob } from '../lib/portal-generated-file-download.ts'
import { parseGeneratedFileJobPayload } from '../lib/student-documents-template-download.ts'
import {
  mapPortalCertificateAvailability,
  mapPortalCertificateIssueResult,
  PORTAL_CERTIFICATE_TYPE_COMPLETION,
  portalCertificateAvailabilityPath,
  portalCertificateDownloadPath,
  portalCertificateIssuePath,
  type PortalCertificateIssueRequest,
  type PortalCertificateType,
} from './certificate-map.ts'

export {
  mapPortalCertificateAvailability,
  mapPortalCertificateIssueResult,
  PORTAL_CERTIFICATE_TYPE_COMPLETION,
  portalCertificateAvailabilityPath,
  portalCertificateDownloadPath,
  portalCertificateIssuePath,
} from './certificate-map.ts'
export type {
  PortalCertificateAvailability,
  PortalCertificateIssueRequest,
  PortalCertificateIssueResult,
  PortalCertificateType,
} from './certificate-map.ts'

const COMPLETION_DOWNLOAD_TEMPLATE = {
  purpose: '수료증 다운로드',
  fallbackFileName: '수료증.pdf',
  label: '수료증',
}

export async function fetchMyCertificateAvailability(
  programId: number,
  certificateType: PortalCertificateType = PORTAL_CERTIFICATE_TYPE_COMPLETION,
  signal?: AbortSignal,
): Promise<ReturnType<typeof mapPortalCertificateAvailability>> {
  const { data } = await axiosClient.get<unknown>(
    portalCertificateAvailabilityPath(programId, certificateType),
    { signal },
  )
  return mapPortalCertificateAvailability(data)
}

export async function issueMyCertificate(
  input: PortalCertificateIssueRequest,
): Promise<ReturnType<typeof mapPortalCertificateIssueResult>> {
  const { data } = await axiosClient.post<unknown>(portalCertificateIssuePath(), {
    programId: input.programId,
    participantId: input.participantId,
    certificateType: input.certificateType ?? PORTAL_CERTIFICATE_TYPE_COMPLETION,
  })
  return mapPortalCertificateIssueResult(data)
}

export async function downloadMyCertificate(certificateIssueId: number): Promise<void> {
  const { data } = await axiosClient.get<unknown>(portalCertificateDownloadPath(certificateIssueId))
  const job = parseGeneratedFileJobPayload(data)
  if (!job) throw new Error('수료증 파일을 받지 못했습니다.')
  await downloadFromGeneratedFileJob(job, COMPLETION_DOWNLOAD_TEMPLATE)
}
