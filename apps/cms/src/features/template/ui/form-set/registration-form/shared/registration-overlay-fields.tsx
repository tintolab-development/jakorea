import { memo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { CmsSelectProps } from '@/shared/ui/cms-select'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

type OverlayTextFieldProps = {
  label: string
  validationKey: string
  overlayKey: string
  placeholder: string
}

function ProgramRegistrationOverlayTextFieldInner({
  label,
  validationKey,
  overlayKey,
  placeholder,
}: OverlayTextFieldProps) {
  const [value, setValue] = useProgramRegistrationOverlayKv(overlayKey, '')
  return (
    <DetailInfoForm.Field
      label={label}
      validationKey={validationKey}
      edit={
        <CmsInput
          inputSize="medium"
          placeholder={placeholder}
          width="100%"
          value={value}
          onChange={event => setValue(event.target.value)}
        />
      }
      view="-"
    />
  )
}

export const ProgramRegistrationOverlayTextField = memo(ProgramRegistrationOverlayTextFieldInner)

type OverlaySelectFieldProps = {
  label: string
  validationKey: string
  overlayKey: string
  placeholder: string
  options: CmsSelectProps['options']
  withAllOption?: boolean
  width?: number | string
  defaultValue?: string
  onOpenChange?: (open: boolean) => void
}

function ProgramRegistrationOverlaySelectFieldInner({
  label,
  validationKey,
  overlayKey,
  placeholder,
  options,
  withAllOption = false,
  width = 240,
  defaultValue = '',
  onOpenChange,
}: OverlaySelectFieldProps) {
  const [value, setValue] = useProgramRegistrationOverlayKv(overlayKey, defaultValue)
  return (
    <DetailInfoForm.Field
      label={label}
      validationKey={validationKey}
      edit={
        <div className="detail-info-form-inputs-wrapper-no-gap">
          <CmsSelect
            inputSize="medium"
            withAllOption={withAllOption}
            placeholder={placeholder}
            width={width}
            options={options}
            value={value || undefined}
            onChange={v => setValue(String(v ?? ''))}
            onOpenChange={onOpenChange}
          />
        </div>
      }
      view="-"
    />
  )
}

export const ProgramRegistrationOverlaySelectField = memo(ProgramRegistrationOverlaySelectFieldInner)
