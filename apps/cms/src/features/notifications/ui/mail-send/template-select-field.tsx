import { useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { CmsSelect } from '@/shared/ui'
import { PreviewModal } from '@/features/notifications/ui/mail-template/preview-modal'
import type { MailTemplateItem } from '@/features/notifications/model/mail-template/types'
import { MAIL_TEMPLATE_ITEM_MOCK } from '@/features/notifications/model/mail-template/mock'
import { TemplateSelectModal } from './template-select-modal'
import './template-select-modal.css'

const PICKER_Z_INDEX = 1100
const PREVIEW_Z_INDEX = 1200

type TemplateSelectFieldProps = {
  value?: string
  templates?: MailTemplateItem[]
  disabled?: boolean
  onSelect: (template: MailTemplateItem) => void
}

export function TemplateSelectField({
  value,
  templates = MAIL_TEMPLATE_ITEM_MOCK,
  disabled,
  onSelect,
}: TemplateSelectFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<MailTemplateItem | null>(null)

  const selectedTemplate = templates.find(template => template.id === value)
  const selectOptions = selectedTemplate
    ? [{ label: selectedTemplate.name, value: selectedTemplate.id }]
    : []

  const handleUse = (template: MailTemplateItem) => {
    onSelect(template)
    setPreviewTemplate(null)
    setPickerOpen(false)
  }

  const handlePickerClose = () => {
    setPreviewTemplate(null)
    setPickerOpen(false)
  }

  return (
    <>
      <span
        className="mail-send-template-select-field__trigger"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-haspopup="dialog"
        aria-expanded={pickerOpen}
        onClick={() => {
          if (disabled) return
          setPickerOpen(true)
        }}
        onKeyDown={event => {
          if (disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setPickerOpen(true)
          }
        }}
      >
        <CmsSelect
          inputSize="large"
          withAllOption={false}
          placeholder="사용할 템플릿을 선택하세요"
          value={value}
          options={selectOptions}
          open={false}
          showSearch={false}
          disabled={disabled}
          suffixIcon={<SearchOutlined />}
          tabIndex={-1}
          style={{ width: '100%' }}
        />
      </span>
      {pickerOpen ? (
        <TemplateSelectModal
          open
          templates={templates}
          onClose={handlePickerClose}
          onPreview={setPreviewTemplate}
          onUse={handleUse}
          zIndex={PICKER_Z_INDEX}
        />
      ) : null}
      <PreviewModal
        open={previewTemplate != null}
        zIndex={PREVIEW_Z_INDEX}
        subject={previewTemplate?.subject ?? ''}
        bodyHtml={previewTemplate?.bodyHtml ?? ''}
        senderName={previewTemplate?.senderName}
        senderEmail={previewTemplate?.senderEmail}
        attachments={previewTemplate?.attachmentFileNames.map(name => ({ name }))}
        previewAt={previewTemplate?.updatedAt}
        onClose={() => setPreviewTemplate(null)}
      />
    </>
  )
}
