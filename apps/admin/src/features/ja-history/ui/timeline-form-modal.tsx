import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { Image } from 'antd'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  JaHistoryTimeline,
  JaHistoryTimelineSaveInput,
} from '@/entities/ja-history/model/types'
import {
  CmsButton,
  CmsInput,
  CmsTextArea,
  CmsTextTabs,
  ContentModal,
  FileSelectField,
  FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  useCmsAlert,
} from '@/shared/ui'
import { isAllowedJaHistoryImage, JA_HISTORY_IMAGE_ACCEPT, readJaHistoryImage } from './image-file'

/** API `periods[].events` maxItems */
const EVENT_SLOT_COUNT = 3

const IMAGE_GUIDE_LINES = [
  '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 20MB까지 첨부할 수 있습니다.',
  '- 권장 이미지 사이즈는 520 × 240px입니다.',
]

type Props = {
  open: boolean
  title: string
  initial: JaHistoryTimeline
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: JaHistoryTimelineSaveInput) => void
}

type DraftEvent = {
  year: string
  text: string
  /** 시드에 연도가 있으면 연도 칸은 고정 텍스트다. */
  yearLocked: boolean
}

type DraftPeriod = {
  id: string
  label: string
  title: string
  events: DraftEvent[]
}

type DraftEventRow = DraftEvent & { index: number }

function draftPeriods(periods: JaHistoryTimeline['periods']): DraftPeriod[] {
  return periods.map(period => ({
    id: period.id,
    label: period.label,
    title: period.title,
    events: Array.from({ length: EVENT_SLOT_COUNT }, (_, index) => {
      const event = period.events[index]
      const year = event?.year ?? ''
      return {
        year,
        text: event?.text ?? '',
        yearLocked: year.trim().length > 0,
      }
    }),
  }))
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

const DraftYearInput = memo(function DraftYearInput({
  initialValue,
  ariaLabel,
  onValue,
}: {
  initialValue: string
  ariaLabel: string
  onValue: (value: string) => void
}) {
  const [value, setValue] = useState(initialValue)
  return (
    <CmsInput
      className="ja-history-modal__year-input"
      inputSize="medium"
      width="100%"
      value={value}
      placeholder="연도"
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
  const periodsRef = useRef(draftPeriods(initial.periods))
  const [activeId, setActiveId] = useState(initial.periods[0]?.id ?? '')
  const [errors, setErrors] = useState<{ image?: string; title?: string; body?: string }>({})

  const active = periodsRef.current.find(period => period.id === activeId) ?? periodsRef.current[0]

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

  const columns = useMemo<ColumnsType<DraftEventRow>>(() => {
    const periodId = active?.id ?? ''
    const periodLabel = active?.label ?? ''
    return [
      {
        title: '연도',
        dataIndex: 'year',
        width: 200,
        align: 'center',
        render: (_value, record) =>
          record.yearLocked ? (
            record.year
          ) : (
            <DraftYearInput
              initialValue={record.year}
              ariaLabel={`${periodLabel} ${record.index + 1}행 연도`}
              onValue={year => {
                const event = periodsRef.current.find(item => item.id === periodId)?.events[
                  record.index
                ]
                if (event) event.year = year
              }}
            />
          ),
      },
      {
        title: '설명 텍스트',
        key: 'text',
        ellipsis: false,
        render: (_value, record) => (
          <DraftTextArea
            initialValue={record.text}
            rows={2}
            placeholder="설명 텍스트를 입력해 주세요"
            ariaLabel={`${record.year || periodLabel} 설명 텍스트`}
            onValue={text => {
              const event = periodsRef.current.find(item => item.id === periodId)?.events[
                record.index
              ]
              if (event) event.text = text
            }}
          />
        ),
      },
    ]
  }, [active?.id, active?.label])

  const eventRows = useMemo<DraftEventRow[]>(
    () => (active ? active.events.map((event, index) => ({ ...event, index })) : []),
    [active]
  )

  const handleSubmit = () => {
    const heading = headingRef.current
    const body = bodyRef.current
    const periods = periodsRef.current
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
        if (!/^\d{4}$/.test(year)) {
          if (!alertMessage) {
            alertMessage = `${period.label} 연도는 4자리로 입력해 주세요.`
            alertPeriodId = period.id
          }
          continue
        }
        events.push({ year, text: event.text.trimEnd() })
      }
      if (events.length > 0 && !period.title.trim() && !alertMessage) {
        alertMessage = `${period.label} 제목을 입력해 주세요.`
        alertPeriodId = period.id
      }
      return {
        id: period.id,
        title: period.title.trimEnd(),
        events,
      }
    })

    if (Object.keys(nextErrors).length > 0 || alertMessage) {
      setErrors(nextErrors)
      if (alertPeriodId) setActiveId(alertPeriodId)
      if (alertMessage) {
        showAlert(
          /4자리/.test(alertMessage)
            ? { title: '입력 확인', content: alertMessage }
            : REQUIRED_FIELDS_INCOMPLETE_ALERT
        )
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
      description="대표 이미지, 제목, 본문과 기간별 연혁 문구를 수정해 주세요. 기간 라벨은 고정이고, 내용이 없는 행도 연도와 설명을 입력할 수 있습니다."
      size="large"
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
            수정
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm title={title} hideHeader mode="edit" className="ja-history-form">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="대표 이미지"
            required
            view={null}
            edit={
              <div>
                <div className="ja-history-modal__image-row">
                  <div className="ja-history-modal__preview">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt="대표 이미지 미리보기"
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
                  rows={3}
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

      <div className="ja-history-modal__periods">
        <CmsTextTabs
          variant="list"
          ariaLabel="연혁 기간"
          activeKey={active?.id ?? ''}
          onChange={setActiveId}
          items={periodsRef.current.map(period => ({ key: period.id, label: period.label }))}
          wrap
        />

        {active ? (
          <div className="ja-history-timeline-period-panel">
            <DetailInfoForm title="기간 제목" hideHeader mode="edit" className="ja-history-form">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="기간 제목"
                  view={null}
                  edit={
                    <DraftTextArea
                      key={active.id}
                      initialValue={active.title}
                      rows={2}
                      placeholder="기간 제목을 입력해 주세요"
                      ariaLabel={`${active.label} 제목`}
                      onValue={nextTitle => {
                        const period = periodsRef.current.find(item => item.id === active.id)
                        if (period) period.title = nextTitle
                      }}
                    />
                  }
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
            <CmsDataTable<DraftEventRow>
              key={active.id}
              className="cms-data-table cms-data-table--skip-auto-no-col ja-history-table"
              columns={columns}
              dataSource={eventRows}
              pagination={false}
              rowKey="index"
            />
          </div>
        ) : (
          <p className="ja-history-empty">등록된 기간이 없습니다.</p>
        )}
      </div>
    </ContentModal>
  )
}

export function TimelineFormModal(props: Props) {
  if (!props.open) return null
  return <TimelineFormBody {...props} />
}
