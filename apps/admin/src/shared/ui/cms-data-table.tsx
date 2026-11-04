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

  return <AdminDataTable<RecordType> {...rest} locale={mergedLocale} />
}

CmsDataTable.Summary = AdminDataTable.Summary
