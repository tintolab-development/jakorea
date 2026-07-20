import { useCallback } from 'react'

export type SearchFilterBinding = {
  value: string
  onChange: (value: string) => void
}

export type UseSearchFiltersOptions<T extends Record<string, unknown>> = {
  params: T
  updateParams: (next: Partial<T>) => void
  defaultValues: Partial<T>
  filterKeys: readonly (keyof T)[]
  pageKey?: keyof T
}

function toStringValue(value: unknown) {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value)
}

export function useSearchFilters<T extends Record<string, unknown>>({
  params,
  updateParams,
  defaultValues,
  filterKeys,
  pageKey = 'page' as keyof T,
}: UseSearchFiltersOptions<T>) {
  const createBinding = useCallback(
    (key: keyof T): SearchFilterBinding => ({
      value: toStringValue(params[key]),
      onChange: (value: string) => {
        updateParams({
          [key]: value,
          [pageKey]: 1,
        } as Partial<T>)
      },
    }),
    [params, updateParams, pageKey]
  )

  const bindFilter = useCallback((key: keyof T) => createBinding(key), [createBinding])

  const bindSort = useCallback((key: keyof T) => createBinding(key), [createBinding])

  const reset = useCallback(() => {
    const resetPatch = filterKeys.reduce<Partial<T>>((acc, key) => {
      if (key in defaultValues) {
        acc[key] = defaultValues[key] as T[keyof T]
      }

      return acc
    }, {})

    updateParams({
      ...resetPatch,
      [pageKey]: 1,
    } as Partial<T>)
  }, [defaultValues, filterKeys, pageKey, updateParams])

  return {
    params,
    bindFilter,
    bindSort,
    reset,
  }
}
