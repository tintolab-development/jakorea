/**
 * 공유 훅 export
 */

export { useQueryParams } from './use-query-params'
export { useRequireRole, useRequireAnyRole } from './use-require-role'
export {
  useCanAccess,
  useCanAccessAny,
  useCanAccessAll,
  useCanAccessPath,
  useRequirePermission } from './use-can-access'
export { useTableWithQuery } from './use-table-with-query'
export { useTableSearch } from './use-table-search'
export type {
  TableSearchParamRule,
  TableSearchParamRuleApply,
  TableSearchParamRuleParam,
  TableSearchSetSearchParams,
  UseTableSearchOptions,
  UseTableSearchReturn } from './use-table-search'
export { useListFilters } from './use-list-filters'
export type { UseListFiltersOptions, UseListFiltersReturn, FilterConfig } from './use-list-filters'
export { useModalState } from './use-modal-state'
export type { UseModalStateOptions, UseModalStateReturn } from './use-modal-state'
export { useBreadcrumb } from './use-breadcrumb'
export type { UseBreadcrumbReturn } from './use-breadcrumb'
export { useNeisSchoolSearch } from '@jakorea/location/neis/react'
export type {
  UseNeisSchoolSearchOptions,
  UseNeisSchoolSearchReturn,
  NeisSchoolItem,
  NeisSchoolRow,
} from '@jakorea/location/neis'
export { filterNeisSchoolsByRegion } from '@jakorea/location/neis'
export {
  getSidoMatchTokens,
  matchesSidoInText,
  SIDO_MATCH_TOKENS,
} from '@jakorea/location/sido-sigungu'
export { useJusoAddressSearch } from '@jakorea/location/juso/react'
export { JUSO_BUSINESS_ADDR_LINK_API_URL } from '@jakorea/location/juso'
export type {
  UseJusoAddressSearchOptions,
  UseJusoAddressSearchReturn,
  JusoAddressItem,
  JusoAddressRow,
} from '@jakorea/location/juso'
export {
  readJusoConfmKeyFromEnv,
  readJusoApiUrlFromEnv,
  readNeisApiKeyFromEnv,
  getCmsJusoMissingKeyMessage,
  getCmsNeisMissingKeyMessage,
} from '@/shared/lib/location-env'
export { useObjectUrlFromFile } from './use-object-url-from-file'
export { useFormInputsWidth } from './use-form-inputs-width'
export type { FormInputsWidthOptions } from './use-form-inputs-width'
export { useDeleteGuideMessages } from './use-delete-guide-messages'
export { useTableExcelExport } from './use-table-excel-export'
export type {
  TableExcelExporter,
  UseTableExcelExportOptions,
} from './use-table-excel-export'
