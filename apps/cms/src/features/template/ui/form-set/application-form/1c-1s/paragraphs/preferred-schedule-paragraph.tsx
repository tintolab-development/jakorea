import { useState, type ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const SESSION_OPTIONS = [
  { value: '1', label: '1차시' },
  { value: '2', label: '2차시' },
]

type ScheduleBlockState = {
  date: Dayjs | null
  session: string | undefined
  firstClassPeriod: string | undefined
  firstStart: Dayjs | null
  firstEnd: Dayjs | null
  secondClassPeriod: string | undefined
  secondStart: Dayjs | null
  secondEnd: Dayjs | null
}

function createEmptyBlockState(): ScheduleBlockState {
  return {
    date: null,
    session: undefined,
    firstClassPeriod: undefined,
    firstStart: null,
    firstEnd: null,
    secondClassPeriod: undefined,
    secondStart: null,
    secondEnd: null,
  }
}

function ScheduleDateAndSessionRow({
  block,
  onPatch,
}: {
  block: ScheduleBlockState
  onPatch: (patch: Partial<ScheduleBlockState>) => void
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label="희망 교육일 및 차시"
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper-no-gap">
            <ParagraphDatePicker
              mode="single"
              presetMode="date"
              customizable={false}
              suppressAutoTodayWhenEmpty
              placeholder="희망 교육 날짜를 선택하세요"
              value={block.date}
              onChange={next => onPatch({ date: next })}
              width={240}
              style={{ flex: '0 0 240px', width: 240 }}
            />
            <DetailInfoForm.InputsSeparator />
            <CmsSelect
              inputSize="medium"
              width={120}
              withAllOption={false}
              placeholder="희망 차시"
              value={block.session}
              onChange={value => onPatch({ session: value == null ? undefined : String(value) })}
              options={SESSION_OPTIONS}
            />
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

function ScheduleTimeRow({
  label,
  classPeriod,
  start,
  end,
  onPatch,
  note,
}: {
  label: string
  classPeriod: string | undefined
  start: Dayjs | null
  end: Dayjs | null
  onPatch: (patch: { classPeriod?: string; start: Dayjs | null; end: Dayjs | null }) => void
  note?: string
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={label}
        fullRow
        edit={
          <div
            className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
            style={{ alignItems: 'center', flexWrap: 'wrap', gap: 8, width: '100%' }}
          >
            <CmsInput
              inputSize="medium"
              width={120}
              placeholder="수업 진행 교시"
              value={classPeriod ?? ''}
              inputMode="numeric"
              onChange={event =>
                onPatch({
                  classPeriod: event.target.value.trim() === '' ? undefined : event.target.value,
                  start,
                  end,
                })
              }
            />
            <span>교시</span>
            <DetailInfoForm.InputsSeparator />
            <ParagraphTimePicker
              value={start}
              onTimeRangeChange={range => onPatch({ classPeriod, start: range[0], end: range[1] })}
              placeholder="시간을 선택해 주세요"
              width={240}
              endTimeAlwaysOn
            />
            {note ? (
              <span className="form-editor-template-field-hint-text" style={{ marginLeft: 8 }}>
                {note}
              </span>
            ) : null}
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

function ScheduleBlock({
  title,
  block,
  onPatch,
  showSecondClassTime = false,
  deleteAction,
}: {
  title: string
  block: ScheduleBlockState
  onPatch: (patch: Partial<ScheduleBlockState>) => void
  showSecondClassTime?: boolean
  deleteAction?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
      <div style={{ flex: '1 1 0', minWidth: 0 }}>
        <div className="detail-info-form--text-bold" style={{ marginBottom: 8 }}>
          {title}
        </div>
        <DetailInfoForm title={title} hideHeader mode="edit">
          <ScheduleDateAndSessionRow block={block} onPatch={onPatch} />
          <ScheduleTimeRow
            label="1차시 희망 교육 시간"
            classPeriod={block.firstClassPeriod}
            start={block.firstStart}
            end={block.firstEnd}
            onPatch={patch =>
              onPatch({
                firstClassPeriod: patch.classPeriod,
                firstStart: patch.start,
                firstEnd: patch.end,
              })
            }
          />
          {showSecondClassTime ? (
            <ScheduleTimeRow
              label="2차시 희망 교육 시간"
              classPeriod={block.secondClassPeriod}
              start={block.secondStart}
              end={block.secondEnd}
              onPatch={patch =>
                onPatch({
                  secondClassPeriod: patch.classPeriod,
                  secondStart: patch.start,
                  secondEnd: patch.end,
                })
              }
              note="*1차시가 진행되는 교시의 다음 수업 시간을 작성해 주세요."
            />
          ) : null}
        </DetailInfoForm>
      </div>
      {deleteAction ? (
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
      ) : null}
    </div>
  )
}

/** 1사1교 프로그램 참여자 신청 폼 — 진행 희망 교육 일정 */
export function EconomyProgramApplicationPreferredScheduleParagraph() {
  const [firstBlock, setFirstBlock] = useState<ScheduleBlockState>(() => createEmptyBlockState())
  const [secondBlock, setSecondBlock] = useState<ScheduleBlockState>(() => createEmptyBlockState())
  const [showSecondBlock, setShowSecondBlock] = useState(true)

  return (
    <div
      className="program-registration-paragraph"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <ScheduleBlock
        title="■ 1지망"
        block={firstBlock}
        onPatch={patch => setFirstBlock(prev => ({ ...prev, ...patch }))}
      />

      {showSecondBlock ? (
        <ScheduleBlock
          title="■ 2지망"
          block={secondBlock}
          onPatch={patch => setSecondBlock(prev => ({ ...prev, ...patch }))}
          showSecondClassTime
          deleteAction={
            <ItemDeleteButton
              className="item-delete-button"
              aria-label="2지망 삭제"
              onClick={event => {
                event.stopPropagation()
                setSecondBlock(createEmptyBlockState())
                setShowSecondBlock(false)
              }}
            />
          }
        />
      ) : null}
    </div>
  )
}
