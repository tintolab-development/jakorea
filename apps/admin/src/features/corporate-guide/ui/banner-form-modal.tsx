/**
 * 기업후원 안내 — 상단 배너 수정 팝업
 */

import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  BannerSaveInput,
  CorporateGuideBanner,
} from '@/entities/corporate-guide/model/types'
import {
  CmsButton,
  CmsTextArea,
  ContentModal,
  FileSelectField,
  FILE_SELECT_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  useCmsAlert,
} from '@/shared/ui'

import './banner-form-modal.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 권장 배너 사이즈는 1113*1083',
]

const MODAL_DESCRIPTION = '기업후원의 상단 배너 이미지와 문구를 설정해 주세요.'

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

type FormBodyProps = {
  initial: CorporateGuideBanner
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: BannerSaveInput) => void
}

function BannerFormBody({ initial, confirmLoading, onCancel, onSubmit }: FormBodyProps) {
  const { showAlert } = useCmsAlert()
  const [imageUrl, setImageUrl] = useState(initial.imageUrl)
  const [imageFileName, setImageFileName] = useState(initial.imageFileName ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageAssetId, setImageAssetId] = useState(initial.imageAssetId)
  const [mainText, setMainText] = useState(initial.mainText)
  const [subText, setSubText] = useState(initial.subText)
  const [errors, setErrors] = useState<{
    image?: string
    mainText?: string
    subText?: string
  }>({})

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
        setImageUrl(dataUrl)
        setImageFileName(file.name)
        setImageFile(file)
        setImageAssetId(undefined)
        setErrors(prev => ({ ...prev, image: undefined }))
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
    setImageUrl('')
    setImageFileName('')
    setImageFile(null)
    setImageAssetId(undefined)
  }, [])

  const handleSubmit = useCallback(() => {
    const nextErrors: typeof errors = {}
    if (!imageUrl.trim() && !imageFile && imageAssetId == null) {
      nextErrors.image = '배너 이미지를 등록해 주세요.'
    }
    if (!mainText.trim()) {
      nextErrors.mainText = '메인 텍스트를 입력해 주세요.'
    }
    if (!subText.trim()) {
      nextErrors.subText = '서브 텍스트를 입력해 주세요.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    onSubmit({
      imageUrl: imageUrl.trim(),
      imageFileName: imageFileName || undefined,
      imageFile,
      imageAssetId,
      mainText,
      subText,
      version: initial.version,
    })
  }, [
    imageAssetId,
    imageFile,
    imageFileName,
    imageUrl,
    initial.version,
    mainText,
    onSubmit,
    subText,
  ])

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title="상단 배너 수정"
      description={MODAL_DESCRIPTION}
      width={800}
      className="corporate-guide-banner-modal"
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
            수정
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm
        title="상단 배너 수정"
        hideHeader
        mode="edit"
        className="corporate-guide-banner-modal__form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="배너 이미지"
            required
            view={null}
            edit={
              <div>
                <div className="corporate-guide-banner-modal__image-row">
                  <div className="corporate-guide-banner-modal__preview">
                    {imageUrl ? (
                      <img src={imageUrl} alt="배너 미리보기" />
                    ) : (
                      <ImagePlaceholderIcon />
                    )}
                  </div>
                  <FileSelectField
                    className="corporate-guide-banner-modal__file-field"
                    multiple={false}
                    accept={IMAGE_ACCEPT}
                    buttonLabel="파일 추가"
                    fileNames={imageFileName ? [imageFileName] : []}
                    onFilesChange={files => {
                      void handleFilesChange(files)
                    }}
                    onRemoveFile={handleRemoveFile}
                    guideLines={IMAGE_GUIDE_LINES}
                  />
                </div>
                {errors.image ? (
                  <p className="corporate-guide-banner-modal__field-error" role="alert">
                    {errors.image}
                  </p>
                ) : null}
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="메인 텍스트"
            required
            view={null}
            edit={
              <div>
                <CmsTextArea
                  className="cms-textarea--fixed-rows"
                  inputSize="large"
                  width="100%"
                  rows={3}
                  placeholder="메인 텍스트를 입력하세요"
                  value={mainText}
                  onChange={e => {
                    setMainText(e.target.value)
                    if (e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, mainText: undefined }))
                    }
                  }}
                />
                {errors.mainText ? (
                  <p className="corporate-guide-banner-modal__field-error" role="alert">
                    {errors.mainText}
                  </p>
                ) : null}
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="서브 텍스트"
            required
            view={null}
            edit={
              <div>
                <CmsTextArea
                  className="cms-textarea--fixed-rows"
                  inputSize="large"
                  width="100%"
                  rows={4}
                  placeholder="서브 텍스트를 입력하세요"
                  value={subText}
                  onChange={e => {
                    setSubText(e.target.value)
                    if (e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, subText: undefined }))
                    }
                  }}
                />
                {errors.subText ? (
                  <p className="corporate-guide-banner-modal__field-error" role="alert">
                    {errors.subText}
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

export function BannerFormModal({
  open,
  initial,
  confirmLoading,
  onCancel,
  onSubmit,
}: {
  open: boolean
  initial: CorporateGuideBanner
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: BannerSaveInput) => void
}) {
  if (!open) return null

  return (
    <BannerFormBody
      key={`${initial.imageUrl}-${initial.mainText}`}
      initial={initial}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  )
}
