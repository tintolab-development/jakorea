import type { FileObjectResponse } from '@/shared/api/generated/members/schemas/fileObjectResponse'
import type { FileUploadUrlResponse } from '@/shared/api/generated/members/schemas/fileUploadUrlResponse'

export type AdminFileUploadOwner = {
  ownerDomain: string
  ownerType: string
  ownerId: number
  privacyLevel: string
}

/** 업로드 UI 상태 — confirm 성공만으로는 SUCCESS가 아님 */
export type AdminFileUploadPhase =
  | 'IDLE'
  | 'HASHING'
  | 'UPLOADING'
  | 'CONFIRMING'
  | 'SCANNING'
  | 'SUCCESS'
  | 'ERROR'

export type CreateUploadRequestInput = {
  owner: AdminFileUploadOwner
  originalFileName: string
  contentType: string
  fileSize: number
  checksumSha256: string
  idempotencyKey?: string
}

export type ConfirmUploadInput = {
  fileObjectId: number
  confirmPath?: string
  fileSize: number
  checksumSha256: string
  contentType: string
}

export type WaitUntilFileAvailableOptions = {
  maxAttempts?: number
  intervalMs?: number
  sleep?: (ms: number) => Promise<void>
}

export type UploadAdminFileInput = {
  file: File
  owner: AdminFileUploadOwner
  originalFileName?: string
  /**
   * confirm 이후 `CLEAN + AVAILABLE`까지 대기. 기본 true.
   * confirm 성공만으로 사용 가능 파일이 되지는 않습니다.
   */
  waitUntilAvailable?: boolean
  onPhaseChange?: (phase: AdminFileUploadPhase) => void
  poll?: WaitUntilFileAvailableOptions
}

export type UploadAdminFileResult = {
  fileObjectId: number
  checksumSha256: string
  file?: FileObjectResponse
}

export type PreparedUpload = FileUploadUrlResponse
