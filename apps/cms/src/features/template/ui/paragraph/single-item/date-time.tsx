import { useEffect, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import type { DateTimeParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/paragraph-body-interaction-mode'
import { ParagraphDatePicker } from '@/features/template/ui/paragraph/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/paragraph/shared/paragraph-time-picker'
import './date-time.css'

const PICKER_WIDTH = 240

type RangeValue = [Dayjs | null, Dayjs | null]

/** 날짜/시간형 (date_time) — 미리보기: 유형·기간은 스키마, 선택값은 로컬 상태 */
export function DateTime({
  paragraph,
  isCardSelected = true,
  isBodyInteractive = true,
  paragraphInteractionMode = 'authoring',
}: {
  paragraph: DateTimeParagraph
  onChange?: (next: DateTimeParagraph) => void
  /** 단락 카드 선택 — authoring 시 선택 해제에 따른 로컬 미리보기 초기화 */
  isCardSelected?: boolean
  /** 피커 조작 가능 — user 모드에서는 카드 비선택이어도 true일 수 있음 */
  isBodyInteractive?: boolean
  /** user일 때는 카드 비선택으로 로컬 미리보기 선택값을 초기화하지 않음 */
  paragraphInteractionMode?: ParagraphBodyInteractionMode
}) {
  const fieldMode = paragraph.fieldMode ?? 'date'
  const periodEnabled = paragraph.periodEnabled ?? false

  const [singleDate, setSingleDate] = useState<Dayjs | null>(null)
  const [range, setRange] = useState<RangeValue>([null, null])
  const [time, setTime] = useState<Dayjs | null>(null)

  const layoutKey = `${fieldMode}-${periodEnabled ? '1' : '0'}`

  const prevCardSelected = useRef(isCardSelected)
  useEffect(() => {
    setSingleDate(null)
    setRange([null, null])
    setTime(null)
  }, [layoutKey])

  useEffect(() => {
    if (
      paragraphInteractionMode === 'authoring' &&
      prevCardSelected.current &&
      !isCardSelected
    ) {
      setSingleDate(null)
      setRange([null, null])
      setTime(null)
    }
    prevCardSelected.current = isCardSelected
  }, [isCardSelected, paragraphInteractionMode])

  return (
    <div key={layoutKey} className="date-time-paragraph-body">
      {fieldMode === 'time' ? (
        <ParagraphTimePicker
          value={time}
          onChange={setTime}
          placeholder="시간 선택"
          width={PICKER_WIDTH}
          disabled={!isBodyInteractive}
        />
      ) : null}

      {fieldMode === 'date' && !periodEnabled ? (
        <ParagraphDatePicker
          mode="single"
          value={singleDate}
          onChange={setSingleDate}
          placeholder="날짜 선택"
          width={PICKER_WIDTH}
          disabled={!isBodyInteractive}
        />
      ) : null}

      {fieldMode === 'date' && periodEnabled ? (
        <ParagraphDatePicker
          mode="range"
          value={range}
          onChange={setRange}
          placeholder={['시작일 선택', '종료일 선택']}
          width={PICKER_WIDTH * 2 + 20}
          disabled={!isBodyInteractive}
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
            disabled={!isBodyInteractive}
          />
          <ParagraphTimePicker
            value={time}
            onChange={setTime}
            placeholder="시간 선택"
            width={PICKER_WIDTH}
            disabled={!isBodyInteractive}
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
            disabled={!isBodyInteractive}
          />
          <ParagraphTimePicker
            value={time}
            onChange={setTime}
            placeholder="시간 선택"
            width={PICKER_WIDTH}
            disabled={!isBodyInteractive}
          />
        </>
      ) : null}
    </div>
  )
}
