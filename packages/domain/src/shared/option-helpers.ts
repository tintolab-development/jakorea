import type { DomainSelectOption } from './types'

export function getLabel<T extends string>(
  options: readonly DomainSelectOption<T>[],
  value: T
): string {
  return options.find((option) => option.value === value)?.label ?? value
}

export function pickOptions<T extends string>(
  options: readonly DomainSelectOption<T>[],
  ...values: T[]
): DomainSelectOption<T>[] {
  const valueSet = new Set(values)
  return options.filter((option) => valueSet.has(option.value))
}

export function withAllFilter<T extends string>(
  options: readonly DomainSelectOption<T>[],
  allValue: string = 'all',
  allLabel = '전체'
): DomainSelectOption<string>[] {
  return [{ value: allValue, label: allLabel }, ...options]
}
