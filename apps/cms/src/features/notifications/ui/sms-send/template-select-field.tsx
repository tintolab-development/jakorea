import { useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { CmsSelect } from '@/shared/ui'
import type { SmsTemplateItem } from '@/features/notifications/model/sms-template/types'
import { PreviewModal } from '@/features/notifications/ui/sms-template/preview-modal'
import { TemplateSelectModal } from './template-select-modal'
import '@/features/notifications/ui/mail-send/template-select-modal.css'

const PICKER_Z_INDEX = 1100
const PREVIEW_Z_INDEX = 1200

type TemplateSelectFieldProps = {
  value?: string
  templates?: SmsTemplateItem[]
  disabled?: boolean
  onSelect: (template: SmsTemplateItem) => void
}

export function TemplateSelectField({
  value,
  templates = [],
  disabled,
  onSelect,
}: TemplateSelectFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<SmsTemplateItem | null>(null)

  const selectedTemplate = templates.find(template => template.id === value)
  const selectOptions = selectedTemplate
    ? [{ label: selectedTemplate.name, value: selectedTemplate.id }]
    : []

  function handleUse(template: SmsTemplateItem) {
    onSelect(template)
    setPreviewTemplate(null)
    setPickerOpen(false)
  }

  function handlePickerClose() {
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
        templateName={previewTemplate?.templateName ?? ''}
        senderPhone={previewTemplate?.senderPhone ?? ''}
        messageType={previewTemplate?.messageType ?? 'SMS'}
        subject={previewTemplate?.subject ?? ''}
        bodyText={previewTemplate?.bodyText ?? ''}
        attachments={
          previewTemplate?.attachments?.length
            ? previewTemplate.attachments.map(item => ({
                name: item.fileName,
                sizeBytes: item.byteSize,
              }))
            : previewTemplate?.attachmentFileNames.map(name => ({ name }))
        }
        previewAt={new Date().toISOString()}
        onClose={() => setPreviewTemplate(null)}
      />
    </>
  )
}
