import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  CmsButton,
  CmsInput,
  CmsTextArea,
  CmsRadio,
  CmsRadioGroup,
  ContentModal,
  FileSelectField,
  FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
  ThumbnailPlaceholder,
  useCmsAlert,
} from '@/shared/ui'
import type { HeroBanner, HeroBannerCreateInput } from '@/entities/hero-banner/model/types'
import { shouldUseHeroBannerRemoteApi } from '@/features/hero-banner/api/capabilities'
import { HTTP_LINK_URL_FORMAT_ALERT, isValidHttpLinkUrl } from '@/shared/lib/http-link-url'
import './form-modal.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE_LINES = [
  '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 20MB까지 첨부할 수 있습니다.',
  '- 권장 배너 사이즈는 1920 × 968px입니다.',
]

/** Figma 20:12458 */
const MODAL_DESCRIPTION =
  '메인 화면에 노출할 배너 이미지와 텍스트를 설정해 주세요.\n텍스트는 미작성 시 해당 영역 비노출 되며, 연결 링크를 설정하면 배너 클릭 시 입력된 주소가 새 창에서 열립니다.'

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

/**
 * 메인 타이틀만 줄바꿈 허용(사용자 홈페이지에 그대로 반영) — 한 줄일 때는 다른 입력과 같은 높이(시안),
 * 줄바꿈할수록 늘어난다.
 */
const MAIN_TITLE_AUTO_SIZE = { minRows: 1, maxRows: 4 }

export type HeroBannerFormValues = HeroBannerCreateInput

type FormBodyProps = {
  mode: 'create' | 'edit'
  initial?: HeroBanner | null
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: HeroBannerFormValues) => void
}

function HeroBannerFormBody({ mode, initial, confirmLoading, onCancel, onSubmit }: FormBodyProps) {
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
    mode === 'edit' && initial ? initial.topText.replace(/\r?\n/g, ' ') : ''
  )
  const [mainTitle, setMainTitle] = useState(() =>
    mode === 'edit' && initial ? initial.mainTitle : ''
  )
  const [bottomText, setBottomText] = useState(() =>
    mode === 'edit' && initial ? initial.bottomText.replace(/\r?\n/g, ' ') : ''
  )
  const [linkUrl, setLinkUrl] = useState(() => (mode === 'edit' && initial ? initial.linkUrl : ''))
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [imageCleared, setImageCleared] = useState(false)

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedImageFile(file)) {
        showAlert({
          title: '파일 형식 오류',
          content: '등록할 수 없는 파일 형식입니다.',
        })
        return
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        setImageUrl(dataUrl)
        setImageFileName(file.name)
        setPendingImageFile(file)
        setImageCleared(false)
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
    setPendingImageFile(null)
    setImageCleared(true)
  }, [])

  const handleSubmit = useCallback(() => {
    const useRemote = shouldUseHeroBannerRemoteApi()
    const hasExistingRemoteImage =
      useRemote &&
      !imageCleared &&
      !pendingImageFile &&
      Boolean(initial?.imageAssetId) &&
      Boolean(imageUrl.trim())

    if (!imageUrl.trim() && !hasExistingRemoteImage) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (useRemote && mode === 'create' && !pendingImageFile) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (useRemote && mode === 'edit' && imageCleared && !pendingImageFile) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    const trimmedLinkUrl = linkUrl.trim()
    if (trimmedLinkUrl && !isValidHttpLinkUrl(trimmedLinkUrl)) {
      showAlert(HTTP_LINK_URL_FORMAT_ALERT)
      return
    }
    onSubmit({
      isActive,
      imageUrl,
      imageFileName: imageFileName || undefined,
      imageFile: pendingImageFile,
      imageAssetId: !pendingImageFile && !imageCleared ? initial?.imageAssetId : undefined,
      topText,
      mainTitle,
      bottomText,
      linkUrl: trimmedLinkUrl,
    })
  }, [
    imageCleared,
    imageUrl,
    imageFileName,
    initial?.imageAssetId,
    isActive,
    mode,
    pendingImageFile,
    topText,
    mainTitle,
    bottomText,
    linkUrl,
    onSubmit,
    showAlert,
  ])

  const title = mode === 'edit' ? '배너 수정' : '히어로 배너 등록'
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
              <div className="file-select-image-cell">
                <div className="file-select-image-cell__preview">
                  {imageUrl ? <img src={imageUrl} alt="배너 미리보기" /> : <ThumbnailPlaceholder />}
                </div>
                <FileSelectField
                  multiple={false}
                  accept={IMAGE_ACCEPT}
                  buttonLabel="파일 추가"
                  fileNames={imageFileName ? [imageFileName] : []}
                  maxTotalBytes={FILE_SELECT_IMAGE_MAX_TOTAL_BYTES}
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
            label="상단 텍스트"
            view={null}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                placeholder="상단 텍스트를 입력해 주세요"
                value={topText}
                onChange={e => setTopText(e.target.value.replace(/\r?\n/g, ' '))}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="메인 타이틀"
            view={null}
            edit={
              <CmsTextArea
                className="hero-banner-form-modal__main-title"
                inputSize="medium"
                width="100%"
                rows={1}
                autoSize={MAIN_TITLE_AUTO_SIZE}
                placeholder="메인 타이틀을 입력해 주세요"
                value={mainTitle}
                onChange={e => setMainTitle(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="하단 텍스트"
            view={null}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                placeholder="하단 텍스트를 입력해 주세요"
                value={bottomText}
                onChange={e => setBottomText(e.target.value.replace(/\r?\n/g, ' '))}
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
                inputSize="medium"
                width="100%"
                placeholder="연결 링크를 입력해 주세요"
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

  const formKey = mode === 'edit' ? `edit-${initial?.id ?? 'unknown'}` : `create-${String(open)}`

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
