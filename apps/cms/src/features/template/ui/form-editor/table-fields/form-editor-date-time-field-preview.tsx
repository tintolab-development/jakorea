import { useEffect, useState } from 'react'
import { DatePicker, TimePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import type { HorizontalTableColumnField } from '@/features/template/model/writing-form-draft.schema'

/** 우측 패널·캔버스와 동일 — `placeholder`가 비어 있을 때만 모드별 기본 */
export function dateTimeFieldPlaceholder(
  field: Extract<HorizontalTableColumnField, { kind: 'dateTime' }>
): string {
  const t = field.placeholder?.trim() ?? ''
  if (t.length > 0) return field.placeholder
  if (field.dateTimeMode === 'date') return '날짜를 선택해 주세요'
  if (field.dateTimeMode === 'time') return '시간을 선택해 주세요'
  return '날짜·시간을 선택해 주세요'
}

const horizontalTableCustomFieldPickerStyles = {
  popup: { root: { minWidth: 340 } },
} as const

/** 날짜+시간: 캘린더+시간 열이 함께 보이도록 팝업 폭 확보 */
const horizontalTableDateTimePickerStyles = {
  popup: { root: { minWidth: 560 } },
} as const

const horizontalTableDateTimeShowTime = {
  format: 'HH:mm',
  minuteStep: 5,
} as const

function horizontalTableBodyFieldsPickerContainer(): HTMLElement {
  return document.body
}

/** 커스텀 필드 — 날짜/시간 유형에 맞는 피커 UI(미리보기, 초안과 무관한 로컬 값) */
export function FormEditorDateTimeFieldPreview({
  field,
}: {
  field: Extract<HorizontalTableColumnField, { kind: 'dateTime' }>
}) {
  const [value, setValue] = useState<Dayjs | null>(null)
  const ph = dateTimeFieldPlaceholder(field)

  useEffect(() => {
    setValue(null)
  }, [field.dateTimeMode])

  const common = {
    needConfirm: false as const,
    styles: horizontalTableCustomFieldPickerStyles,
    getPopupContainer: horizontalTableBodyFieldsPickerContainer,
    value,
    onChange: setValue,
    placeholder: ph,
  }

  if (field.dateTimeMode === 'time') {
    return (
      <TimePicker
        {...common}
        rootClassName="form-editor-horizontal-table__field-box form-editor-horizontal-table__field-box--picker"
        className="form-editor-horizontal-table__field-time"
        format="HH:mm"
        minuteStep={5}
      />
    )
  }
  if (field.dateTimeMode === 'date') {
    return (
      <DatePicker
        {...common}
        rootClassName="form-editor-horizontal-table__field-box form-editor-horizontal-table__field-box--picker"
        className="form-editor-horizontal-table__field-date"
        format="YYYY-MM-DD"
      />
    )
  }
  return (
    <DatePicker
      {...common}
      styles={horizontalTableDateTimePickerStyles}
      showTime={horizontalTableDateTimeShowTime}
      rootClassName="form-editor-horizontal-table__field-box form-editor-horizontal-table__field-box--picker"
      className="form-editor-horizontal-table__field-datetime"
      format="YYYY-MM-DD HH:mm"
    />
  )
}
