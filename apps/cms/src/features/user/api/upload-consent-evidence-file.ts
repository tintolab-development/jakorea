import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import type { FileObjectResponse } from '@/shared/api/generated/members/schemas/fileObjectResponse'
import type { FileUploadConfirmRequest } from '@/shared/api/generated/members/schemas/fileUploadConfirmRequest'
import type { FileUploadPrepareRequest } from '@/shared/api/generated/members/schemas/fileUploadPrepareRequest'
import type { FileUploadUrlResponse } from '@/shared/api/generated/members/schemas/fileUploadUrlResponse'
import type { TermsDocumentResponse } from '@/shared/api/generated/members/schemas/termsDocumentResponse'
import { customInstance } from '@/shared/api/orval-mutator'

const CRIME_TERMS_TYPE = 'CRIMINAL_HISTORY_CHECK_CONSENT'
const CONSENT_OWNER_DOMAIN = 'MEMBER'
const CONSENT_OWNER_TYPE = 'CONSENT'
const CONSENT_PRIVACY_LEVEL = 'SENSITIVE'

export type UploadConsentEvidenceFileInput = {
  file: File
  originalFileName?: string
  /** 상세 PATCH 등 회원이 이미 있을 때 */
  memberId?: number
}

function getHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const response = (error as { response?: unknown }).response
  if (!response || typeof response !== 'object' || !('status' in response)) return undefined
  const status = (response as { status?: unknown }).status
  return typeof status === 'number' ? status : undefined
}

function rethrowConsentUploadError(error: unknown, context: 'prepare' | 'confirm' | 'crime-current'): never {
  const status = getHttpStatus(error)
  if (context === 'crime-current') {
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
  }
  if (context === 'prepare') {
    if (status === 401) {
      throw new Error(
        '관리자 파일 업로드 인증에 실패했습니다. 로그인 상태를 확인하거나 백엔드 파일 API 권한을 확인해 주세요.'
      )
    }
    if (status === 403) {
      throw new Error('파일 업로드 권한이 없습니다. 관리자 계정 권한을 확인해 주세요.')
    }
  }
  if (context === 'confirm' && status === 401) {
    throw new Error('파일 업로드 확인(confirm) 인증에 실패했습니다. 다시 시도해 주세요.')
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

function parseFileObjectId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    return parsed >= 1 ? parsed : null
  }
  return null
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
    rethrowConsentUploadError(error, 'crime-current')
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

async function putPresignedObject(upload: FileUploadUrlResponse, file: File): Promise<void> {
  const uploadUrl = upload.uploadUrl?.trim()
  if (!uploadUrl) {
    throw new Error('파일 업로드 URL을 받지 못했습니다.')
  }
  const method = (upload.method?.trim() || 'PUT').toUpperCase()
  const headers = new Headers()
  for (const [key, value] of Object.entries(upload.requiredHeaders ?? {})) {
    if (value) headers.set(key, value)
  }
  if (!headers.has('Content-Type') && file.type) {
    headers.set('Content-Type', file.type)
  }

  const response = await fetch(uploadUrl, {
    method,
    headers,
    body: file,
  })
  if (!response.ok) {
    throw new Error('성범죄 동의서 파일 업로드에 실패했습니다.')
  }
}

function confirmPathFor(fileObjectId: number, confirmPath?: string): string {
  const trimmed = confirmPath?.trim()
  if (trimmed) return trimmed
  return `/api/admin/files/${fileObjectId}/confirm`
}

/**
 * 성범죄 경력조회 동의서 첨부 → object storage 업로드 → fileObjectId.
 * presigned PUT은 스토리지 직접 호출이라 axios Bearer를 붙이지 않는다.
 */
export async function uploadConsentEvidenceFile(
  input: UploadConsentEvidenceFileInput
): Promise<number> {
  const originalFileName =
    input.originalFileName?.trim() || input.file.name.trim() || 'crime-consent.png'
  const contentType = input.file.type.trim() || 'application/octet-stream'
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

  const prepareBody: FileUploadPrepareRequest = {
    ownerDomain: CONSENT_OWNER_DOMAIN,
    ownerType: CONSENT_OWNER_TYPE,
    ownerId,
    privacyLevel: CONSENT_PRIVACY_LEVEL,
    originalFileName,
    contentType,
    fileSize,
  }

  let prepared: FileUploadUrlResponse
  try {
    prepared = unwrapApiBody<FileUploadUrlResponse>(
      await customInstance<FileUploadUrlResponse>({
        url: '/api/admin/files/upload-requests',
        method: 'POST',
        data: prepareBody,
      })
    )
  } catch (error) {
    rethrowConsentUploadError(error, 'prepare')
  }

  const fileObjectId = parseFileObjectId(prepared.fileObjectId)
  if (fileObjectId == null) {
    throw new Error('파일 객체 ID를 받지 못했습니다.')
  }

  await putPresignedObject(prepared, input.file)

  const confirmBody: FileUploadConfirmRequest = {
    fileSize,
    contentType,
  }
  let confirmed: FileObjectResponse
  try {
    confirmed = unwrapApiBody<FileObjectResponse>(
      await customInstance<FileObjectResponse>({
        url: confirmPathFor(fileObjectId, prepared.confirmPath),
        method: 'POST',
        data: confirmBody,
      })
    )
  } catch (error) {
    rethrowConsentUploadError(error, 'confirm')
  }
  return parseFileObjectId(confirmed.fileObjectId) ?? fileObjectId
}
