/**
 * 후원사 등록·수정 모달
 */

import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  CorporatePartner,
  CorporatePartnerCreateInput,
} from '@/entities/corporate-partner/model/types'
import {
  CmsButton,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ContentModal,
  FileSelectField,
  FILE_SELECT_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  useCmsAlert,
} from '@/shared/ui'

import './form-modal.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 권장 로고 사이즈는 300*110입니다.',
]

/** Notion / 시안 description */
const MODAL_DESCRIPTION =
  '후원사 목록으로 노출할 기업의 이름과 로고 이미지, 노출 순서를 설정해 주세요.'

function coerceRadioBoolean(raw: unknown): boolean {
  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (typeof raw === 'string') {
    const s = raw.toLowerCase()
    if (s === 'true' || s === '1') return true
    if (s === 'false' || s === '0') return false
  }
  return Boolean(raw)
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
      width="48"
      height="48"
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

export type CorporatePartnerFormValues = CorporatePartnerCreateInput

type FormBodyProps = {
  mode: 'create' | 'edit'
  initial?: CorporatePartner | null
  /** 현재 전체 후원사 수 (create: max=n+1, edit: max=n) */
  totalCount: number
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: CorporatePartnerFormValues) => void
}

function CorporatePartnerFormBody({
  mode,
  initial,
  totalCount,
  confirmLoading,
  onCancel,
  onSubmit,
}: FormBodyProps) {
  const { showAlert } = useCmsAlert()
  const maxOrder = mode === 'create' ? totalCount + 1 : Math.max(totalCount, 1)
  const defaultOrder =
    mode === 'edit' && initial ? initial.sortOrder : totalCount + 1

  const [isPublic, setIsPublic] = useState(() =>
    mode === 'edit' && initial ? initial.isPublic : true
  )
  const [logoUrl, setLogoUrl] = useState(() =>
    mode === 'edit' && initial ? initial.logoUrl : ''
  )
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined)
  const [logoFileName, setLogoFileName] = useState(() =>
    mode === 'edit' && initial ? (initial.logoFileName ?? '') : ''
  )
  const [name, setName] = useState(() =>
    mode === 'edit' && initial ? initial.name : ''
  )
  const [sortOrder, setSortOrder] = useState(() => String(defaultOrder))
  const [errors, setErrors] = useState<{
    logo?: string
    name?: string
    sortOrder?: string
  }>({})

  /** 시안: * 1부터 N 사이의 숫자를 입력하세요. */
  const sortHelper = `* 1부터 ${maxOrder} 사이의 숫자를 입력하세요.`

  /** 노출 순서 입력값 1…maxOrder 범위로 정규화 (빈 문자열은 허용 — 입력 중) */
  const normalizeSortOrderInput = useCallback(
    (raw: string, { allowEmpty }: { allowEmpty: boolean }): string => {
      const digits = raw.replace(/[^\d]/g, '')
      if (digits === '') return allowEmpty ? '' : String(defaultOrder)
      let n = Number.parseInt(digits, 10)
      if (!Number.isFinite(n)) return allowEmpty ? '' : String(defaultOrder)
      if (n < 1) {
        return allowEmpty ? '' : '1'
      }
      if (n > maxOrder) n = maxOrder
      return String(n)
    },
    [defaultOrder, maxOrder]
  )

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
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
          maxTotalBytes: FILE_SELECT_MAX_TOTAL_BYTES,
        })
      ) {
        notifyFileSelectTotalSizeExceeded()
        return
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        setLogoUrl(dataUrl)
        setLogoFile(file)
        setLogoFileName(file.name)
        setErrors(prev => ({ ...prev, logo: undefined }))
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [showAlert]
  )

  const handleRemoveFile = useCallback(() => {
    setLogoUrl('')
    setLogoFile(undefined)
    setLogoFileName('')
  }, [])

  const handleSubmit = useCallback(() => {
    const nextErrors: typeof errors = {}
    if (!logoUrl.trim()) {
      nextErrors.logo = '로고 이미지를 등록해 주세요.'
    }
    if (!name.trim()) {
      nextErrors.name = '기업명을 입력해 주세요.'
    }
    const orderNum = Math.floor(Number(sortOrder))
    if (!Number.isFinite(orderNum) || orderNum < 1 || orderNum > maxOrder) {
      nextErrors.sortOrder = `* 1부터 ${maxOrder} 사이의 숫자를 입력하세요.`
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    onSubmit({
      isPublic,
      logoUrl: logoUrl.trim(),
      logoFile,
      logoFileName: logoFileName || undefined,
      name: name.trim(),
      sortOrder: orderNum,
    })
  }, [isPublic, logoFile, logoFileName, logoUrl, maxOrder, name, onSubmit, sortOrder])

  const title = mode === 'edit' ? '후원사 수정' : '후원사 등록'
  const confirmLabel = mode === 'edit' ? '저장' : '등록'

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title={title}
      description={MODAL_DESCRIPTION}
      width={800}
      className="corporate-partner-form-modal"
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="large"
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={handleSubmit}
          >
            {confirmLabel}
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm
        title={title}
        hideHeader
        mode="edit"
        className="corporate-partner-form-modal__form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="공개 여부"
            required
            view={null}
            edit={
              <CmsRadioGroup
                size="medium"
                value={isPublic}
                onChange={e => setIsPublic(coerceRadioBoolean(e.target.value))}
              >
                <CmsRadio size="medium" value={true}>
                  공개
                </CmsRadio>
                <CmsRadio size="medium" value={false}>
                  비공개
                </CmsRadio>
              </CmsRadioGroup>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="로고 이미지"
            required
            view={null}
            edit={
              <div>
                <div className="corporate-partner-form-modal__image-row">
                  <div className="corporate-partner-form-modal__preview">
                    {logoUrl ? (
                      <img src={logoUrl} alt="로고 미리보기" />
                    ) : (
                      <ImagePlaceholderIcon />
                    )}
                  </div>
                  <FileSelectField
                    className="corporate-partner-form-modal__file-field"
                    multiple={false}
                    accept={IMAGE_ACCEPT}
                    buttonLabel="파일 추가"
                    fileNames={logoFileName ? [logoFileName] : []}
                    onFilesChange={files => {
                      void handleFilesChange(files)
                    }}
                    onRemoveFile={handleRemoveFile}
                    guideLines={IMAGE_GUIDE_LINES}
                  />
                </div>
                {errors.logo ? (
                  <p className="corporate-partner-form-modal__field-error" role="alert">
                    {errors.logo}
                  </p>
                ) : null}
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="기업명"
            required
            view={null}
            edit={
              <div>
                <CmsInput
                  inputSize="large"
                  width="100%"
                  placeholder="기업명을 입력하세요"
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    if (e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, name: undefined }))
                    }
                  }}
                />
                {errors.name ? (
                  <p className="corporate-partner-form-modal__field-error" role="alert">
                    {errors.name}
                  </p>
                ) : null}
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="노출 순서"
            required
            view={null}
            edit={
              <div>
                <div className="corporate-partner-form-modal__sort-row">
                  <CmsInput
                    inputSize="large"
                    width={160}
                    inputMode="numeric"
                    min={1}
                    max={maxOrder}
                    maxLength={String(maxOrder).length}
                    placeholder={String(defaultOrder)}
                    value={sortOrder}
                    onChange={e => {
                      setSortOrder(
                        normalizeSortOrderInput(e.target.value, { allowEmpty: true })
                      )
                      setErrors(prev => ({ ...prev, sortOrder: undefined }))
                    }}
                    onBlur={() => {
                      setSortOrder(prev =>
                        normalizeSortOrderInput(prev, { allowEmpty: false })
                      )
                    }}
                    onKeyDown={e => {
                      // 음수·소수·e 입력 차단
                      if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                        e.preventDefault()
                      }
                    }}
                  />
                  <p className="corporate-partner-form-modal__helper">{sortHelper}</p>
                </div>
                {errors.sortOrder ? (
                  <p className="corporate-partner-form-modal__field-error" role="alert">
                    {errors.sortOrder}
                  </p>
                ) : null}
              </div>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}

export function CorporatePartnerFormModal({
  open,
  mode,
  initial,
  totalCount,
  confirmLoading,
  onCancel,
  onSubmit,
}: {
  open: boolean
  mode: 'create' | 'edit'
  initial?: CorporatePartner | null
  totalCount: number
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: CorporatePartnerFormValues) => void
}) {
  if (!open) return null

  const formKey =
    mode === 'edit'
      ? `edit-${initial?.id ?? 'unknown'}`
      : `create-${totalCount}`

  return (
    <CorporatePartnerFormBody
      key={formKey}
      mode={mode}
      initial={initial}
      totalCount={totalCount}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  )
}
