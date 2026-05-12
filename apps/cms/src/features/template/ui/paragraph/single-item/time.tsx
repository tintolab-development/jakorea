import { useEffect, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import type { TimeParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/paragraph-body-interaction-mode'
import { ParagraphTimePicker } from '@/features/template/ui/paragraph/shared/paragraph-time-picker'
import './time.css'

const PICKER_WIDTH = 240

/** 시간형 (`variant: time`) — 미리보기: 선택값은 로컬 상태 */
export function TimeField({
  paragraph: _paragraph,
  isCardSelected = true,
  isBodyInteractive = true,
  paragraphInteractionMode = 'authoring',
}: {
  paragraph: TimeParagraph
  onChange?: (next: TimeParagraph) => void
  isCardSelected?: boolean
  isBodyInteractive?: boolean
  paragraphInteractionMode?: ParagraphBodyInteractionMode
}) {
  const [time, setTime] = useState<Dayjs | null>(null)

  const prevCardSelected = useRef(isCardSelected)
  /* eslint-disable react-hooks/set-state-in-effect -- 카드 선택 해제 시 미리보기 로컬 상태 초기화 */
  useEffect(() => {
    if (
      paragraphInteractionMode === 'authoring' &&
      prevCardSelected.current &&
      !isCardSelected
    ) {
      setTime(null)
    }
    prevCardSelected.current = isCardSelected
  }, [isCardSelected, paragraphInteractionMode])
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="time-field-paragraph-body">
      <ParagraphTimePicker
        value={time}
        onChange={setTime}
        placeholder="시간 선택"
        width={PICKER_WIDTH}
        disabled={!isBodyInteractive}
      />
    </div>
  )
}
