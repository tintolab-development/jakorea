import {
  AdminEmptyNoDataIcon,
  AdminEmptyNoSearchIcon,
  AdminEmptyState,
} from '@jakorea/admin-ui/empty'
import { CMS_TABLE_EMPTY_COPY, type CmsTableEmptyVariant } from './cms-table-empty-copy'

export type CmsTableEmptyStateProps = {
  variant: CmsTableEmptyVariant
  title?: string
  description?: string | null
  className?: string
}

export function CmsTableEmptyState({
  variant,
  title,
  description,
  className,
}: CmsTableEmptyStateProps) {
  const defaults = CMS_TABLE_EMPTY_COPY[variant]
  const resolvedTitle = title ?? defaults.title
  const resolvedDescription = description === null ? null : (description ?? defaults.description)

  return (
    <AdminEmptyState
      className={className}
      title={resolvedTitle}
      description={resolvedDescription}
      variant={variant}
      icon={variant === 'no-search' ? <AdminEmptyNoSearchIcon /> : <AdminEmptyNoDataIcon />}
    />
  )
}

export type RenderCmsTableEmptyOptions = {
  title?: string
  description?: string | null
}

export function renderCmsTableEmpty(
  variant: CmsTableEmptyVariant,
  options?: RenderCmsTableEmptyOptions
) {
  return (
    <CmsTableEmptyState
      variant={variant}
      title={options?.title}
      description={options?.description}
    />
  )
}
