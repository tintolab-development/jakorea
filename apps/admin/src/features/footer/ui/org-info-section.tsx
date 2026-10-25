/**
 * 푸터 — 기관 정보
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { FooterOrgInfo, FooterOrgInfoSaveInput } from '@/entities/footer/model/types'
import { useFooterOrgInfo, useSaveFooterOrgInfo } from '@/features/footer/api/hooks'
import {
  CmsButton,
  CmsInput,
  FileSelectField,
  FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  PageContentLoading,
  useCmsAlert,
} from '@/shared/ui'

import './org-info-section.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE_LINES = [
  '- 파일은 최대 20MB까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 권장 로고 사이즈는 195 × 60px입니다.',
]

function fieldClass(isEditing: boolean) {
  return [
    'footer-org-inline-field',
    isEditing ? 'footer-org-inline-field--edit' : 'footer-org-inline-field--readonly',
  ].join(' ')
}

type OrgTextKey =
  | 'name'
  | 'address'
  | 'zipCode'
  | 'representative'
  | 'businessNumber'
  | 'phone'
  | 'fax'
  | 'email'

type OrgTextDraft = Record<OrgTextKey, string>

function pickOrgText(source: FooterOrgInfoSaveInput): OrgTextDraft {
  return {
    name: source.name,
    address: source.address,
    zipCode: source.zipCode,
    representative: source.representative,
    businessNumber: source.businessNumber,
    phone: source.phone,
    fax: source.fax,
    email: source.email,
  }
}

const OrgInlineField = memo(function OrgInlineField({
  sourceValue,
  isEditing,
  resetKey,
  onDraftChange,
}: {
  sourceValue: string
  isEditing: boolean
  resetKey: number
  onDraftChange: (value: string) => void
}) {
  const [localValue, setLocalValue] = useState(sourceValue)

  useEffect(() => {
    if (isEditing) return
    setLocalValue(sourceValue)
  }, [isEditing, resetKey, sourceValue])

  return (
    <CmsInput
      className={fieldClass(isEditing)}
      inputSize="medium"
      width="100%"
      value={localValue}
      readOnly={!isEditing}
      tabIndex={isEditing ? 0 : -1}
      onChange={e => {
        if (!isEditing) return
        const next = e.target.value
        setLocalValue(next)
        onDraftChange(next)
      }}
    />
  )
})

function cloneOrg(data: FooterOrgInfo): FooterOrgInfoSaveInput {
  return {
    name: data.name,
    address: data.address,
    zipCode: data.zipCode,
    representative: data.representative,
    businessNumber: data.businessNumber,
    phone: data.phone,
    fax: data.fax,
    email: data.email,
    organizationDescription: data.organizationDescription,
    logoUrl: data.logoUrl,
    logoFileName: data.logoFileName,
    logoAssetId: data.logoAssetId,
    logoFile: null,
  }
}

function isAllowedImageFile(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/jpeg' || type === 'image/png') return true
  const name = file.name.toLowerCase()
  return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function ImagePlaceholderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <rect x="6" y="10" width="36" height="28" rx="3" stroke="#BDBDBD" strokeWidth="2" />
      <circle cx="17" cy="20" r="3" fill="#BDBDBD" />
      <path
        d="M8 32L18 24L24 29L32 20L40 32"
        stroke="#BDBDBD"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FooterOrgInfoSection() {
  const { showAlert } = useCmsAlert()
  const query = useFooterOrgInfo()
  const saveMutation = useSaveFooterOrgInfo()
  const data = query.data

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<FooterOrgInfoSaveInput | null>(null)
  const [textResetKey, setTextResetKey] = useState(0)
  const textDraftRef = useRef<OrgTextDraft | null>(null)

  const syncTextDraft = useCallback((source: FooterOrgInfoSaveInput) => {
    textDraftRef.current = pickOrgText(source)
  }, [])

  useEffect(() => {
    if (!isEditing && data) {
      const next = cloneOrg(data)
      setDraft(next)
      syncTextDraft(next)
    }
  }, [data, isEditing, syncTextDraft])

  const handleEdit = useCallback(() => {
    if (data) {
      const next = cloneOrg(data)
      setDraft(next)
      syncTextDraft(next)
    }
    setIsEditing(true)
  }, [data, syncTextDraft])

  const handleCancel = useCallback(() => {
    if (data) {
      const next = cloneOrg(data)
      setDraft(next)
      syncTextDraft(next)
    }
    setIsEditing(false)
    setTextResetKey(key => key + 1)
  }, [data, syncTextDraft])

  const handleTextDraftChange = useCallback((field: OrgTextKey, value: string) => {
    if (!textDraftRef.current) return
    textDraftRef.current = { ...textDraftRef.current, [field]: value }
  }, [])

  const handleNameChange = useCallback(
    (value: string) => handleTextDraftChange('name', value),
    [handleTextDraftChange]
  )
  const handleAddressChange = useCallback(
    (value: string) => handleTextDraftChange('address', value),
    [handleTextDraftChange]
  )
  const handleZipCodeChange = useCallback(
    (value: string) => handleTextDraftChange('zipCode', value),
    [handleTextDraftChange]
  )
  const handleRepresentativeChange = useCallback(
    (value: string) => handleTextDraftChange('representative', value),
    [handleTextDraftChange]
  )
  const handleBusinessNumberChange = useCallback(
    (value: string) => handleTextDraftChange('businessNumber', value),
    [handleTextDraftChange]
  )
  const handlePhoneChange = useCallback(
    (value: string) => handleTextDraftChange('phone', value),
    [handleTextDraftChange]
  )
  const handleFaxChange = useCallback(
    (value: string) => handleTextDraftChange('fax', value),
    [handleTextDraftChange]
  )
  const handleEmailChange = useCallback(
    (value: string) => handleTextDraftChange('email', value),
    [handleTextDraftChange]
  )

  const handleSave = useCallback(async () => {
    const text = textDraftRef.current
    if (!draft || !text) return
    if (!text.name.trim()) {
      showAlert({ title: '입력 확인', content: '기관명을 입력해 주세요.' })
      return
    }
    if (!text.email.trim()) {
      showAlert({ title: '입력 확인', content: '이메일을 입력해 주세요.' })
      return
    }
    try {
      await saveMutation.mutateAsync({ ...draft, ...text })
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '기관 정보 저장에 실패했습니다. 다시 시도해 주세요.',
      })
      void query.refetch()
    }
  }, [draft, query, saveMutation, showAlert])

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file || !draft) return
      if (!isAllowedImageFile(file)) {
        showAlert({
          title: '파일 형식 오류',
          content: 'JPG, PNG 형식의 이미지만 등록할 수 있습니다.',
        })
        return
      }
      if (
        isFileSelectTotalSizeExceeded({
          incoming: [file],
          maxTotalBytes: FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
        })
      ) {
        notifyFileSelectTotalSizeExceeded(FILE_SELECT_IMAGE_MAX_TOTAL_BYTES)
        return
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        setDraft(prev =>
          prev
            ? {
                ...prev,
                logoUrl: dataUrl,
                logoFileName: file.name,
                logoFile: file,
                logoAssetId: undefined,
              }
            : prev
        )
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [draft, showAlert]
  )

  if (query.isLoading || !draft) {
    return (
      <section className="footer-org-section footer-org-section--loading">
        <PageContentLoading variant="default" />
      </section>
    )
  }

  if (!data) {
    return (
      <section className="footer-org-section page-content-error" role="alert">
        콘텐츠를 불러오지 못했습니다.
      </section>
    )
  }

  return (
    <section
      className={
        isEditing
          ? 'footer-org-section footer-org-section--editing'
          : 'footer-org-section'
      }
    >
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">기관 정보</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                type="button"
                loading={saveMutation.isPending}
                onClick={() => {
                  void handleSave()
                }}
              >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="large" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <div className="footer-org-section__body">
        <DetailInfoForm
          className="footer-org-section__form"
          title="기관 정보"
          hideHeader
          mode="edit"
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="기관명"
              view={null}
              edit={
                <OrgInlineField
                  sourceValue={data.name}
                  isEditing={isEditing}
                  resetKey={textResetKey}
                  onDraftChange={handleNameChange}
                />
              }
            />
            <DetailInfoForm.Field
              label="기관 소재지"
              view={null}
              edit={
                <OrgInlineField
                  sourceValue={data.address}
                  isEditing={isEditing}
                  resetKey={textResetKey}
                  onDraftChange={handleAddressChange}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="우편번호"
              view={null}
              edit={
                <OrgInlineField
                  sourceValue={data.zipCode}
                  isEditing={isEditing}
                  resetKey={textResetKey}
                  onDraftChange={handleZipCodeChange}
                />
              }
            />
            <DetailInfoForm.Field
              label="대표"
              view={null}
              edit={
                <OrgInlineField
                  sourceValue={data.representative}
                  isEditing={isEditing}
                  resetKey={textResetKey}
                  onDraftChange={handleRepresentativeChange}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="사업자번호"
              view={null}
              edit={
                <OrgInlineField
                  sourceValue={data.businessNumber}
                  isEditing={isEditing}
                  resetKey={textResetKey}
                  onDraftChange={handleBusinessNumberChange}
                />
              }
            />
            <DetailInfoForm.Field
              label="대표전화"
              view={null}
              edit={
                <OrgInlineField
                  sourceValue={data.phone}
                  isEditing={isEditing}
                  resetKey={textResetKey}
                  onDraftChange={handlePhoneChange}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="팩스"
              view={null}
              edit={
                <OrgInlineField
                  sourceValue={data.fax}
                  isEditing={isEditing}
                  resetKey={textResetKey}
                  onDraftChange={handleFaxChange}
                />
              }
            />
            <DetailInfoForm.Field
              label="이메일"
              view={null}
              edit={
                <OrgInlineField
                  sourceValue={data.email}
                  isEditing={isEditing}
                  resetKey={textResetKey}
                  onDraftChange={handleEmailChange}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="로고 이미지"
              view={null}
              edit={
                isEditing ? (
                  <div className="footer-org-section__image-row">
                    <div className="footer-org-section__preview">
                      {draft.logoUrl ? (
                        <img src={draft.logoUrl} alt="로고 미리보기" />
                      ) : (
                        <ImagePlaceholderIcon />
                      )}
                    </div>
                    <FileSelectField
                      className="footer-org-section__file-field"
                      multiple={false}
                      accept={IMAGE_ACCEPT}
                      buttonLabel="파일 추가"
                      fileNames={draft.logoFileName ? [draft.logoFileName] : []}
                      maxTotalBytes={FILE_SELECT_IMAGE_MAX_TOTAL_BYTES}
                      guideLines={IMAGE_GUIDE_LINES}
                      onFilesChange={files => {
                        void handleFilesChange(files)
                      }}
                      onRemoveFile={() =>
                        setDraft(prev =>
                          prev
                            ? {
                                ...prev,
                                logoUrl: '',
                                logoFileName: undefined,
                                logoFile: null,
                                logoAssetId: undefined,
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                ) : (
                  <div className="footer-org-section__logo-view">
                    {draft.logoUrl ? (
                      <img src={draft.logoUrl} alt="기관 로고" />
                    ) : (
                      <span className="footer-org-section__logo-empty">-</span>
                    )}
                  </div>
                )
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </section>
  )
}
