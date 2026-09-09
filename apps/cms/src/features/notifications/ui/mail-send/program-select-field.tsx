import { useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { CmsSelect } from '@/shared/ui'
import type { MailSendProgram } from '@/features/notifications/model/mail-send/types'
import { findMailSendProgram } from '@/features/notifications/model/mail-send/programs'
import { ProgramSelectModal } from './program-select-modal'
import './program-select-modal.css'

const PICKER_Z_INDEX = 1100

type ProgramSelectFieldProps = {
  value?: string
  /** GET /api/admin/programs items[].id 기준. mock id 금지. */
  programs?: MailSendProgram[]
  onSelect: (program: MailSendProgram) => void
}

export function ProgramSelectField({
  value,
  programs = [],
  onSelect,
}: ProgramSelectFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const selected = findMailSendProgram(programs, value)
  const selectOptions = selected ? [{ label: selected.name, value: selected.id }] : []

  const handleUse = (program: MailSendProgram) => {
    onSelect(program)
    setPickerOpen(false)
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
          inputSize="large"
          withAllOption={false}
          placeholder="대상 프로그램을 선택하세요"
          value={value}
          options={selectOptions}
          open={false}
          showSearch={false}
          suffixIcon={<SearchOutlined />}
          tabIndex={-1}
          style={{ width: '100%' }}
        />
      </span>
      {pickerOpen ? (
        <ProgramSelectModal
          open
          programs={programs}
          selectedId={value}
          onClose={() => setPickerOpen(false)}
          onSelect={handleUse}
          zIndex={PICKER_Z_INDEX}
        />
      ) : null}
    </>
  )
}
