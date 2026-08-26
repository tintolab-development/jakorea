import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { customInstance } from '@/shared/api/orval-mutator'
import type { CertificateBulkIssueRequest } from '@/shared/api/generated/members/schemas/certificateBulkIssueRequest'
import type { BulkActionResponse } from '@/shared/api/generated/members/schemas/bulkActionResponse'
import type { BulkDownloadEndpointResponse } from '@/features/user/api/download-bulk-endpoint'

/** Swagger `bulkIssue` — `POST /api/admin/certificates/issues/bulk` */
export async function bulkIssueCertificatesRemote(
  body: CertificateBulkIssueRequest
): Promise<BulkActionResponse> {
  return unwrapApiBody(
    await customInstance<unknown>({
      url: '/api/admin/certificates/issues/bulk',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}

/** REQ-014 — 발급 후 ZIP 수령 */
export async function bulkDownloadCertificatesRemote(
  body: CertificateBulkIssueRequest
): Promise<BulkDownloadEndpointResponse> {
  return unwrapApiBody(
    await customInstance<BulkDownloadEndpointResponse>({
      url: '/api/admin/certificates/issues/bulk-download',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}
