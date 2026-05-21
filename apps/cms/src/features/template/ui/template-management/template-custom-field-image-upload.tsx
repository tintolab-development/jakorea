import type { ChangeEvent, RefObject } from 'react'
import { CmsButton } from '@/shared/ui'

export interface TemplateCustomFieldImageUploadProps {
  /** 우측 타이틀·aria용 필드 라벨 */
  fieldLabel: string
  /** 썸네일에 표시할 이미지 URL(blob 또는 번들 경로) */
  thumbSrc?: string
  uploading: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  accept: string
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void
}

/**
 * 템플릿 커스텀 필드 — 이미지 업로드(1:1 썸네일 + 파일 변경 + 안내 문구)
 */
export function TemplateCustomFieldImageUpload({
  fieldLabel,
  thumbSrc,
  uploading,
  fileInputRef,
  accept,
  onFileChange,
}: TemplateCustomFieldImageUploadProps) {
  return (
    <div className="template-custom-fields-form__logo-upload">
      <div
        className="template-custom-fields-form__logo-thumb"
        role="img"
        aria-label={thumbSrc ? `${fieldLabel} 미리보기` : `${fieldLabel} 미리보기 없음`}
      >
        {thumbSrc ? (
          <img src={thumbSrc} alt="" className="template-custom-fields-form__logo-thumb-img" />
        ) : null}
      </div>
      <div className="template-custom-fields-form__logo-actions">
        <input ref={fileInputRef} type="file" accept={accept} hidden onChange={onFileChange} />
        <CmsButton
          type="button"
          variant="secondary"
          size="large"
          className="template-custom-fields-form__logo-file-btn"
          loading={uploading}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          aria-label={`${fieldLabel} 파일 선택`}
        >
          파일 변경
        </CmsButton>
        <div className="template-custom-fields-form__logo-hint">
          <p>{'-  파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.'}</p>
          <p>{'-  첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.'}</p>
        </div>
      </div>
    </div>
  )
}
