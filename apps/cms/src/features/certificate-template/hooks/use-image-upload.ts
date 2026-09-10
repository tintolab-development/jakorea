/**
 * 이미지 업로드 Custom Hook
 * 파일 업로드 비즈니스 로직을 분리하여 재사용성과 테스트 용이성 향상
 */

import { useState, useCallback } from 'react'
import type { UploadProps } from 'antd'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  contentUrlForFileObjectId,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'

export interface UseImageUploadOptions {
  /** 허용되는 MIME 타입 목록 */
  allowedTypes?: string[]
  /** 최대 파일 크기 (bytes) */
  maxSize?: number
  /** 업로드 성공 시 콜백 */
  onSuccess?: (url: string) => void
  /** 업로드 실패 시 콜백 */
  onError?: (error: Error) => void
  /** 파일 유효성 검사 실패 시 커스텀 메시지 */
  errorMessages?: {
    invalidType?: string
    tooLarge?: string
    uploadFailed?: string
  }
}

export interface UseImageUploadResult {
  /** 업로드 중 여부 */
  uploading: boolean
  /** 미리보기 URL */
  previewUrl: string | undefined
  /** 업로드된 파일명 */
  fileName: string | undefined
  /** 업로드 핸들러 (Ant Design Upload의 customRequest) */
  handleUpload: UploadProps['customRequest']
  /** 이미지 제거 핸들러 */
  handleRemove: () => void
  /** 미리보기 URL 설정 */
  setPreviewUrl: (url: string | undefined) => void
}

const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * 이미지 업로드 Custom Hook
 * 
 * @param options - 업로드 옵션
 * @returns 업로드 관련 상태 및 핸들러
 * 
 * @example
 * ```tsx
 * const { uploading, previewUrl, handleUpload, handleRemove } = useImageUpload({
 *   onSuccess: (url) => {
 *     console.log('업로드 완료:', url)
 *   },
 *   onError: (error) => {
 *     console.error('업로드 실패:', error)
 *   }
 * })
 * ```
 */
export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadResult {
  const {
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    maxSize = DEFAULT_MAX_SIZE,
    onSuccess,
    onError,
    errorMessages = {},
  } = options

  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined)
  const [fileName, setFileName] = useState<string | undefined>(undefined)

  const handleUpload: UploadProps['customRequest'] = useCallback(
    async (options: Parameters<NonNullable<UploadProps['customRequest']>>[0]) => {
      const { file, onSuccess: onUploadSuccess, onError: onUploadError } = options
      const fileObj = file as File

      try {
        setUploading(true)

        // 파일 유효성 검사
        if (!allowedTypes.includes(fileObj.type)) {
          const errorMessage = errorMessages.invalidType || 'JPG, PNG 파일만 업로드 가능합니다'
          onUploadError?.(new Error(errorMessage))
          return
        }

        if (fileObj.size > maxSize) {
          const errorMessage = errorMessages.tooLarge || '파일 크기는 10MB 이하여야 합니다'
          onUploadError?.(new Error(errorMessage))
          return
        }

        const owner = buildAdminFileOwner(
          ADMIN_FILE_OWNER.CERTIFICATE_TEMPLATE,
          1,
          ADMIN_FILE_PURPOSE.CERTIFICATE_ASSET
        )
        const uploaded = await uploadAdminFileMaybeMock({ file: fileObj, owner })
        const url = contentUrlForFileObjectId(uploaded.fileObjectId)

        setPreviewUrl(url)
        setFileName(fileObj.name)

        onSuccess?.(url)

        // Ant Design Upload의 onSuccess 호출
        onUploadSuccess?.(url, fileObj as any)
        } catch (error) {
        console.error('이미지 업로드 오류:', error)
        const errorMessage = errorMessages.uploadFailed || '이미지 업로드에 실패했습니다'
        onError?.(new Error(errorMessage))
        onUploadError?.(new Error(errorMessage))
      } finally {
        setUploading(false)
      }
    },
    [allowedTypes, maxSize, onSuccess, onError, errorMessages]
  )

  const handleRemove = useCallback(() => {
    // Blob URL 정리
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(undefined)
    setFileName(undefined)
  }, [previewUrl])

  return {
    uploading,
    previewUrl,
    fileName,
    handleUpload,
    handleRemove,
    setPreviewUrl,
  }
}
