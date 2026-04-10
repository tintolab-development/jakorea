import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Input, message } from 'antd'
import type { FileUploadResult } from '@/entities/application/api/file-upload-service'
import { fileUploadService } from '@/entities/application/api/file-upload-service'
import { AppButton } from '@/shared/ui/app-button'
import './template-custom-fields-form.css'
import '@/shared/components/template/template-fullpage-modal.css'

const LOGO_FIELD_NAMES = new Set(['orgLogo', 'orgLogo02'])

/** 미리보기·다른 영역과 필드 매핑 시 사용 (기관 로고 2) */
export const TEMPLATE_FIELD_ORG_LOGO_02 = 'orgLogo02' as const
const MAX_LOGO_FILE_BYTES = 15 * 1024 * 1024
const LOGO_ACCEPT = 'image/jpeg,image/png,.jpg,.jpeg,.png'

export interface TemplateCustomFieldDef {
  name: string
  label: string
}

function isLogoField(field: TemplateCustomFieldDef | null): boolean {
  return field !== null && LOGO_FIELD_NAMES.has(field.name)
}

const DEFAULT_CUSTOM_FIELDS: TemplateCustomFieldDef[] = [
  { name: 'titleName', label: '타이틀명' },
  { name: 'bodyContent', label: '본문 내용' },
  { name: 'chairmanName', label: '회장명' },
  { name: 'chairmanSeal', label: '회장 직인' },
  { name: 'orgAddress', label: '기관 주소지' },
  { name: 'orgPhone', label: '기관 전화번호' },
  { name: 'orgFax', label: '기관 팩스번호' },
  { name: 'orgWebsite', label: '기관 홈페이지 주소' },
  { name: 'orgLogo', label: '기관 로고' },
  { name: 'orgLogo02', label: '기관 로고 02' },
  { name: 'certificateBackground', label: '수료증 배경' },
  { name: 'participantInfo', label: '참여자 정보' },
]

export interface TemplateCustomFieldsFormProps {
  fields?: TemplateCustomFieldDef[]
  onFieldClick?: (field: TemplateCustomFieldDef) => void
  /** 하단 인풋 값 변경 (선택된 필드 기준) */
  onSecondaryValueChange?: (field: TemplateCustomFieldDef, value: string) => void
  /** 로고 업로드 성공 후 — 상위에서 미리보기용 `File`로 blob URL 생성 */
  onLogoFileSelected?: (fieldName: string, file: File) => void
  /** 로고 업로드 성공 후 서버(모의) 응답 — 저장·연동용 */
  onLogoUploadResult?: (fieldName: string, result: FileUploadResult) => void
}

export function TemplateCustomFieldsForm({
  fields = DEFAULT_CUSTOM_FIELDS,
  onFieldClick,
  onSecondaryValueChange,
  onLogoFileSelected,
  onLogoUploadResult,
}: TemplateCustomFieldsFormProps) {
  const [activeField, setActiveField] = useState<TemplateCustomFieldDef | null>(null)
  const [valuesByField, setValuesByField] = useState<Record<string, string>>({})
  const [logoPreviewUrlByField, setLogoPreviewUrlByField] = useState<Record<string, string>>({})
  const [logoUploading, setLogoUploading] = useState(false)
  const logoPreviewUrlsRef = useRef<Record<string, string>>({})
  const logoFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    logoPreviewUrlsRef.current = logoPreviewUrlByField
  }, [logoPreviewUrlByField])

  useEffect(() => {
    return () => {
      Object.values(logoPreviewUrlsRef.current).forEach(url => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [])

  const handleTopFieldClick = useCallback(
    (field: TemplateCustomFieldDef) => {
      setActiveField(field)
      onFieldClick?.(field)
    },
    [onFieldClick]
  )

  const secondaryTitle = activeField?.label ?? '타이틀명'
  const secondaryValue = activeField ? (valuesByField[activeField.name] ?? '') : ''

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!activeField) return
      const value = e.target.value
      setValuesByField(prev => ({ ...prev, [activeField.name]: value }))
      onSecondaryValueChange?.(activeField, value)
    },
    [activeField, onSecondaryValueChange]
  )

  const handleLogoFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      const input = e.target
      const field = activeField
      if (!file || !field || !isLogoField(field)) {
        input.value = ''
        return
      }

      const isAllowedType =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        /\.(jpe?g|png)$/i.test(file.name)
      if (!isAllowedType) {
        message.error('JPG, PNG 형식만 등록할 수 있습니다.')
        input.value = ''
        return
      }
      if (file.size > MAX_LOGO_FILE_BYTES) {
        message.error('파일은 최대 15MB까지 등록 가능합니다.')
        input.value = ''
        return
      }

      const fieldName = field.name
      setLogoUploading(true)
      try {
        const result = await fileUploadService.upload(file, 'image')
        onLogoUploadResult?.(fieldName, result)
        onLogoFileSelected?.(fieldName, file)

        setLogoPreviewUrlByField(prev => {
          const prevUrl = prev[fieldName]
          if (prevUrl) URL.revokeObjectURL(prevUrl)
          const nextUrl = URL.createObjectURL(file)
          return { ...prev, [fieldName]: nextUrl }
        })
        setValuesByField(prev => ({ ...prev, [fieldName]: result.url }))
        onSecondaryValueChange?.(field, result.url)
        message.success(`${field.label} 이미지가 등록되었습니다.`)
      } catch {
        message.error('파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      } finally {
        setLogoUploading(false)
        input.value = ''
      }
    },
    [activeField, onSecondaryValueChange, onLogoFileSelected, onLogoUploadResult]
  )

  const activeLogoPreviewUrl =
    activeField && isLogoField(activeField) ? logoPreviewUrlByField[activeField.name] : undefined

  return (
    <div className="template-custom-fields-form">
      {/* 상단 섹션: 커스텀 필드 */}
      <div className="template-custom-fields-form__section">
        <span className="full-page-modal__nav-title" role="heading" aria-level={2}>
          커스텀 필드
        </span>
        <div className="template-custom-fields-form__list">
          {fields.map(field => (
            <button
              key={field.name}
              type="button"
              className={[
                'template-custom-fields-form__btn',
                activeField?.name === field.name ? 'template-custom-fields-form__btn--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleTopFieldClick(field)}
            >
              <span className="template-custom-fields-form__btn-label">{field.label}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="template-custom-fields-form__divider" aria-hidden />

      {/* 하단: 선택한 항목명이 타이틀로, 하단은 인풋(버튼과 동일 높이) */}
      <div className="template-custom-fields-form__section">
        <span className="full-page-modal__nav-title" role="heading" aria-level={2}>
          {secondaryTitle}
        </span>
        <div className="template-custom-fields-form__secondary-input-wrap">
          {activeField && isLogoField(activeField) ? (
            <div className="template-custom-fields-form__logo-upload">
              <div
                className="template-custom-fields-form__logo-thumb"
                role="img"
                aria-label={activeLogoPreviewUrl ? `${activeField.label} 미리보기` : `${activeField.label} 미리보기 없음`}
              >
                {activeLogoPreviewUrl ? (
                  <img src={activeLogoPreviewUrl} alt="" className="template-custom-fields-form__logo-thumb-img" />
                ) : null}
              </div>
              <div className="template-custom-fields-form__logo-actions">
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept={LOGO_ACCEPT}
                  hidden
                  onChange={handleLogoFileChange}
                />
                <AppButton
                  htmlType="button"
                  variant="cancel"
                  size="large"
                  className="template-custom-fields-form__logo-file-btn"
                  loading={logoUploading}
                  disabled={logoUploading}
                  onClick={() => logoFileInputRef.current?.click()}
                  aria-label={`${activeField.label} 파일 선택`}
                >
                  파일 변경
                </AppButton>
                <div className="template-custom-fields-form__logo-hint">
                  <p>- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.</p>
                  <p>- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.</p>
                </div>
              </div>
            </div>
          ) : (
            <Input
              className="template-custom-fields-form__secondary-input"
              value={secondaryValue}
              onChange={handleInputChange}
              placeholder={activeField ? '입력하세요' : '위에서 항목을 선택하세요'}
              disabled={!activeField}
              aria-label={activeField ? `${activeField.label} 입력` : '항목 선택 후 입력'}
            />
          )}
        </div>
      </div>
    </div>
  )
}
