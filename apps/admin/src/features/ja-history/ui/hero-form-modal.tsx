import { memo, useCallback, useRef, useState } from 'react'
import { Image } from 'antd'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { JaHistoryHero, JaHistoryHeroSaveInput } from '@/entities/ja-history/model/types'
import {
  CmsButton,
  CmsTextArea,
  ContentModal,
  FileSelectField,
  FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  useCmsAlert,
} from '@/shared/ui'
import { isAllowedJaHistoryImage, JA_HISTORY_IMAGE_ACCEPT, readJaHistoryImage } from './image-file'

const IMAGE_GUIDE_LINES = [
  '- 파일은 최대 20MB까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 권장 이미지 사이즈는 1920 × 1200px입니다.',
]

const DraftTextArea = memo(function DraftTextArea({
  initialValue,
  rows,
  placeholder,
  ariaLabel,
  onValue,
}: {
  initialValue: string
  rows: number
  placeholder?: string
  ariaLabel: string
  onValue: (value: string) => void
}) {
  const [value, setValue] = useState(initialValue)
  return (
    <CmsTextArea
      className="cms-textarea--fixed-rows"
      inputSize="large"
      width="100%"
      rows={rows}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={event => {
        const next = event.target.value
        setValue(next)
        onValue(next)
      }}
    />
  )
})

type Props = {
  open: boolean
  initial: JaHistoryHero
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: JaHistoryHeroSaveInput) => void
}

function HeroFormBody({
  initial,
  confirmLoading,
  onCancel,
  onSubmit,
}: Omit<Props, 'open'>) {
  const { showAlert } = useCmsAlert()
  const [imageUrl, setImageUrl] = useState(initial.image.url)
  const [imageFileName, setImageFileName] = useState(initial.image.fileName)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageAssetId, setImageAssetId] = useState<number | undefined>(initial.image.assetId)
  const eyebrowRef = useRef(initial.eyebrow)
  const mainTextRef = useRef(initial.mainText)
  const [errors, setErrors] = useState<{ image?: string; eyebrow?: string; mainText?: string }>({})

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedJaHistoryImage(file)) {
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
        const dataUrl = await readJaHistoryImage(file)
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
    [showAlert],
  )

  const handleSubmit = () => {
    const eyebrow = eyebrowRef.current
    const mainText = mainTextRef.current
    const nextErrors: typeof errors = {}
    if (!imageUrl.trim()) nextErrors.image = '히어로 이미지를 등록해 주세요.'
    if (!eyebrow.trim()) nextErrors.eyebrow = '상단 라벨을 입력해 주세요.'
    if (!mainText.trim()) nextErrors.mainText = '메인 텍스트를 입력해 주세요.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    onSubmit({
      imageUrl,
      imageFileName,
      imageFile,
      imageAssetId: imageAssetId ?? null,
      eyebrow,
      mainText,
    })
  }

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title="히어로 배너 수정"
      description="JA History의 히어로 배너 이미지와 텍스트를 설정해 주세요."
      width={800}
      className="ja-history-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="large" type="button" onClick={onCancel} disabled={confirmLoading}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={handleSubmit} >
            수정
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm title="히어로 배너 수정" hideHeader mode="edit" className="ja-history-form">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="배너 이미지"
            required
            view={null}
            edit={
              <div>
                <div className="ja-history-modal__image-row">
                  <div className="ja-history-modal__preview">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt="히어로 배너 미리보기"
                        preview={{ mask: '이미지 보기' }}
                      />
                    ) : (
                      <span>없음</span>
                    )}
                  </div>
                  <FileSelectField
                    className="ja-history-modal__file-field"
                    multiple={false}
                    accept={JA_HISTORY_IMAGE_ACCEPT}
                    buttonLabel="파일 추가"
                    fileNames={imageFileName ? [imageFileName] : []}
                    maxTotalBytes={FILE_SELECT_IMAGE_MAX_TOTAL_BYTES}
                    onFilesChange={files => {
                      void handleFilesChange(files)
                    }}
                    onRemoveFile={() => {
                      setImageUrl('')
                      setImageFileName('')
                      setImageFile(null)
                      setImageAssetId(undefined)
                    }}
                    guideLines={IMAGE_GUIDE_LINES}
                  />
                </div>
                {errors.image ? (
                  <p className="ja-history-modal__field-error" role="alert">
                    {errors.image}
                  </p>
                ) : null}
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="상단 라벨"
            required
            view={null}
            edit={
              <div>
                <DraftTextArea
                  initialValue={eyebrowRef.current}
                  rows={1}
                  placeholder="상단 라벨을 입력하세요"
                  ariaLabel="상단 라벨"
                  onValue={value => {
                    eyebrowRef.current = value
                  }}
                />
                {errors.eyebrow ? (
                  <p className="ja-history-modal__field-error" role="alert">
                    {errors.eyebrow}
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
                <DraftTextArea
                  initialValue={mainTextRef.current}
                  rows={3}
                  placeholder="메인 텍스트를 입력하세요"
                  ariaLabel="메인 텍스트"
                  onValue={value => {
                    mainTextRef.current = value
                  }}
                />
                {errors.mainText ? (
                  <p className="ja-history-modal__field-error" role="alert">
                    {errors.mainText}
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

export function HeroFormModal(props: Props) {
  if (!props.open) return null
  return <HeroFormBody {...props} />
}
