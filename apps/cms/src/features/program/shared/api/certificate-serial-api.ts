import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { customInstance } from '@/shared/api/orval-mutator'
import {
  isCertificateSerialPlaceholder,
  mockCertificateSerial,
  type CertificateSerialSubject,
} from '@/features/program/shared/lib/certificate-serial'

export type CertificateSerialAllocateResponse = {
  serialNumber: string
  issueId?: number
  reused?: boolean
}

function isUnimplementedCertificateSerial(error: unknown): boolean {
  if (error == null || typeof error !== 'object') return false
  const status = (error as { response?: { status?: number }; status?: number }).response?.status
    ?? (error as { status?: number }).status
  return status === 404 || status === 501
}

function parseSerialNumber(payload: unknown): string | null {
  if (payload == null || typeof payload !== 'object') return null
  const serialNumber = (payload as { serialNumber?: unknown }).serialNumber
  if (typeof serialNumber !== 'string') return null
  const trimmed = serialNumber.trim()
  if (trimmed === '' || isCertificateSerialPlaceholder(trimmed)) return null
  return trimmed
}

/**
 * 같은 프로그램·대상·유형이면 기존 번호를 반환하고, 없으면 DB에서 다음 일련번호를 확정한다.
 * BE 미구현(404/501)이거나 members 실 API가 꺼져 있으면 결정론적 mock 번호를 쓴다.
 */
export async function allocateCertificateSerial(
  subject: CertificateSerialSubject
): Promise<CertificateSerialAllocateResponse> {
  if (!isMembersRemoteEnabled()) {
    return { serialNumber: mockCertificateSerial(subject), reused: true }
  }

  try {
    const body = await unwrapApiBody<unknown>(
      await customInstance<unknown>({
        url: '/api/admin/certificates/issues/serial',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          programId: subject.programId ?? undefined,
          participantId: subject.subjectId,
          certificateType: subject.certificateType,
        },
      })
    )
    const serialNumber = parseSerialNumber(body)
    if (serialNumber == null) {
      return { serialNumber: mockCertificateSerial(subject), reused: true }
    }
    const issueId = (body as { issueId?: unknown }).issueId
    const reused = (body as { reused?: unknown }).reused
    return {
      serialNumber,
      ...(typeof issueId === 'number' ? { issueId } : {}),
      ...(typeof reused === 'boolean' ? { reused } : {}),
    }
  } catch (error) {
    if (isUnimplementedCertificateSerial(error)) {
      return { serialNumber: mockCertificateSerial(subject), reused: true }
    }
    throw error
  }
}
