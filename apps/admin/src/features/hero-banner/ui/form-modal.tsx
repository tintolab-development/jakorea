import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import {
  CmsButton,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ContentModal,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'
import type { HeroBanner, HeroBannerCreateInput } from '@/entities/hero-banner/model/types'
import './form-modal.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 권장 배너 사이즈는 1920*1080입니다.',
]

const MODAL_DESCRIPTION =
  '메인 화면에 노출할 배너 이미지와 문구를 선정해 주세요. 문구는 미작성 시 해당 영역 비노출 되며, 연결 링크를 설정하면 배너 클릭 시 입력된 주소가 새 창에서 열립니다.'

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

export type HeroBannerFormValues = HeroBannerCreateInput

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
  mode: 'create' | 'edit'
  initial?: HeroBanner | null
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: HeroBannerFormValues) => void
}

function HeroBannerFormBody({
  mode,
  initial,
  confirmLoading,
  onCancel,
  onSubmit,
}: FormBodyProps) {
  const { showAlert } = useCmsAlert()
  const [isActive, setIsActive] = useState(() =>
    mode === 'edit' && initial ? initial.isActive : true
  )
  const [imageUrl, setImageUrl] = useState(() =>
    mode === 'edit' && initial ? initial.imageUrl : ''
  )
  const [imageFileName, setImageFileName] = useState(() =>
    mode === 'edit' && initial ? (initial.imageFileName ?? '') : ''
  )
  const [topText, setTopText] = useState(() =>
    mode === 'edit' && initial ? initial.topText : ''
  )
  const [mainTitle, setMainTitle] = useState(() =>
    mode === 'edit' && initial ? initial.mainTitle : ''
  )
  const [bottomText, setBottomText] = useState(() =>
    mode === 'edit' && initial ? initial.bottomText : ''
  )
  const [linkUrl, setLinkUrl] = useState(() =>
    mode === 'edit' && initial ? initial.linkUrl : ''
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
      try {
        const dataUrl = await readFileAsDataUrl(file)
        setImageUrl(dataUrl)
        setImageFileName(file.name)
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
  }, [])

  const handleSubmit = useCallback(() => {
    if (!imageUrl.trim()) {
      showAlert({
        title: '배너 이미지 필수',
        content: '배너 이미지를 등록해 주세요.',
      })
      return
    }
    onSubmit({
      isActive,
      imageUrl,
      imageFileName: imageFileName || undefined,
      topText,
      mainTitle,
      bottomText,
      linkUrl,
    })
  }, [
    imageUrl,
    imageFileName,
    isActive,
    topText,
    mainTitle,
    bottomText,
    linkUrl,
    onSubmit,
    showAlert,
  ])

  const title = mode === 'edit' ? '배너 수정' : '배너 등록'
  const confirmLabel = mode === 'edit' ? '배너 수정' : '배너 등록'

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title={title}
      description={MODAL_DESCRIPTION}
      width={800}
      className="hero-banner-form-modal"
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
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
      <DetailInfoForm title={title} hideHeader mode="edit" className="hero-banner-form-modal__form">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="사용 여부"
            required
            view={null}
            edit={
              <CmsRadioGroup
                size="medium"
                value={isActive}
                onChange={e => setIsActive(coerceRadioBoolean(e.target.value))}
              >
                <CmsRadio size="medium" value={true}>
                  사용
                </CmsRadio>
                <CmsRadio size="medium" value={false}>
                  미사용
                </CmsRadio>
              </CmsRadioGroup>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="배너 이미지"
            required
            view={null}
            edit={
              <div className="hero-banner-form-modal__image-row">
                <div className="hero-banner-form-modal__preview">
                  {imageUrl ? (
                    <img src={imageUrl} alt="배너 미리보기" />
                  ) : (
                    <ImagePlaceholderIcon />
                  )}
                </div>
                <FileSelectField
                  className="hero-banner-form-modal__file-field"
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
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="상단 문구"
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                placeholder="상단 문구를 입력하세요"
                value={topText}
                onChange={e => setTopText(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="메인 타이틀"
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                placeholder="메인 타이틀을 입력하세요"
                value={mainTitle}
                onChange={e => setMainTitle(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="하단 문구"
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                placeholder="하단 문구를 입력하세요"
                value={bottomText}
                onChange={e => setBottomText(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="연결 링크"
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                placeholder="연결 링크를 입력하세요"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}

export function HeroBannerFormModal({
  open,
  mode,
  initial,
  confirmLoading,
  onCancel,
  onSubmit,
}: {
  open: boolean
  mode: 'create' | 'edit'
  initial?: HeroBanner | null
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: HeroBannerFormValues) => void
}) {
  if (!open) return null

  const formKey =
    mode === 'edit' ? `edit-${initial?.id ?? 'unknown'}` : `create-${String(open)}`

  return (
    <HeroBannerFormBody
      key={formKey}
      mode={mode}
      initial={initial}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  )
}
