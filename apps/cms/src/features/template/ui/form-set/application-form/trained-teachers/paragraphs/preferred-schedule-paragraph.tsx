import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

type ScheduleBlockState = {
  date: Dayjs | null
  start: Dayjs | null
  end: Dayjs | null
}

function createEmptyBlockState(): ScheduleBlockState {
  return {
    date: null,
    start: null,
    end: null,
  }
}

function ScheduleBlock({
  title,
  block,
  onPatch,
  disabledDate,
}: {
  title: string
  block: ScheduleBlockState
  onPatch: (patch: Partial<ScheduleBlockState>) => void
  disabledDate?: (date: Dayjs) => boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
      <div style={{ flex: '1 1 0', minWidth: 0 }}>
        <div className="detail-info-form--text-bold" style={{ marginBottom: 8 }}>
          {title}
        </div>
        <DetailInfoForm title={title} hideHeader mode="edit">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="희망 교육일"
              edit={
                <ParagraphDatePicker
                  mode="single"
                  presetMode="date"
                  customizable={false}
                  suppressAutoTodayWhenEmpty
                  placeholder="희망 교육 날짜를 선택하세요"
                  value={block.date}
                  onChange={next => onPatch({ date: next })}
                  disabledDate={disabledDate}
                  width={240}
                  style={{ flex: '0 0 240px', width: 240 }}
                />
              }
              view="-"
            />
            <DetailInfoForm.Field
              label="희망 교육 시간"
              edit={
                <ParagraphTimePicker
                  value={block.start}
                  onTimeRangeChange={range => onPatch({ start: range[0], end: range[1] })}
                  placeholder="시간을 선택해 주세요"
                  width={240}
                  endTimeAlwaysOn
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </div>
  )
}

/** 교육받은 교사 프로그램 참여자 신청 폼 — 진행 희망 교육 일정 */
export function TrainedTeachersProgramApplicationPreferredScheduleParagraph() {
  const bridge = useInstitutionApplicationProgramBridge()
  const [firstBlock, setFirstBlock] = useState<ScheduleBlockState>(() => createEmptyBlockState())
  const [secondBlock, setSecondBlock] = useState<ScheduleBlockState>(() => createEmptyBlockState())

  const disabledDate = useMemo(() => {
    const range = bridge.educationScheduleRange
    if (!range) return undefined
    const start = dayjs(range.start).startOf('day')
    const end = dayjs(range.end).endOf('day')
    if (!start.isValid() || !end.isValid()) return undefined
    return (date: Dayjs) => date.isBefore(start, 'day') || date.isAfter(end, 'day')
  }, [bridge.educationScheduleRange])

  return (
    <div
      className="program-registration-paragraph"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <ScheduleBlock
        title="■ 1지망"
        block={firstBlock}
        onPatch={patch => setFirstBlock(prev => ({ ...prev, ...patch }))}
        disabledDate={disabledDate}
      />

      <ScheduleBlock
        title="■ 2지망"
        block={secondBlock}
        onPatch={patch => setSecondBlock(prev => ({ ...prev, ...patch }))}
        disabledDate={disabledDate}
      />
    </div>
  )
}
