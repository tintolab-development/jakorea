import { useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { CmsSelect } from '@/shared/ui'
import { PreviewModal } from '@/features/notifications/ui/alimtalk-template/preview-modal'
import type { AlimtalkTemplateItem } from '@/features/notifications/model/alimtalk-template/types'
import { TemplateSelectModal } from './template-select-modal'
import './template-select-modal.css'

const PICKER_Z_INDEX = 1100
const PREVIEW_Z_INDEX = 1200

type TemplateSelectFieldProps = {
  value?: string
  templates: AlimtalkTemplateItem[]
  onSelect: (template: AlimtalkTemplateItem) => void
}

export function TemplateSelectField({ value, templates, onSelect }: TemplateSelectFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<AlimtalkTemplateItem | null>(null)

  const selectedTemplate = templates.find(template => template.id === value)
  const selectOptions = selectedTemplate
    ? [{ label: selectedTemplate.name, value: selectedTemplate.id }]
    : []

  const handleUse = (template: AlimtalkTemplateItem) => {
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
        className="template-select-field__trigger"
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
          placeholder="사용할 템플릿을 선택하세요"
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
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={handleUse}
        zIndex={PREVIEW_Z_INDEX}
      />
    </>
  )
}
