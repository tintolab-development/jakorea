/**
 * 공통 UI 컴포넌트 export
 */

export { SingleCTA } from './single-cta'
export { GuideAlert, GuideParagraph } from './guide-alert'
export { EmptyState } from './empty-state'
export { ConfirmModal } from './confirm-modal'
export { ActionResultModal } from './action-result-modal'
export type { ActionResultModalProps } from './action-result-modal'
export { AlertModal } from './alert-modal'
export type { AlertModalProps } from './alert-modal'
export { CmsModal } from './cms-modal'
export type { CmsModalProps, CmsModalButton } from './cms-modal'
export { cmsAlertModal, isCmsAlertModalReady } from './cms-alert-modal-api'
export type { CmsAlertModalShowOptions } from './cms-alert-modal-api'
export { CmsAlertModalProvider, useCmsAlert } from './cms-alert-modal-provider'
export type { CmsAlertModalContextValue } from './cms-alert-modal-provider'
export {
  buildRegisterCompletedTitle,
  buildRegisterCompletedMessage,
  buildDeleteCompletedTitle,
  buildDeleteCompletedMessageSingle,
  buildDeleteCompletedMessageBulk,
} from './action-result-messages'
export { DeleteGuideModal } from './delete-guide-modal'
export type { DeleteGuideModalProps } from './delete-guide-modal'
export { ProgramHistoryDeleteBlockedModal } from './program-history-delete-blocked-modal'
export type { ProgramHistoryDeleteBlockedModalProps } from './program-history-delete-blocked-modal'
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
  type ProgramProgressHistoryDeleteDomain,
  type ProgramProgressHistoryDeleteGuide,
} from './program-progress-history-delete-guide'
export { InquiryModal } from './inquiry-modal'
export { ProfileEditModal } from './profile-edit-modal'
export {
  getRoleLabel,
  getAdminLevelLabel,
  getProgramRoleLabel,
} from './role-labels'
export { BaseDetailDrawer } from './base-detail-drawer'
export type { BaseDetailDrawerProps, DrawerAction } from './base-detail-drawer'
export { ListPageFilters } from './list-page-filters'
export type { ListPageFiltersProps, FilterConfig, FilterOption } from './list-page-filters'
export type { FilterFieldConfig } from '../components/filter-table-layout'
export { TableFilterGroup } from '../components/table-filter-group'
export type { TableFilterGroupProps } from '../components/table-filter-group'
export { FilterTableLayout } from '../components/filter-table-layout'
export type {
  FilterTableLayoutProps,
  FilterTableExcelExportConfig,
} from '../components/filter-table-layout'
export { ListPageLayout } from '../components/list-page'
export type { ListPageLayoutProps } from '../components/list-page'
export { LabeledSearchInput } from './labeled-search-input'
export type { LabeledSearchInputProps } from './labeled-search-input'
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
export type { ModalSize, TealHeaderModalProps } from './teal-header-modal'
export { ContentModal } from './content-modal'
export type { ContentModalProps } from './content-modal'
export { ModalSpecTable, ModalSpecTableRow, ModalSpecTableRadioCell } from './modal-spec-table'
export type {
  ModalSpecTableProps,
  ModalSpecTableRowProps,
  ModalSpecTableLabelVariant,
  ModalSpecTableRadioCellProps,
  ModalSpecTableRadioOption,
} from './modal-spec-table'
export {
  AppDatePicker,
  AppDateRangePicker,
  DEFAULT_APP_DATE_PLACEHOLDER,
} from './app-datepicker'
export type { AppDatePickerProps, AppDateRangePickerProps } from './app-datepicker'
export { LoadingButton } from './loading-button'
export {
  CmsButton,
  CMS_ACTION_BUTTON_WIDTH,
  CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH,
} from './cms-button'
export type { CmsButtonProps, CmsButtonVariant, CmsButtonSize } from './cms-button'
export { ExcelButton } from './excel-button'
export type { ExcelButtonProps } from './excel-button'
export { CmsInput } from './cms-input'
export type { CmsInputProps, CmsInputSize } from './cms-input'
export { CmsNumericInput } from './numeric-input'
export type { CmsNumericInputProps } from './numeric-input'
export type { NumericInputMode } from '../lib/numeric-input'
export {
  CmsDateTextInput,
  DateTextInput,
  birthDateFormValueToApi,
  isBirthDateInputIncomplete,
  isValidBirthDateFormValue,
  isValidCalendarDate,
  normalizeDateTextInputOnBlur,
  sanitizeDateTextInput,
} from './date-text-input'
export type { CmsDateTextInputProps, DateTextInputProps } from './date-text-input'
export { CmsInputIconClick } from './cms-input-iconclick'
export { CmsTextArea } from './cms-textarea'
export type { CmsTextAreaProps, CmsTextAreaSize } from './cms-textarea'
export { CmsInputSearch } from './cms-input-search'
export type { CmsInputSearchProps } from './cms-input-search'
export { AddressSearch } from './address-search'
export type { AddressSearchProps } from './address-search'
export { SchoolSearch } from './school-search'
export type { SchoolSearchProps, SchoolSearchSelection } from './school-search'
export { CmsCompactPagination } from './cms-compact-pagination'
export type { CmsCompactPaginationProps } from './cms-compact-pagination'
export type { CmsControlSize } from './cms-control-size'
export { CmsSelect, CMS_MULTI_SELECT_TAG_COLORS } from './cms-select'
export type { CmsSelectProps } from './cms-select'
export type { CmsSelectMultipleOption } from './cms-select-multiple'
export { CmsRadio, CmsRadioGroup, CmsRadioButton } from './cms-radio'
export type {
  CmsRadioProps,
  CmsRadioGroupProps,
  CmsRadioSize,
  CmsRadioButtonProps,
} from './cms-radio'
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
export { SegmentedTab } from './segmented-tab'
export type { SegmentedTabOption } from './segmented-tab'
export { CmsTextTabs } from './cms-text-tabs'
export type { CmsTextTabItem, CmsTextTabsProps, CmsTextTabsVariant } from './cms-text-tabs'
export {
  CalendarSet,
  CalendarMain,
  CALENDAR_FILTER_COLOR_CLASSES,
} from '../components/calendar'
export type { CalendarMainEventInput } from '../components/calendar'
export type { CalendarSetMainProps } from '../components/calendar'
export { LogoutIcon, GoogleMarkIcon, ProfileAvatarIcon } from './icons'
export type { LogoutIconProps, GoogleMarkIconProps, ProfileAvatarIconProps } from './icons'
export {
  AttachmentDownloadIcon,
  AttachmentClipIcon,
  FileDownloadRowIcon,
  CommentEmojiToggleIcon,
  CommentSendIcon,
} from './icons'
export type {
  AttachmentDownloadIconProps,
  AttachmentClipIconProps,
  FileDownloadRowIconProps,
} from './icons'
export {
  REACTION_EMOJI_ITEMS,
  REACTION_EMOJI_TYPE_TO_INDEX,
  getReactionEmojiItemByType,
  ReactionEmojiPicker,
  ReactionUserList,
  CommentList,
  CommentComposer,
  AttachmentDownloadList,
} from './posts'
export type {
  ReactionEmojiItem,
  ReactionEmojiPickerProps,
  ReactionUserListProps,
  ReactionUserListRow,
  ReactionUserListSummaryItem,
  CommentListProps,
  CommentListItem,
  CommentComposerProps,
  AttachmentDownloadListProps,
  AttachmentDownloadItem,
} from './posts'
export { CrossTable } from './cross-table'
export type { CrossTableProps, CrossTableRow } from './cross-table'
