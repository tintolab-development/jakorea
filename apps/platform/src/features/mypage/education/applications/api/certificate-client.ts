import { axiosClient } from '@/shared/api/axios-instance'
import { savePortalCertificatePdfDownload } from '../lib/personal-certificate-render-download.ts'
import {
  mapPortalCertificateAvailability,
  mapPortalCertificateIssueResult,
  PORTAL_CERTIFICATE_TYPE_COMPLETION,
  portalCertificateAvailabilityPath,
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
  await savePortalCertificatePdfDownload(certificateIssueId)
}
