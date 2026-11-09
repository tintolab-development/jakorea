import { memo, useCallback, useRef, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  JaHistoryTimeline,
  JaHistoryTimelineSaveInput,
} from '@/entities/ja-history/model/types'
import {
  CmsButton,
  CmsRadio,
  CmsRadioGroup,
  CmsTextArea,
  ContentModal,
  FileSelectField,
  FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  useCmsAlert,
  ThumbnailPlaceholder,
} from '@/shared/ui'
import { isAllowedJaHistoryImage, JA_HISTORY_IMAGE_ACCEPT, readJaHistoryImage } from './image-file'

const IMAGE_GUIDE_LINES = [
  '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 20MB까지 첨부할 수 있습니다.',
  '- 권장 배너 사이즈는 520 × 240px입니다.',
]

const EVENTS_MAX = 8

type Props = {
  open: boolean
  title: string
  initial: JaHistoryTimeline
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: JaHistoryTimelineSaveInput) => void
}

type DraftEvent = {
  key: string
  year: string
  text: string
}

type DraftPeriod = {
  id: string
  label: string
  title: string
  events: DraftEvent[]
}

let eventKeySeq = 0

function nextEventKey(): string {
  eventKeySeq += 1
  return `timeline-event-${eventKeySeq}`
}

function draftPeriods(periods: JaHistoryTimeline['periods']): DraftPeriod[] {
  return periods.map(period => ({
    id: period.id,
    label: period.label,
    title: period.title,
    events: period.events.map(event => ({
      key: nextEventKey(),
      year: event.year,
      text: event.text,
    })),
  }))
}

function modalDescription(title: string): string {
  const sectionName = title.replace(/\s*수정$/, '')
  return `JA History의 ${sectionName}의 이미지와 텍스트를 설정해 주세요.`
}

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

function TimelineFormBody({
  title,
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
  const headingRef = useRef(initial.title)
  const bodyRef = useRef(initial.body)
  const [periods, setPeriods] = useState(() => draftPeriods(initial.periods))
  const [activeId, setActiveId] = useState(initial.periods[0]?.id ?? '')
  const [errors, setErrors] = useState<{ image?: string; title?: string; body?: string }>({})

  const active = periods.find(period => period.id === activeId) ?? periods[0]

  const patchActiveEvents = (updater: (events: DraftEvent[]) => DraftEvent[]) => {
    setPeriods(prev =>
      prev.map(period =>
        period.id === active?.id ? { ...period, events: updater(period.events) } : period
      )
    )
  }

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
    const heading = headingRef.current
    const body = bodyRef.current
    const nextErrors: typeof errors = {}
    if (!imageUrl.trim()) nextErrors.image = '대표 이미지를 등록해 주세요.'
    if (!heading.trim()) nextErrors.title = '타이틀을 입력해 주세요.'
    if (!body.trim()) nextErrors.body = '서브 텍스트를 입력해 주세요.'

    let alertMessage = ''
    let alertPeriodId = ''
    const committed = periods.map(period => {
      const events: { year: string; text: string }[] = []
      for (const event of period.events) {
        const year = event.year.trim()
        const text = event.text.trim()
        if (!year && !text) continue
        if (!year || !text) {
          if (!alertMessage) {
            alertMessage = `${period.label} 연도와 설명을 함께 입력해 주세요.`
            alertPeriodId = period.id
          }
          continue
        }
        if (events.some(item => item.year === year) && !alertMessage) {
          alertMessage = `${period.label}에 같은 연도가 있습니다.`
          alertPeriodId = period.id
        }
        events.push({ year, text: event.text.trimEnd() })
      }
      if (events.length > EVENTS_MAX && !alertMessage) {
        alertMessage = `${period.label} 연혁은 최대 ${EVENTS_MAX}건까지 저장할 수 있습니다.`
        alertPeriodId = period.id
      }
      return {
        id: period.id,
        title: period.title,
        events,
      }
    })

    if (Object.keys(nextErrors).length > 0) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (alertMessage) {
      if (alertPeriodId) setActiveId(alertPeriodId)
      if (alertMessage.includes('함께 입력')) {
        showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      } else {
        showAlert({ title: '입력 확인', content: alertMessage })
      }
      return
    }
    onSubmit({
      imageUrl,
      imageFileName,
      imageFile,
      imageAssetId: imageAssetId ?? null,
      title: heading,
      body,
      periods: committed,
    })
  }

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title={title}
      description={modalDescription(title)}
      width={800}
      className="ja-history-modal ja-history-timeline-modal"
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
            수정
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm title={title} hideHeader mode="edit" className="ja-history-form">
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
                      <img src={imageUrl} alt="대표 이미지 미리보기" />
                    ) : (
                      <ThumbnailPlaceholder />
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
                  initialValue={headingRef.current}
                  rows={2}
                  placeholder="타이틀을 입력해 주세요"
                  ariaLabel="타이틀"
                  onValue={value => {
                    headingRef.current = value
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
                  initialValue={bodyRef.current}
                  rows={4}
                  placeholder="서브 텍스트를 입력해 주세요"
                  ariaLabel="서브 텍스트"
                  onValue={value => {
                    bodyRef.current = value
                  }}
                />
                {errors.body ? (
                  <p className="ja-history-modal__field-error" role="alert">
                    {errors.body}
                  </p>
                ) : null}
              </div>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="연혁" hideHeader mode="edit" className="ja-history-form">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="연혁"
            required
            view={null}
            edit={
              <CmsRadioGroup
                size="medium"
                value={active?.id ?? ''}
                onChange={event => setActiveId(String(event.target.value))}
                aria-label="연혁 기간"
              >
                {periods.map(period => (
                  <CmsRadio key={period.id} size="medium" value={period.id}>
                    {period.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
            }
          />
        </DetailInfoForm.Row>
        {(active?.events ?? []).map(event => (
          <DetailInfoForm.Row type="single" key={event.key}>
            <DetailInfoForm.Field
              label={event.year.trim() || '연도'}
              required
              view={null}
              edit={
                <DraftTextArea
                  initialValue={event.text}
                  rows={event.text.includes('\n') || event.text.length > 42 ? 2 : 1}
                  placeholder="설명 텍스트를 입력해 주세요"
                  ariaLabel={`${event.year.trim() || '연도'} 설명 텍스트`}
                  onValue={text => {
                    patchActiveEvents(events =>
                      events.map(item => (item.key === event.key ? { ...item, text } : item))
                    )
                  }}
                />
              }
            />
          </DetailInfoForm.Row>
        ))}
      </DetailInfoForm>
    </ContentModal>
  )
}

export function TimelineFormModal(props: Props) {
  if (!props.open) return null
  return <TimelineFormBody {...props} />
}
