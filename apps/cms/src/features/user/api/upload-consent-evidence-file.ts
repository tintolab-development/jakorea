import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import type { TermsDocumentResponse } from '@/shared/api/generated/members/schemas/termsDocumentResponse'
import { customInstance } from '@/shared/api/orval-mutator'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  parseFileObjectId,
  uploadAdminFile,
} from '@/shared/lib/admin-file-upload'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'

const CRIME_TERMS_TYPE = 'CRIMINAL_HISTORY_CHECK_CONSENT'

export type UploadConsentEvidenceFileInput = {
  file: File
  originalFileName?: string
  /** 상세 PATCH 등 회원이 이미 있을 때 */
  memberId?: number
}

function rethrowCrimeTermsDocumentError(error: unknown): never {
  const status = getApiErrorHttpStatus(error)
  if (status === 404) {
    throw new Error(
      '성범죄 경력 조회 동의 약관 문서가 게시되어 있지 않습니다. 약관 문서 관리를 확인해 주세요.'
    )
  }
  if (status === 401) {
    throw new Error(
      '성범죄 동의서 업로드 준비에 실패했습니다. 공개 약관 문서 API가 관리자 토큰을 거절하지 않는지 확인해 주세요.'
    )
  }
  throw error instanceof Error ? error : new Error('성범죄 동의서 파일 업로드에 실패했습니다.')
}

/** S3·파일 API 미연결 시 stub id 반환.
 * `files` 또는 `members`(회원·강사 등록/상세)가 실 API이면 실제 upload-requests 경로를 탄다.
 */
export function shouldMockConsentFileUpload(): boolean {
  return !isRealApiModuleEnabled('files') && !isRealApiModuleEnabled('members')
}

function createStubConsentFileObjectId(fileSize: number): number {
  return 900_000_001 + (fileSize % 1000)
}

async function fetchCrimeTermsDocumentId(): Promise<number | null> {
  try {
    const payload = await customInstance<TermsDocumentResponse>({
      url: `/api/public/terms-documents/${encodeURIComponent(CRIME_TERMS_TYPE)}/current`,
      method: 'GET',
    })
    const doc = unwrapApiBody<TermsDocumentResponse>(payload)
    return parseFileObjectId(doc.id)
  } catch (error) {
    rethrowCrimeTermsDocumentError(error)
  }
}

export function dataUrlToFile(dataUrl: string, filename: string): File | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
  if (!match) return null
  const mime = match[1] ?? 'application/octet-stream'
  const binary = atob(match[2] ?? '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], filename, { type: mime })
}

/**
 * 성범죄 경력조회 동의서 첨부 → object storage 업로드 → fileObjectId.
 * presigned PUT은 스토리지 직접 호출이라 axios Bearer를 붙이지 않는다.
 * pre-register는 `CONSENT_EVIDENCE_FILE_NOT_READY_OR_NOT_OWNED`로
 * CLEAN+AVAILABLE(및 업로더 소유)을 요구하므로 confirm 후 상태 폴링까지 한다.
 */
export async function uploadConsentEvidenceFile(
  input: UploadConsentEvidenceFileInput
): Promise<number> {
  const originalFileName =
    input.originalFileName?.trim() || input.file.name.trim() || 'crime-consent.png'
  const fileSize = input.file.size
  if (fileSize < 1) {
    throw new Error('성범죄 동의서 파일이 비어 있습니다.')
  }

  const ownerId = input.memberId ?? (await fetchCrimeTermsDocumentId())
  if (ownerId == null) {
    throw new Error('성범죄 동의서 파일을 업로드할 수 없습니다. 약관 문서 ID를 확인하세요.')
  }

  if (shouldMockConsentFileUpload()) {
    return createStubConsentFileObjectId(fileSize)
  }

  const result = await uploadAdminFile({
    file: input.file,
    originalFileName,
    owner: buildAdminFileOwner(
      ADMIN_FILE_OWNER.MEMBER_CONSENT,
      ownerId,
      ADMIN_FILE_PURPOSE.CRIMINAL_HISTORY_EVIDENCE
    ),
    waitUntilAvailable: true,
    // 배포 스캐너·프로모션이 느릴 수 있음 (기본 30×2s=60s → 90×2s=3분)
    poll: { maxAttempts: 90, intervalMs: 2_000 },
  })
  return result.fileObjectId
}
