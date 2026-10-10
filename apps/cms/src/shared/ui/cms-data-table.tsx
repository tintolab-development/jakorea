/**
 * CMS 목록 표 — antd Table + `cms-data-table` 스타일 + 공통 empty(CmsTableEmptyState)
 */

import { useMemo } from 'react'
import { Table } from 'antd'
import type { TableProps } from 'antd/es/table'
import type { CmsTableEmptyVariant } from './cms-table-empty-copy'
import { renderCmsTableEmpty, type RenderCmsTableEmptyOptions } from './cms-table-empty-state'
import { useCmsTableEmptyVariantFromContext } from './cms-table-empty-variant-context'

export type CmsDataTableProps<RecordType extends object = object> = TableProps<RecordType> & {
  /**
   * `locale.emptyText` 미지정 시 사용. 목록 필터·검색 결과 없음은 `no-search`.
   * @default 'no-data'
   */
  emptyVariant?: CmsTableEmptyVariant
  /** empty 제목 override (`locale.emptyText`보다 우선하지 않음) */
  emptyTitle?: string
  /** empty 부제 override. `null`이면 부제 숨김 */
  emptyDescription?: string | null
  /** false면 ant Design 기본 empty */
  cmsEmpty?: boolean
}

function mergeClassName(className: string | undefined): string {
  const parts = className?.split(/\s+/).filter(Boolean) ?? []
  if (!parts.includes('cms-data-table')) {
    parts.unshift('cms-data-table')
  }
  return parts.join(' ')
}

function buildDefaultEmptyText(
  emptyVariant: CmsTableEmptyVariant,
  options?: RenderCmsTableEmptyOptions
) {
  return renderCmsTableEmpty(emptyVariant, options)
}

export function CmsDataTable<RecordType extends object = object>({
  className,
  locale,
  emptyVariant: emptyVariantProp,
  emptyTitle,
  emptyDescription,
  cmsEmpty = true,
  ...rest
}: CmsDataTableProps<RecordType>) {
  const emptyVariantFromContext = useCmsTableEmptyVariantFromContext()
  const emptyVariant: CmsTableEmptyVariant =
    emptyVariantProp ?? emptyVariantFromContext ?? 'no-data'

  const mergedLocale = useMemo(() => {
    if (!cmsEmpty) {
      return locale
    }
    if (locale?.emptyText !== undefined) {
      return locale
    }
    const emptyOptions: RenderCmsTableEmptyOptions | undefined =
      emptyTitle !== undefined || emptyDescription !== undefined
        ? { title: emptyTitle, description: emptyDescription }
        : undefined

    return {
      ...locale,
      emptyText: buildDefaultEmptyText(emptyVariant, emptyOptions),
    }
  }, [cmsEmpty, emptyDescription, emptyTitle, emptyVariant, locale])

  return (
    <Table<RecordType>
      {...rest}
      className={mergeClassName(className)}
      locale={mergedLocale}
    />
  )
}

/** antd Table 서브 컴포넌트(Summary 등) */
CmsDataTable.Summary = Table.Summary
