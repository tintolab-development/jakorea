import type { CSSProperties, ReactNode } from 'react'
import { useId, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ItemDeleteButton } from '@/features/template/ui/paragraph/shared/item-delete-button'
import { ParagraphDatePicker } from '@/features/template/ui/paragraph/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/paragraph/shared/paragraph-time-picker'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const SESSION_OPTIONS = [
  { value: '1', label: '1차시' },
  { value: '2', label: '2차시' },
  { value: '3', label: '3차시' },
  { value: '4', label: '4차시' },
]

type ScheduleRowState = {
  date: Dayjs | null
  session: string | undefined
  timeRange: [Dayjs, Dayjs] | null
}

function emptyRow(): ScheduleRowState {
  return { date: null, session: undefined, timeRange: null }
}

type PreferenceScheduleFieldsProps = {
  row: ScheduleRowState
  onPatch: (patch: Partial<ScheduleRowState>) => void
}

function PreferenceScheduleFields({ row, onPatch }: PreferenceScheduleFieldsProps) {
  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label="희망 교육일"
        edit={
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            customizable={false}
            suppressAutoTodayWhenEmpty
            placeholder="일자 선택"
            value={row.date}
            onChange={next => onPatch({ date: next })}
            width="100%"
          />
        }
        view="-"
      />
      <DetailInfoForm.Field
        label="희망 교육 시간"
        edit={
          <div
            className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
            style={{ alignItems: 'center', flexWrap: 'wrap', gap: 8 }}
          >
            <CmsSelect
              inputSize="medium"
              width={160}
              withAllOption={false}
              placeholder="희망 차시"
              value={row.session}
              onChange={v => onPatch({ session: v == null ? undefined : String(v) })}
              options={SESSION_OPTIONS}
            />
            <DetailInfoForm.InputsSeparator />
            <ParagraphTimePicker
              endTimeAlwaysOn
              placeholder="시간 선택"
              width={220}
              value={row.timeRange?.[0] ?? null}
              onTimeRangeChange={range => onPatch({ timeRange: range })}
            />
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

type PreferenceDetailFormProps = {
  title: string
  row: ScheduleRowState
  onPatch: (patch: Partial<ScheduleRowState>) => void
}

/** 1지망 — 제목·본문 한 `DetailInfoForm` */
function PreferenceDetailForm({ title, row, onPatch }: PreferenceDetailFormProps) {
  return (
    <DetailInfoForm title={title} mode="edit">
      <PreferenceScheduleFields row={row} onPatch={onPatch} />
    </DetailInfoForm>
  )
}

const bodyAndDeleteRow: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  width: '100%',
}

type PreferenceBlockWithSideDeleteProps = {
  title: string
  row: ScheduleRowState
  onPatch: (patch: Partial<ScheduleRowState>) => void
  deleteAction: ReactNode
}

/**
 * 2·3지망 — 제목은 상단 전체 너비, 삭제 버튼은 격자 본문(`hideHeader` 영역)과 같은 행에서 세로 중앙
 */
function PreferenceBlockWithSideDelete({
  title,
  row,
  onPatch,
  deleteAction,
}: PreferenceBlockWithSideDeleteProps) {
  const titleId = useId()

  return (
    <section className="detail-info-form" aria-labelledby={titleId}>
      <header className="detail-info-form__header">
        <div className="detail-info-form__header-lead">
          <h2 id={titleId} className="detail-info-form__title">
            {title}
          </h2>
        </div>
      </header>
      <div style={bodyAndDeleteRow}>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <DetailInfoForm title={title} hideHeader mode="edit">
            <PreferenceScheduleFields row={row} onPatch={onPatch} />
          </DetailInfoForm>
        </div>
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'stretch',
          }}
        >
          {deleteAction}
        </div>
      </div>
    </section>
  )
}

/** Gemini 찾아가는 연수 학교 신청 — 진행 희망 교육 일정(1~3지망, 지망별 독립 DetailInfoForm) */
export function GeminiVisitingTrainingPreferredScheduleParagraph() {
  const [first, setFirst] = useState(() => emptyRow())
  const [second, setSecond] = useState(() => emptyRow())
  const [third, setThird] = useState(() => emptyRow())
  const [showSecond, setShowSecond] = useState(true)
  const [showThird, setShowThird] = useState(true)

  const blockGap: CSSProperties = { marginBottom: 16 }

  return (
    <div className="program-registration-paragraph">
      <div style={blockGap}>
        <PreferenceDetailForm title="■ 1지망" row={first} onPatch={p => setFirst(prev => ({ ...prev, ...p }))} />
      </div>
      {showSecond ? (
        <div style={blockGap}>
          <PreferenceBlockWithSideDelete
            title="■ 2지망"
            row={second}
            onPatch={p => setSecond(prev => ({ ...prev, ...p }))}
            deleteAction={
              <ItemDeleteButton
                className="item-delete-button"
                aria-label="2지망 삭제"
                onClick={e => {
                  e.stopPropagation()
                  setSecond(emptyRow())
                  setShowSecond(false)
                }}
              />
            }
          />
        </div>
      ) : null}
      {showThird ? (
        <div>
          <PreferenceBlockWithSideDelete
            title="■ 3지망"
            row={third}
            onPatch={p => setThird(prev => ({ ...prev, ...p }))}
            deleteAction={
              <ItemDeleteButton
                className="item-delete-button"
                aria-label="3지망 삭제"
                onClick={e => {
                  e.stopPropagation()
                  setThird(emptyRow())
                  setShowThird(false)
                }}
              />
            }
          />
        </div>
      ) : null}
    </div>
  )
}
