import { useState, type ReactNode } from 'react'
import { CmsSelect } from '@/shared/ui'
import { FieldSearchIcon } from '@/shared/ui/icons'
import {
  TemplateSelectModal,
  type SendTemplatePickerItem,
  type TemplateSelectModalProps,
} from './template-select-modal'
import './template-select-modal.css'

const PICKER_Z_INDEX = 1100
const PREVIEW_Z_INDEX = 1200

export type TemplateSelectFieldPreviewArgs<T extends SendTemplatePickerItem> = {
  template: T | null
  open: boolean
  onClose: () => void
  onUse: (template: T) => void
  zIndex: number
}

export type TemplateSelectFieldProps<T extends SendTemplatePickerItem> = {
  value?: string
  templates?: T[]
  disabled?: boolean
  onSelect: (template: T) => void
  isTemplateUsable?: (template: T) => boolean
  getTemplateUnusableMessage?: (template: T) => string | null
  isUseEnabled?: (template: T) => boolean
  onBeforeUse?: (template: T) => boolean
  useButtonLabel?: string
  extraColumns?: TemplateSelectModalProps<T>['extraColumns']
  showUnusableReasonInline?: boolean
  getTemplateUnusableReason?: (template: T) => { summary: string; detail: string } | null
  renderPreview: (args: TemplateSelectFieldPreviewArgs<T>) => ReactNode
}

export function TemplateSelectField<T extends SendTemplatePickerItem>({
  value,
  templates = [],
  disabled,
  onSelect,
  isTemplateUsable,
  getTemplateUnusableMessage,
  isUseEnabled,
  onBeforeUse,
  useButtonLabel,
  extraColumns,
  showUnusableReasonInline,
  getTemplateUnusableReason,
  renderPreview,
}: TemplateSelectFieldProps<T>) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<T | null>(null)

  const selectedTemplate = templates.find(template => template.id === value)
  const selectOptions = selectedTemplate
    ? [{ label: selectedTemplate.name, value: selectedTemplate.id }]
    : []

  const handleUse = (template: T) => {
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
        className="send-template-select-field__trigger"
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
          inputSize="small"
          withAllOption={false}
          placeholder="사용할 템플릿을 선택해 주세요"
          value={value}
          options={selectOptions}
          open={false}
          allowClear={false}
          showSearch={false}
          disabled={disabled}
          suffixIcon={
            <span className="cms-field__icon">
              <FieldSearchIcon />
            </span>
          }
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
          isTemplateUsable={isTemplateUsable}
          getTemplateUnusableMessage={getTemplateUnusableMessage}
          isUseEnabled={isUseEnabled}
          onBeforeUse={onBeforeUse}
          useButtonLabel={useButtonLabel}
          extraColumns={extraColumns}
          showUnusableReasonInline={showUnusableReasonInline}
          getTemplateUnusableReason={getTemplateUnusableReason}
          zIndex={PICKER_Z_INDEX}
        />
      ) : null}
      {renderPreview({
        template: previewTemplate,
        open: previewTemplate != null,
        onClose: () => setPreviewTemplate(null),
        onUse: handleUse,
        zIndex: PREVIEW_Z_INDEX,
      })}
    </>
  )
}
