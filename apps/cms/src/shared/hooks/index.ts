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
  useRequirePermission,
} from './use-can-access'
export { useTableWithQuery } from './use-table-with-query'
export { useListCRUD } from './use-list-crud'
export type { UseListCRUDOptions, UseListCRUDReturn } from './use-list-crud'
export { useListFilters } from './use-list-filters'
export type { UseListFiltersOptions, UseListFiltersReturn, FilterConfig } from './use-list-filters'
export { useModalState } from './use-modal-state'
export type { UseModalStateOptions, UseModalStateReturn } from './use-modal-state'
export { useBreadcrumb } from './use-breadcrumb'
export type { UseBreadcrumbReturn } from './use-breadcrumb'
export { useNeisSchoolSearch } from './use-neis-school-search'
export type {
  UseNeisSchoolSearchOptions,
  UseNeisSchoolSearchReturn,
  NeisSchoolItem,
  NeisSchoolRow,
} from './use-neis-school-search'
export { useJusoAddressSearch } from './use-juso-address-search'
export type {
  UseJusoAddressSearchOptions,
  UseJusoAddressSearchReturn,
  JusoAddressItem,
  JusoAddressRow,
} from './use-juso-address-search'
