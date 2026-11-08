import { memo, useCallback, useRef, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { JaHistoryPhilosophyCard } from '@/entities/ja-history/model/types'
import {
  CmsButton,
  CmsInput,
  CmsTextArea,
  ContentModal,
  FileSelectField,
  FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  useCmsAlert,
} from '@/shared/ui'
import { isAllowedJaHistoryImage, JA_HISTORY_IMAGE_ACCEPT, readJaHistoryImage } from './image-file'

const IMAGE_GUIDE_LINES = [
  '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 20MB까지 첨부할 수 있습니다.',
  '- 권장 이미지 사이즈는 354 × 480px입니다.',
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

export type PhilosophyCardFormValues = {
  title: string
  description: string
  imageUrl: string
  imageFileName: string
  imageFile?: File | null
  imageAssetId?: number | null
}

type Props = {
  open: boolean
  orderLabel: string
  initial: JaHistoryPhilosophyCard
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: PhilosophyCardFormValues) => void
}

function PhilosophyCardFormBody({
  orderLabel,
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
  const titleRef = useRef(initial.title)
  const descriptionRef = useRef(initial.description)
  const [errors, setErrors] = useState<{ image?: string; title?: string; description?: string }>({})

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedJaHistoryImage(file)) {
        showAlert({
          title: '파일 형식 오류',
          content: '등록할 수 없는 파일 형식입니다.',
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
    [showAlert]
  )

  const handleSubmit = () => {
    const title = titleRef.current
    const description = descriptionRef.current
    const nextErrors: typeof errors = {}
    if (!imageUrl.trim()) nextErrors.image = '이미지를 등록해 주세요.'
    if (!title.trim()) nextErrors.title = '타이틀을 입력해 주세요.'
    if (!description.trim()) nextErrors.description = '서브 텍스트를 입력해 주세요.'
    if (Object.keys(nextErrors).length > 0) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    onSubmit({
      title,
      description,
      imageUrl,
      imageFileName,
      imageFile,
      imageAssetId: imageAssetId ?? null,
    })
  }

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title="믿음을 키우는 교육 수정"
      description="JA History의 믿음을 키우는 교육의 이미지와 텍스트를 설정해 주세요."
      width={800}
      className="ja-history-modal"
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
            저장
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm title="믿음을 키우는 교육 수정" hideHeader mode="edit" className="ja-history-form">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="카드 순서"
            required
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                value={orderLabel}
                readOnly
                tabIndex={-1}
                aria-label="카드 순서"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="이미지"
            required
            view={null}
            edit={
              <div>
                <div className="file-select-image-cell">
                  <div className="file-select-image-cell__preview">
                    {imageUrl ? (
                      <img src={imageUrl} alt="교육 카드 미리보기" />
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
            label="타이틀"
            required
            view={null}
            edit={
              <div>
                <DraftTextArea
                  initialValue={titleRef.current}
                  rows={2}
                  placeholder="타이틀을 입력해 주세요"
                  ariaLabel="타이틀"
                  onValue={value => {
                    titleRef.current = value
                  }}
                />
                {errors.title ? (
                  <p className="ja-history-modal__field-error" role="alert">
                    {errors.title}
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
                <DraftTextArea
                  initialValue={descriptionRef.current}
                  rows={2}
                  placeholder="서브 텍스트를 입력해 주세요"
                  ariaLabel="서브 텍스트"
                  onValue={value => {
                    descriptionRef.current = value
                  }}
                />
                {errors.description ? (
                  <p className="ja-history-modal__field-error" role="alert">
                    {errors.description}
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

export function PhilosophyCardFormModal(props: Props) {
  if (!props.open) return null
  return <PhilosophyCardFormBody key={props.initial.id} {...props} />
}
