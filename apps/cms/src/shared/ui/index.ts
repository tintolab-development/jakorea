/**
 * 공통 UI 컴포넌트 export
 */

export { StatusDisplay } from './status-display'
export { SingleCTA } from './single-cta'
export { GuideMessage } from './guide-message'
export { EmptyState } from './empty-state'
export { ConfirmModal } from './confirm-modal'
export { ActionResultModal } from './action-result-modal'
export type { ActionResultModalProps } from './action-result-modal'
export {
  buildRegisterCompletedTitle,
  buildRegisterCompletedMessage,
  buildDeleteCompletedTitle,
  buildDeleteCompletedMessageSingle,
  buildDeleteCompletedMessageBulk,
} from './action-result-messages'
export { DeleteGuideModal } from './delete-guide-modal'
export type { DeleteGuideModalProps } from './delete-guide-modal'
export {
  buildDomainEntityDeleteMessageLines,
  buildBulkDeleteGuideTitle,
  buildBulkDomainDeleteMessageLines,
  DELETE_GUIDE_ENTITY_DISPLAY_MAX_LENGTH,
  truncateForDeleteGuideDisplay,
} from './delete-guide-messages'
export {
  PROGRAM_PROGRESS_HISTORY_DOMAIN,
  buildProgramProgressHistoryDeleteGuide,
  type ProgramProgressHistoryDeleteGuide,
} from './program-progress-history-delete-guide'
export { InquiryModal } from './inquiry-modal'
export { ProfileEditModal } from './profile-edit-modal'
export {
  RoleBadge,
  RoleIcon,
  getRoleLabel,
  getRoleColor,
  getAdminLevelLabel,
  getProgramRoleLabel,
} from './role-badge'
export { BaseDetailDrawer } from './base-detail-drawer'
export type { BaseDetailDrawerProps, DrawerAction } from './base-detail-drawer'
export { ListPageFilters } from './list-page-filters'
export type { ListPageFiltersProps, FilterConfig, FilterOption } from './list-page-filters'
export { UnifiedFilterCard } from './unified-filter-card'
export type { UnifiedFilterCardProps, FilterFieldConfig } from './unified-filter-card'
export { TableFilterGroup } from '../components/table-filter-group'
export type { TableFilterGroupProps } from '../components/table-filter-group'
export { FilterListLayout } from '../components/filter-list-layout'
export type { FilterListLayoutProps } from '../components/filter-list-layout'
export { FilterTableLayout } from '../components/filter-table-layout'
export type { FilterTableLayoutProps } from '../components/filter-table-layout'
export { ListPageLayout } from '../components/list-page'
export type { ListPageLayoutProps } from '../components/list-page'
export { LabeledSearchInput } from './labeled-search-input'
export type { LabeledSearchInputProps } from './labeled-search-input'
export { StatusBadge } from './status-badge'
export type { StatusBadgeProps, StatusConfig } from './status-badge'
export { RecruitmentStatusBadge } from './recruitment-status-badge'
export type { RecruitmentStatusBadgeProps, RecruitmentStatus } from './recruitment-status-badge'
export { EditableCell } from './editable-cell'
export { PageHeader } from './page-header'
export { AppBreadcrumb } from './app-breadcrumb'
export type { AppBreadcrumbProps } from './app-breadcrumb'
export type { BreadcrumbItem } from '@/shared/config/menu-config'
export { FileSelectField } from './file-select-field'
export type { FileSelectFieldProps } from './file-select-field'
export { TealHeaderModal } from './teal-header-modal'
export type { TealHeaderModalProps } from './teal-header-modal'
export { PlainHeaderModal } from './plain-header-modal'
export type { PlainHeaderModalProps } from './plain-header-modal'
export { ContentModal } from './content-modal'
export type { ContentModalProps } from './content-modal'
export {
  AppDatePicker,
  AppDateRangePicker,
  DEFAULT_APP_DATE_PLACEHOLDER,
} from './app-datepicker'
export type { AppDatePickerProps, AppDateRangePickerProps } from './app-datepicker'
export { AppButton } from './app-button'
export type { AppButtonProps, AppButtonVariant, AppButtonSize } from './app-button'
export { CmsButton } from './cms-button'
export type { CmsButtonProps, CmsButtonVariant, CmsButtonSize } from './cms-button'
export { CmsInput } from './cms-input'
export type { CmsInputProps, CmsInputSize } from './cms-input'
export { CmsTextArea } from './cms-textarea'
export type { CmsTextAreaProps, CmsTextAreaSize } from './cms-textarea'
export { CmsInputSearch } from './cms-input-search'
export type { CmsInputSearchProps } from './cms-input-search'
export { AddressSearch } from './address-search'
export type { AddressSearchProps } from './address-search'
export type { CmsControlSize } from './cms-control-size'
export { CmsSelect } from './cms-select'
export type { CmsSelectProps } from './cms-select'
export { CmsRadio, CmsRadioGroup } from './cms-radio'
export type { CmsRadioProps, CmsRadioGroupProps, CmsRadioSize } from './cms-radio'
export { CmsCheckbox } from './cms-checkbox'
export type { CmsCheckboxProps, CmsCheckboxGroupProps, CmsCheckboxSize } from './cms-checkbox'
export { CmsToggle } from './cms-toggle'
export type { CmsToggleProps } from './cms-toggle'
export {
  CmsDatePicker,
  CmsDateRangePicker,
  formatAppDatepickerDisplay,
  formatAppDatepickerRangePlain,
} from './cms-datepicker'
export type {
  CmsDatePickerProps,
  CmsDatePickerRef,
  CmsDateRangePickerProps,
} from './cms-datepicker'
export {
  ViewModeToggle,
  ViewModeController,
} from '../components/view-mode'
export type {
  ViewMode,
  ViewModeToggleOption,
  ViewModeToggleProps,
  ViewModeControllerProps,
} from '../components/view-mode'
export {
  AppMultiSelect,
  APP_MULTI_SELECT_TAG_COLORS,
} from './app-multi-select'
export type { AppMultiSelectProps, AppMultiSelectOption } from './app-multi-select'
export { SegmentedTab } from './segmented-tab'
export type { SegmentedTabOption } from './segmented-tab'
export { ProgramCalendar } from '../components/program-calendar'
export type {
  ProgramCalendarProps,
  ProgramCalendarProgramProps,
  ProgramCalendarEventsProps,
  ProgramCalendarEventItem,
} from '../components/program-calendar'
export {
  CalendarSet,
  CALENDAR_FILTER_COLOR_CLASSES,
} from '../components/calendar'
export type { CalendarSetMainProps } from '../components/calendar'
export { LogoutIcon, GoogleMarkIcon, ProfileAvatarIcon } from './icons'
export type { LogoutIconProps, GoogleMarkIconProps, ProfileAvatarIconProps } from './icons'
