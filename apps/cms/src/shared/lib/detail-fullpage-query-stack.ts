import type { DetailFullpageBreadcrumbItem } from '@/shared/ui/detail-fullpage-breadcrumb'

export type QueryParamValue = string | number | null | undefined

export function buildSearchParams(
  source: URLSearchParams,
  options: {
    set?: Record<string, QueryParamValue>
    delete?: readonly string[]
  } = {}
): URLSearchParams {
  const next = new URLSearchParams(source)

  options.delete?.forEach(key => {
    next.delete(key)
  })

  Object.entries(options.set ?? {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      next.delete(key)
      return
    }

    next.set(key, String(value))
  })

  return next
}

export function toSearchString(params: URLSearchParams): string {
  const search = params.toString()
  return search ? `?${search}` : ''
}

export function makeQueryTarget(
  pathname: string,
  params: URLSearchParams
): DetailFullpageBreadcrumbItem['to'] {
  return {
    pathname,
    search: toSearchString(params),
  }
}

export function makeBreadcrumbItem(
  label: string,
  pathname: string,
  params?: URLSearchParams
): DetailFullpageBreadcrumbItem {
  return params
    ? {
        label,
        to: makeQueryTarget(pathname, params),
      }
    : { label }
}
