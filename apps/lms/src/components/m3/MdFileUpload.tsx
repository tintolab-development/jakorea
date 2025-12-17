/**
 * Material Design 3 File Upload React Component
 * Phase 6: 파일 업로드 UI (구글폼 스타일)
 */

import { useRef, useState } from 'react'
import MdButton from './MdButton'
import './MdFileUpload.css'

export interface FileUploadItem {
  file: File
  id: string
}

export interface MdFileUploadProps {
  label: string
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // bytes
  files: FileUploadItem[]
  onChange: (files: FileUploadItem[]) => void
  required?: boolean
  error?: boolean
  errorText?: string
  helperText?: string
}

/**
 * 파일 크기 포맷팅
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default function MdFileUpload({
  label,
  accept,
  multiple = false,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB 기본값
  files,
  onChange,
  required = false,
  error = false,
  errorText,
  helperText,
}: MdFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  // UUID 생성 헬퍼
  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 파일 유효성 검사
  const validateFiles = (newFiles: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = []
    const errors: string[] = []

    for (const file of newFiles) {
      // 크기 검사
      if (file.size > maxSize) {
        errors.push(`${file.name}: 파일 크기는 ${formatFileSize(maxSize)} 이하여야 합니다`)
        continue
      }

      // 확장자 검사
      if (accept) {
        const acceptedExtensions = accept.split(',').map(ext => ext.trim().replace('.', ''))
        const fileExtension = file.name.split('.').pop()?.toLowerCase()
        if (!fileExtension || !acceptedExtensions.includes(fileExtension)) {
          errors.push(`${file.name}: 허용되지 않는 파일 형식입니다`)
          continue
        }
      }

      valid.push(file)
    }

    return { valid, errors }
  }

  // 파일 추가
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    const fileArray = Array.from(selectedFiles)
    const currentCount = files.length

    // 최대 개수 검사
    if (currentCount + fileArray.length > maxFiles) {
      alert(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다`)
      return
    }

    const { valid, errors } = validateFiles(fileArray)

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    if (valid.length > 0) {
      const newFiles: FileUploadItem[] = valid.map(file => ({
        file,
        id: generateId(),
      }))
      onChange([...files, ...newFiles])
    }
  }

  // 파일 삭제
  const handleFileRemove = (id: string) => {
    onChange(files.filter(f => f.id !== id))
  }

  // 드래그 앤 드롭 핸들러
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  return (
    <div className="md-file-upload">
      <label className="md-file-upload-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>

      <div
        className={`md-file-upload-area ${dragActive ? 'drag-active' : ''} ${error ? 'error' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <div className="md-file-upload-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 15.01L9.41 16.42L11 14.84V19H13V14.84L14.59 16.43L16 15.01L12.01 11L8 15.01Z"
              fill="currentColor"
            />
          </svg>
          <p className="md-file-upload-text">
            파일을 드래그하여 업로드하거나 <span className="link-text">클릭하여 선택</span>
          </p>
          {accept && <p className="md-file-upload-hint">허용 형식: {accept}</p>}
          {maxSize && <p className="md-file-upload-hint">최대 크기: {formatFileSize(maxSize)}</p>}
        </div>
      </div>

      {/* 업로드된 파일 목록 */}
      {files.length > 0 && (
        <div className="md-file-upload-list">
          {files.map((item) => (
            <div key={item.id} className="md-file-upload-item">
              <div className="md-file-upload-item-info">
                <span className="md-file-upload-item-name">{item.file.name}</span>
                <span className="md-file-upload-item-size">{formatFileSize(item.file.size)}</span>
              </div>
              <MdButton variant="text" onClick={() => handleFileRemove(item.id)}>
                삭제
              </MdButton>
            </div>
          ))}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && errorText && <div className="md-file-upload-error">{errorText}</div>}

      {/* 도움말 텍스트 */}
      {helperText && !error && <div className="md-file-upload-helper">{helperText}</div>}
    </div>
  )
}

