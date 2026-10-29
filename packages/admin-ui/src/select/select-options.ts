import type { SelectProps } from 'antd'

export const ADMIN_SELECT_ALL_OPTION = { label: '전체', value: '' as const }

export type AdminSelectOptionPolicy = {
  includeAllOption: boolean
  stripSentinelWhenNoAllOption: boolean
}

export const CMS_SELECT_OPTION_POLICY: AdminSelectOptionPolicy = {
  includeAllOption: true,
  stripSentinelWhenNoAllOption: true,
}

export const ADMIN_APP_SELECT_OPTION_POLICY: AdminSelectOptionPolicy = {
  includeAllOption: false,
  stripSentinelWhenNoAllOption: false,
}

export function isAllSentinelOption(opt: unknown): boolean {
  if (opt == null || typeof opt !== 'object') return false
  const o = opt as { value?: unknown; label?: unknown; options?: unknown[] }
  if (Array.isArray(o.options)) return false
  const value = String(o.value ?? '').trim()
  return value === '' || value === 'ALL'
}

export function stripAllSentinelOptions(options: SelectProps['options']): SelectProps['options'] {
  if (!Array.isArray(options)) return options
  return options.filter(opt => !isAllSentinelOption(opt))
}

export function optionsIncludeEmptyValueOption(options: SelectProps['options']): boolean {
  if (!Array.isArray(options)) return false
  return options.some(opt => {
    if (opt == null || typeof opt !== 'object') return false
    const o = opt as { value?: unknown; options?: unknown[] }
    if (Array.isArray(o.options)) {
      return o.options.some(
        item =>
          item != null &&
          typeof item === 'object' &&
          'value' in item &&
          (item as { value: unknown }).value === ''
      )
    }
    return o.value === ''
  })
}

function firstFlatOption(options: SelectProps['options']): Record<string, unknown> | null {
  if (!Array.isArray(options) || options.length === 0) return null
  const first = options[0]
  if (first == null || typeof first !== 'object') return null
  const o = first as { options?: unknown[] }
  if (Array.isArray(o.options)) return null
  return first as Record<string, unknown>
}

export function optionsAlreadyStartWithAllLabel(options: SelectProps['options']): boolean {
  const first = firstFlatOption(options)
  if (!first) return false
  return first.label === '전체'
}

export function resolveSelectOptionPolicy(args: {
  withAllOption?: boolean
  stripSentinelOptions?: boolean
  optionPolicy?: AdminSelectOptionPolicy
}): AdminSelectOptionPolicy {
  const base = args.optionPolicy ?? CMS_SELECT_OPTION_POLICY
  return {
    includeAllOption: args.withAllOption ?? base.includeAllOption,
    stripSentinelWhenNoAllOption: args.stripSentinelOptions ?? base.stripSentinelWhenNoAllOption,
  }
}

export function mergeSelectOptions(
  options: SelectProps['options'],
  mode: SelectProps['mode'] | undefined,
  policy: AdminSelectOptionPolicy
): SelectProps['options'] {
  if (mode === 'multiple' || mode === 'tags') return options
  if (!policy.includeAllOption) {
    if (policy.stripSentinelWhenNoAllOption) return stripAllSentinelOptions(options)
    return options
  }
  if (!Array.isArray(options)) return options
  if (optionsIncludeEmptyValueOption(options)) return options
  if (optionsAlreadyStartWithAllLabel(options)) return options
  return [ADMIN_SELECT_ALL_OPTION, ...options]
}

export function mapClearedSelectValue(args: {
  next: unknown
  mode: SelectProps['mode'] | undefined
  optionsHaveEmptyValue: boolean
}): unknown {
  const isMulti = args.mode === 'multiple' || args.mode === 'tags'
  if (!args.optionsHaveEmptyValue && !isMulti && (args.next === undefined || args.next === null)) {
    return ''
  }
  return args.next
}
