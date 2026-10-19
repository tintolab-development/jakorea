import { memo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'

type GeneralApplicationOverlayTextFieldProps = {
  label: string
  validationKey?: string
  overlayKey: string
  defaultValue: string
  placeholder?: string
  readOnly?: boolean
}

export const GeneralApplicationOverlayTextField = memo(function GeneralApplicationOverlayTextField({
  label,
  validationKey,
  overlayKey,
  defaultValue,
  placeholder,
  readOnly,
}: GeneralApplicationOverlayTextFieldProps) {
  const [value, setValue] = useGeneralApplicationOverlayKv(overlayKey, defaultValue)
  return (
    <DetailInfoForm.Field
      label={label}
      validationKey={validationKey}
      edit={
        <CmsInput
          inputSize="small"
          width="100%"
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          onChange={event => setValue(event.target.value)}
        />
      }
      view="-"
    />
  )
})
