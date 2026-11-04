import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { DateParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'
import { ParagraphBodyStaticText } from '@/features/template/ui/shared/paragraph-body-static-text'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { formatAppDatepickerDisplay } from '@/shared/ui/cms-datepicker'
import './date.css'

const PICKER_WIDTH = 240

type RangeValue = [Dayjs | null, Dayjs | null]

/** 날짜형 (`variant: date`) — 미리보기: 기간 등은 스키마, 선택값은 로컬 상태 */
export function DateField({
  paragraph,
  isCardSelected = true,
  isBodyInteractive = true,
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
    if (paragraphInteractionMode === 'authoring' && prevCardSelected.current && !isCardSelected) {
      setSingleDate(null)
      setRange([null, null])
    }
    prevCardSelected.current = isCardSelected
  }, [isCardSelected, paragraphInteractionMode])
  /* eslint-enable react-hooks/set-state-in-effect */

  const anchorDate = useMemo(
    () => range[0] ?? range[1] ?? singleDate ?? dayjs(),
    [range, singleDate]
  )

  const appliedSurfaceRange = useMemo((): [Dayjs, Dayjs] | null => {
    if (range[0] != null && range[1] != null && range[0].isValid() && range[1].isValid()) {
      return [range[0], range[1]]
    }
    return null
  }, [range])

  const appliedSurfaceWithTime = useMemo(() => {
    if (appliedSurfaceRange == null) return false
    return dateRangeUsesClockTime(appliedSurfaceRange[0], appliedSurfaceRange[1])
  }, [appliedSurfaceRange])

  const staticDisplayText = useMemo((): string | null => {
    if (!periodEnabled) {
      if (singleDate != null && singleDate.isValid()) {
        return formatAppDatepickerDisplay(singleDate)
      }
      return null
    }
    if (appliedSurfaceRange != null) {
      const [a, b] = appliedSurfaceRange
      if (appliedSurfaceWithTime) {
        return `${formatAppDatepickerDisplay(a)} ${a.format('HH:mm')} ~ ${b.format('HH:mm')}`
      }
      return `${formatAppDatepickerDisplay(a)} ~ ${formatAppDatepickerDisplay(b)}`
    }
    return null
  }, [appliedSurfaceRange, appliedSurfaceWithTime, periodEnabled, singleDate])

  const staticPlaceholder = periodEnabled ? '기간을 선택해 주세요' : '날짜를 선택해 주세요'

  if (!isBodyInteractive) {
    return (
      <div key={layoutKey} className="date-field-paragraph-body">
        <ParagraphBodyStaticText value={staticDisplayText} placeholder={staticPlaceholder} />
      </div>
    )
  }

  return (
    <div key={layoutKey} className="date-field-paragraph-body">
      {!periodEnabled ? (
        <ParagraphDatePicker
          mode="single"
          presetMode="date"
          customizable
          value={singleDate}
          onChange={setSingleDate}
          width={PICKER_WIDTH}
        />
      ) : (
        <ParagraphDatePicker
          className="date-field-paragraph-body__range-wrap"
          mode="single"
          presetMode="period"
          customizable
          value={anchorDate}
          width={PICKER_WIDTH * 2 + 20}
          preferPeriodModeInPopover
          appliedSurfaceRange={appliedSurfaceRange}
          appliedSurfaceWithTime={appliedSurfaceWithTime}
          onRangeChange={next => setRange(next)}
          onChange={d => {
            if (d == null) return
            setSingleDate(d)
            setRange([d.startOf('day'), d.endOf('day')])
          }}
        />
      )}
    </div>
  )
}
