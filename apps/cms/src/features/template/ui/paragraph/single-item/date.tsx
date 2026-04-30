import { useEffect, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import type { DateParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/paragraph-body-interaction-mode'
import { ParagraphDatePicker } from '@/features/template/ui/paragraph/shared/paragraph-date-picker'
import './date.css'

const PICKER_WIDTH = 240

type RangeValue = [Dayjs | null, Dayjs | null]

/** 날짜형 (`variant: date`) — 미리보기: 기간 등은 스키마, 선택값은 로컬 상태 */
export function DateField({
  paragraph,
  isCardSelected = true,
  isBodyInteractive: _isBodyInteractive = true,
  paragraphInteractionMode = 'authoring',
}: {
  paragraph: DateParagraph
  onChange?: (next: DateParagraph) => void
  isCardSelected?: boolean
  isBodyInteractive?: boolean
  paragraphInteractionMode?: ParagraphBodyInteractionMode
}) {
  const periodEnabled = paragraph.periodEnabled ?? false
  const [singleDate, setSingleDate] = useState<Dayjs | null>(null)
  const [range, setRange] = useState<RangeValue>([null, null])

  const layoutKey = periodEnabled ? 'range' : 'single'

  const prevCardSelected = useRef(isCardSelected)
  /* eslint-disable react-hooks/set-state-in-effect -- 기간 전환·카드 선택 해제 시 미리보기 로컬 상태 초기화 */
  useEffect(() => {
    setSingleDate(null)
    setRange([null, null])
  }, [layoutKey])

  useEffect(() => {
    if (
      paragraphInteractionMode === 'authoring' &&
      prevCardSelected.current &&
      !isCardSelected
    ) {
      setSingleDate(null)
      setRange([null, null])
    }
    prevCardSelected.current = isCardSelected
  }, [isCardSelected, paragraphInteractionMode])
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div key={layoutKey} className="date-field-paragraph-body">
      {!periodEnabled ? (
        <ParagraphDatePicker
          mode="single"
          value={singleDate}
          onChange={setSingleDate}
          placeholder="날짜 선택"
          width={PICKER_WIDTH}
        />
      ) : (
        <ParagraphDatePicker
          className="date-field-paragraph-body__range-wrap"
          mode="range"
          value={range}
          onChange={setRange}
          placeholder={['시작일 선택', '종료일 선택']}
          width={PICKER_WIDTH * 2 + 20}
        />
      )}
    </div>
  )
}
