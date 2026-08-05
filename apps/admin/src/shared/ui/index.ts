/**
 * 공통 UI 컴포넌트 export (CMS 디자인 시스템 미니멀 포트)
 */

export { CmsButton, CMS_ACTION_BUTTON_WIDTH, CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH } from './cms-button'
export type { CmsButtonProps, CmsButtonVariant, CmsButtonSize } from './cms-button'

export { TealHeaderModal } from './teal-header-modal'
export type { ModalSize, TealHeaderModalProps } from './teal-header-modal'

export { ContentModal } from './content-modal'
export type { ContentModalProps } from './content-modal'
export { renderContentModalDescription } from './content-modal-description'

export { CmsInput } from './cms-input'
export type { CmsInputProps, CmsInputSize } from './cms-input'
export type { CmsControlSize } from './cms-control-size'

export { CmsTextArea } from './cms-textarea'
export type { CmsTextAreaProps, CmsTextAreaSize } from './cms-textarea'

export { CmsSelect } from './cms-select'
export type { CmsSelectProps } from './cms-select'

export {
  CmsDatePicker,
  CmsDateRangePicker,
  DEFAULT_APP_DATE_PLACEHOLDER,
  formatAppDatepickerDisplay,
  formatAppDatepickerRangePlain,
} from './cms-datepicker'
export type {
  CmsDatePickerProps,
  CmsDatePickerRef,
  CmsDateRangePickerProps,
} from './cms-datepicker'

export { CmsPeriodDatePicker } from './cms-period-datepicker'
export type {
  CmsPeriodDatePickerProps,
  CmsPeriodDatePickerValue,
} from './cms-period-datepicker'

export { CmsRadio, CmsRadioGroup, CmsRadioButton } from './cms-radio'
export type {
  CmsRadioProps,
  CmsRadioGroupProps,
  CmsRadioSize,
  CmsRadioButtonProps,
} from './cms-radio'

export { FileSelectField } from './file-select-field'
export type { FileSelectFieldProps } from './file-select-field'
export {
  FILE_SELECT_MAX_TOTAL_BYTES,
  FILE_SELECT_TOTAL_SIZE_GUIDE_LINE,
  sumFileBytes,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
} from './file-select-field-limits'

export { AlertModal } from './alert-modal'
export type { AlertModalProps } from './alert-modal'
export { ConfirmModal } from './confirm-modal'
export type { ConfirmModalProps } from './confirm-modal'
export { cmsAlertModal, isCmsAlertModalReady } from './cms-alert-modal-api'
export type { CmsAlertModalShowOptions } from './cms-alert-modal-api'
export { CmsAlertModalProvider, useCmsAlert } from './cms-alert-modal-provider'
export type { CmsAlertModalContextValue } from './cms-alert-modal-provider'
