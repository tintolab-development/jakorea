import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Checkbox, Input, message } from 'antd'
import type { FileUploadResult } from '@/entities/application/api/file-upload-service'
import { fileUploadService } from '@/entities/application/api/file-upload-service'
import templateCertificateBg from '@/assets/images/template/templatge-background.png'
import templateEducation from '@/assets/images/template/template-education.png'
import templateLogo from '@/assets/images/template/template-logo.png'
import templateStamp from '@/assets/images/template/template-stamp.png'
import { TemplateCustomFieldImageUpload } from '@/shared/components/template/template-custom-field-image-upload'
import './template-custom-fields-form.css'
import '@/shared/components/template/template-fullpage-modal.css'

/** 파일 업로드·썸네일 UI를 쓰는 필드 (기관 로고·수료증 배경·회장 직인 등) */
const IMAGE_UPLOAD_FIELD_NAMES = new Set([
  'orgLogo',
  'orgLogo02',
  'certificateBackground',
  'chairmanSeal',
])

/** 미리보기·다른 영역과 필드 매핑 시 사용 (기관 로고 2) */
export const TEMPLATE_FIELD_ORG_LOGO_02 = 'orgLogo02' as const
/** 수료증 배경 — 좌측 캔버스 배경 이미지 */
export const TEMPLATE_FIELD_CERTIFICATE_BACKGROUND = 'certificateBackground' as const
/** 회장 직인 — 좌측 직인 이미지 */
export const TEMPLATE_FIELD_CHAIRMAN_SEAL = 'chairmanSeal' as const
const MAX_LOGO_FILE_BYTES = 15 * 1024 * 1024
const LOGO_ACCEPT = 'image/jpeg,image/png,.jpg,.jpeg,.png'

/** 업로드 전 우측 썸네일에 보여줄 기본 에셋(좌측 수료증과 동일 소스) */
const DEFAULT_FIELD_THUMB_SRC: Partial<Record<string, string>> = {
  orgLogo: templateLogo,
  orgLogo02: templateEducation,
  certificateBackground: templateCertificateBg,
  chairmanSeal: templateStamp,
}

export interface TemplateCustomFieldDef {
  name: string
  label: string
}

function isImageUploadField(field: TemplateCustomFieldDef | null): boolean {
  return field !== null && IMAGE_UPLOAD_FIELD_NAMES.has(field.name)
}

const MULTILINE_TEXT_FIELD_NAMES = new Set(['bodyContent'])

/** 참여자 정보 캔버스 행 라벨(순서 = `participantInfo` 줄·체크박스 인덱스와 동일) */
export const PARTICIPANT_INFO_ROW_LABELS = [
  '성명',
  '생년월일',
  '소속',
  '프로그램명',
  '활동기간',
  '발급목적',
] as const

export const PARTICIPANT_INFO_ROW_COUNT = PARTICIPANT_INFO_ROW_LABELS.length

export function createDefaultParticipantRowVisibility(): boolean[] {
  return Array.from({ length: PARTICIPANT_INFO_ROW_COUNT }, () => true)
}

/** 미리보기 기본값 — 배열 참조 고정 */
export const DEFAULT_PARTICIPANT_ROW_VISIBILITY: boolean[] = createDefaultParticipantRowVisibility()

/** 타이틀명(titleName) — 한글 기준 최대 글자 수(유니코드 스칼라 단위) */
export const TEMPLATE_FIELD_TITLE_NAME_MAX_LENGTH = 9

function sliceTitleNameToMax(value: string): string {
  return [...value].slice(0, TEMPLATE_FIELD_TITLE_NAME_MAX_LENGTH).join('')
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

/** 텍스트 편집 인풋 기본값 — 좌측 미리보기 예시와 동일한 카피(이미지 필드는 썸네일 기본 에셋 사용) */
export const DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES: Record<string, string> = {
  titleName: '봉사활동인증서',
  bodyContent: '귀하는 위의 과정에 참여하여\n교육과정을 수료하였음을 확인합니다.',
  chairmanName: '이은형',
  orgAddress: '서울특별시 강서구 마곡중앙로 171 714호',
  orgPhone: 'Tel.02-783-2367',
  orgFax: 'Fax.070-4275-5115',
  orgWebsite: 'http://www.jakorea.org',
  participantInfo:
    '홍길동\n1990.01.01\nOO고등학교\nJA 직업캠프\n2025.01.01 ~ 2025.12.31\n기관 및 학교 제출용',
}

export interface TemplateCustomFieldsFormProps {
  fields?: TemplateCustomFieldDef[]
  /** 하단 텍스트 필드 초기값(필드 name → 문자열) — 모달 재오픈 시 `key`로 폼 리마운트와 함께 쓰면 안전 */
  initialStringValues?: Record<string, string>
  /** 상위에서 선택된 필드 name — 좌측 캔버스 닷 클릭 등과 동기화 */
  selectedFieldName?: string | null
  onFieldClick?: (field: TemplateCustomFieldDef) => void
  /** 하단 인풋 값 변경 (선택된 필드 기준) */
  onSecondaryValueChange?: (field: TemplateCustomFieldDef, value: string) => void
  /** 유효한 파일 선택 직후(업로드 전) — 상위 미리보기용. 업로드 실패 시 `null`로 초기화 */
  onLogoFileSelected?: (fieldName: string, file: File | null) => void
  /** 로고 업로드 성공 후 서버(모의) 응답 — 저장·연동용 */
  onLogoUploadResult?: (fieldName: string, result: FileUploadResult) => void
  /** 참여자 정보 — 행별 표시 여부(캔버스와 동기화). 길이는 `PARTICIPANT_INFO_ROW_COUNT` */
  participantRowVisibility?: boolean[]
  onParticipantRowVisibilityChange?: (index: number, checked: boolean) => void
}

export function TemplateCustomFieldsForm({
  fields = DEFAULT_CUSTOM_FIELDS,
  initialStringValues,
  selectedFieldName,
  onFieldClick,
  onSecondaryValueChange,
  onLogoFileSelected,
  onLogoUploadResult,
  participantRowVisibility,
  onParticipantRowVisibilityChange,
}: TemplateCustomFieldsFormProps) {
  const [activeField, setActiveField] = useState<TemplateCustomFieldDef | null>(() => {
    if (selectedFieldName === undefined || selectedFieldName === null || selectedFieldName === '')
      return null
    return fields.find(f => f.name === selectedFieldName) ?? null
  })

  useEffect(() => {
    if (selectedFieldName === undefined) return
    const next =
      selectedFieldName === null || selectedFieldName === ''
        ? null
        : fields.find(f => f.name === selectedFieldName) ?? null
    setActiveField(next)
  }, [selectedFieldName, fields])
  const [valuesByField, setValuesByField] = useState<Record<string, string>>(() => {
    const merged = {
      ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
      ...initialStringValues,
    }
    merged.titleName = sliceTitleNameToMax(merged.titleName ?? '')
    return merged
  })
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
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!activeField) return
      let value = e.target.value
      if (activeField.name === 'titleName') {
        value = sliceTitleNameToMax(value)
      }
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
      if (!file || !field || !isImageUploadField(field)) {
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

      /* 업로드 전에 blob URL로 즉시 미리보기(우측 썸네일·상위 좌측 캔버스). 업로드 실패 시 해제 */
      const previewUrl = URL.createObjectURL(file)
      setLogoPreviewUrlByField(prev => {
        const prevUrl = prev[fieldName]
        if (prevUrl) URL.revokeObjectURL(prevUrl)
        return { ...prev, [fieldName]: previewUrl }
      })
      onLogoFileSelected?.(fieldName, file)

      setLogoUploading(true)
      try {
        const result = await fileUploadService.upload(file, 'image')
        onLogoUploadResult?.(fieldName, result)
        setValuesByField(prev => ({ ...prev, [fieldName]: result.url }))
        onSecondaryValueChange?.(field, result.url)
        message.success(`${field.label} 이미지가 등록되었습니다.`)
      } catch {
        setLogoPreviewUrlByField(prev => {
          const u = prev[fieldName]
          if (u) URL.revokeObjectURL(u)
          const next = { ...prev }
          delete next[fieldName]
          return next
        })
        onLogoFileSelected?.(fieldName, null)
        message.error('파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      } finally {
        setLogoUploading(false)
        input.value = ''
      }
    },
    [activeField, onSecondaryValueChange, onLogoFileSelected, onLogoUploadResult]
  )

  const activeLogoPreviewUrl =
    activeField && isImageUploadField(activeField) ? logoPreviewUrlByField[activeField.name] : undefined

  const activeThumbSrc =
    activeField && isImageUploadField(activeField)
      ? (activeLogoPreviewUrl ?? DEFAULT_FIELD_THUMB_SRC[activeField.name])
      : undefined

  const participantVisibilityResolved =
    participantRowVisibility && participantRowVisibility.length === PARTICIPANT_INFO_ROW_COUNT
      ? participantRowVisibility
      : createDefaultParticipantRowVisibility()

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
          {activeField && isImageUploadField(activeField) ? (
            <TemplateCustomFieldImageUpload
              fieldLabel={activeField.label}
              thumbSrc={activeThumbSrc}
              uploading={logoUploading}
              fileInputRef={logoFileInputRef}
              accept={LOGO_ACCEPT}
              onFileChange={handleLogoFileChange}
            />
          ) : activeField?.name === 'participantInfo' ? (
            <div
              className="template-custom-fields-form__participant-checklist"
              role="group"
              aria-label="참여자 정보 항목 표시"
            >
              {PARTICIPANT_INFO_ROW_LABELS.map((rowLabel, index) => (
                <label
                  key={rowLabel}
                  className="template-custom-fields-form__participant-check-row"
                >
                  <Checkbox
                    className="template-custom-fields-form__participant-checkbox"
                    checked={participantVisibilityResolved[index]}
                    onChange={e => {
                      onParticipantRowVisibilityChange?.(index, e.target.checked)
                    }}
                  />
                  <span className="template-custom-fields-form__participant-check-label">{rowLabel}</span>
                </label>
              ))}
            </div>
          ) : activeField && MULTILINE_TEXT_FIELD_NAMES.has(activeField.name) ? (
            <Input.TextArea
              className="template-custom-fields-form__secondary-textarea"
              value={secondaryValue}
              onChange={handleInputChange}
              placeholder={activeField ? '입력하세요' : '위에서 항목을 선택하세요'}
              disabled={!activeField}
              aria-label={activeField ? `${activeField.label} 입력` : '항목 선택 후 입력'}
              autoSize={{
                minRows: 3,
                maxRows: 16,
              }}
            />
          ) : (
            <Input
              className="template-custom-fields-form__secondary-input"
              value={secondaryValue}
              onChange={handleInputChange}
              placeholder={activeField ? '입력하세요' : '위에서 항목을 선택하세요'}
              disabled={!activeField}
              aria-label={activeField ? `${activeField.label} 입력` : '항목 선택 후 입력'}
              maxLength={
                activeField?.name === 'titleName' ? TEMPLATE_FIELD_TITLE_NAME_MAX_LENGTH : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
