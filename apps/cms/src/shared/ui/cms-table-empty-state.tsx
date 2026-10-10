import { CMS_TABLE_EMPTY_COPY, type CmsTableEmptyVariant } from './cms-table-empty-copy'
import { CmsTableEmptyNoDataIcon, CmsTableEmptyNoSearchIcon } from './cms-table-empty-icons'
import './cms-table-empty-state.css'

export type CmsTableEmptyStateProps = {
  variant: CmsTableEmptyVariant
  /** 미지정 시 variant 기본 문구 */
  title?: string
  /** 미지정 시 variant 기본 문구. `null`이면 부제 숨김 */
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
  const resolvedDescription =
    description === null ? null : (description ?? defaults.description)

  const rootClass = ['cms-table-empty-state', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass} role="status">
      <span className="cms-table-empty-state__icon" aria-hidden>
        {variant === 'no-search' ? (
          <CmsTableEmptyNoSearchIcon />
        ) : (
          <CmsTableEmptyNoDataIcon />
        )}
      </span>
      <div className="cms-table-empty-state__texts">
        <p className="cms-table-empty-state__title">{resolvedTitle}</p>
        {resolvedDescription ? (
          <p className="cms-table-empty-state__description">{resolvedDescription}</p>
        ) : null}
      </div>
    </div>
  )
}

export type RenderCmsTableEmptyOptions = {
  title?: string
  description?: string | null
}

/** Ant Design Table `locale.emptyText`용 */
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
