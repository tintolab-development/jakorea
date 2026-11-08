import { useMemo } from 'react'
import { AdminDataTable, type AdminDataTableProps } from '@jakorea/admin-ui/table'
import type { CmsTableEmptyVariant } from './cms-table-empty-copy'
import { renderCmsTableEmpty, type RenderCmsTableEmptyOptions } from './cms-table-empty-state'
import { useCmsTableEmptyVariantFromContext } from './cms-table-empty-variant-context'

export type CmsDataTableProps<RecordType extends object = object> = AdminDataTableProps<RecordType> & {
  emptyVariant?: CmsTableEmptyVariant
  emptyTitle?: string
  emptyDescription?: string | null
  cmsEmpty?: boolean
}

export function CmsDataTable<RecordType extends object = object>({
  locale,
  emptyVariant: emptyVariantProp,
  emptyTitle,
  emptyDescription,
  cmsEmpty = true,
  emptyText,
  exactColumnWidths = true,
  ...rest
}: CmsDataTableProps<RecordType>) {
  const emptyVariantFromContext = useCmsTableEmptyVariantFromContext()
  const emptyVariant: CmsTableEmptyVariant =
    emptyVariantProp ?? emptyVariantFromContext ?? 'no-data'

  const mergedEmptyText = useMemo(() => {
    if (emptyText !== undefined) return emptyText
    if (!cmsEmpty) return undefined
    if (locale?.emptyText !== undefined) return locale.emptyText
    const emptyOptions: RenderCmsTableEmptyOptions | undefined =
      emptyTitle !== undefined || emptyDescription !== undefined
        ? { title: emptyTitle, description: emptyDescription }
        : undefined
    return renderCmsTableEmpty(emptyVariant, emptyOptions)
  }, [cmsEmpty, emptyDescription, emptyText, emptyTitle, emptyVariant, locale?.emptyText])

  const mergedLocale =
    locale?.emptyText !== undefined || !cmsEmpty
      ? locale
      : mergedEmptyText !== undefined
        ? { ...locale, emptyText: mergedEmptyText }
        : locale

  /**
   * CMS 공통: 열 `width`를 넓은 화면에서도 그대로 사용(균등 분배 없음).
   * 남는 폭은 width 미지정 열(유연 열 · `minWidth`만 지정)이 흡수. 좁으면 max(열 합, 1080)에서 가로 스크롤.
   * 열 종류별 폭은 `TABLE_COLUMN_WIDTHS`(shared/constants/table) 기준.
   */
  return (
    <AdminDataTable<RecordType>
      {...rest}
      exactColumnWidths={exactColumnWidths}
      locale={mergedLocale}
    />
  )
}

CmsDataTable.Summary = AdminDataTable.Summary
