import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import type { DateTimeParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ParagraphDatePicker } from '@/features/template/ui/paragraph/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/paragraph/shared/paragraph-time-picker'
import './date-time.css'

const PICKER_WIDTH = 240

type RangeValue = [Dayjs | null, Dayjs | null]

/** 날짜/시간형 (date_time) — 미리보기: 유형·기간은 스키마, 선택값은 로컬 상태 */
export function DateTime({
  paragraph,
}: {
  paragraph: DateTimeParagraph
  onChange?: (next: DateTimeParagraph) => void
}) {
  const fieldMode = paragraph.fieldMode ?? 'date'
  const periodEnabled = paragraph.periodEnabled ?? false

  const [singleDate, setSingleDate] = useState<Dayjs | null>(null)
  const [range, setRange] = useState<RangeValue>([null, null])
  const [time, setTime] = useState<Dayjs | null>(null)

  const layoutKey = `${fieldMode}-${periodEnabled ? '1' : '0'}`

  return (
    <div key={layoutKey} className="date-time-paragraph-body">
      {fieldMode === 'time' ? (
        <ParagraphTimePicker
          value={time}
          onChange={setTime}
          placeholder="시간 선택"
          width={PICKER_WIDTH}
        />
      ) : null}

      {fieldMode === 'date' && !periodEnabled ? (
        <ParagraphDatePicker
          mode="single"
          value={singleDate}
          onChange={setSingleDate}
          placeholder="날짜 선택"
          width={PICKER_WIDTH}
        />
      ) : null}

      {fieldMode === 'date' && periodEnabled ? (
        <ParagraphDatePicker
          mode="range"
          value={range}
          onChange={setRange}
          placeholder={['시작일 선택', '종료일 선택']}
          width={PICKER_WIDTH * 2 + 20}
        />
      ) : null}

      {fieldMode === 'date_time' && !periodEnabled ? (
        <>
          <ParagraphDatePicker
            mode="single"
            value={singleDate}
            onChange={setSingleDate}
            placeholder="날짜 선택"
            width={PICKER_WIDTH}
          />
          <ParagraphTimePicker
            value={time}
            onChange={setTime}
            placeholder="시간 선택"
            width={PICKER_WIDTH}
          />
        </>
      ) : null}

      {fieldMode === 'date_time' && periodEnabled ? (
        <>
          <ParagraphDatePicker
            className="date-time-paragraph-body__range-wrap"
            mode="range"
            value={range}
            onChange={setRange}
            placeholder={['시작일 선택', '종료일 선택']}
            width={PICKER_WIDTH * 2 + 20}
          />
          <ParagraphTimePicker
            value={time}
            onChange={setTime}
            placeholder="시간 선택"
            width={PICKER_WIDTH}
          />
        </>
      ) : null}
    </div>
  )
}
