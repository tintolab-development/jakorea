import { useState } from 'react'
import { CmsSelect, useCmsAlert } from '@/shared/ui'
import type { MailSendProgram } from '@/features/notifications/model/mail-send/types'
import { findMailSendProgram } from '@/features/notifications/model/mail-send/programs'
import {
  NOTIFICATION_SEND_ALL_PROGRAM_ID,
  isNotificationSendAllProgram,
  isNotificationSendProgramUnset,
} from '@/features/notifications/model/send-program-id'
import { ProgramSelectModal } from './program-select-modal'
import './program-select-modal.css'

const PICKER_Z_INDEX = 1100
const DESELECT_DONE_ALERT = {
  title: '프로그램 선택 해제 완료',
  content: '대상 프로그램 선택이 해제되었습니다.',
}
/** 지정 해제(미선택) — 채널별 onSelect가 프로그램 변경과 같은 초기화를 수행한다. */
const DESELECTED_PROGRAM: MailSendProgram = {
  id: NOTIFICATION_SEND_ALL_PROGRAM_ID,
  name: '',
  year: 0,
}
/** 시안(9411:51792): 미선택(빈 값·`all`)이면 값 대신 placeholder */
const PROGRAM_FIELD_PLACEHOLDER = '수신 대상 프로그램을 선택해 주세요'

type ProgramSelectFieldProps = {
  value?: string
  /** GET /api/admin/programs items[].id 기준. mock id 금지. */
  programs?: MailSendProgram[]
  onSelect: (program: MailSendProgram) => void
}

export function ProgramSelectField({ value, programs = [], onSelect }: ProgramSelectFieldProps) {
  const { showAlert } = useCmsAlert()
  const [pickerOpen, setPickerOpen] = useState(false)
  const selected = findMailSendProgram(programs, value)
  const isAll = isNotificationSendAllProgram(value)
  const isUnset = isNotificationSendProgramUnset(value)
  const selectValue = !isAll && !isUnset && selected ? selected.id : undefined
  const selectOptions =
    selectValue && selected ? [{ label: selected.name, value: selectValue }] : []

  const handleUse = (program: MailSendProgram) => {
    onSelect(program)
    setPickerOpen(false)
  }

  const handleDeselect = () => {
    onSelect(DESELECTED_PROGRAM)
    setPickerOpen(false)
    showAlert(DESELECT_DONE_ALERT)
  }

  return (
    <>
      <span
        className="mail-send-program-select-field__trigger"
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={pickerOpen}
        onClick={() => setPickerOpen(true)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setPickerOpen(true)
          }
        }}
      >
        <CmsSelect
          inputSize="small"
          withAllOption={false}
          placeholder={PROGRAM_FIELD_PLACEHOLDER}
          value={selectValue}
          options={selectOptions}
          open={false}
          allowClear={false}
          showSearch={false}
          tabIndex={-1}
          style={{ width: '100%' }}
        />
      </span>
      {pickerOpen ? (
        <ProgramSelectModal
          open
          programs={programs}
          selectedId={isAll || isUnset ? undefined : value}
          selectedName={isAll || isUnset ? undefined : selected?.name}
          onClose={() => setPickerOpen(false)}
          onSelect={handleUse}
          onDeselect={handleDeselect}
          zIndex={PICKER_Z_INDEX}
        />
      ) : null}
    </>
  )
}
