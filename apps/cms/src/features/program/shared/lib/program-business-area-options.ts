import { BUSINESS_AREA_OPTIONS, normalizeProgramBusinessAreaValue } from './program-detail-info-constants'
import { TEMPLATE_FORM_BUSINESS_AREA_OPTIONS } from '@/features/template/lib/template-form-select-options'

export type ProgramBusinessAreaOption = { value: string; label: string; disabled?: boolean }
export type BusinessAreaCatalogState =
  | { kind: 'legacy' }
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'ready'; names: readonly string[] }

export function businessAreaCatalogState(input: {
  enabled: boolean
  failed: boolean
  forbidden: boolean
  names?: readonly string[]
}): BusinessAreaCatalogState {
  if (!input.enabled || (input.failed && input.forbidden)) return { kind: 'legacy' }
  if (input.failed) return { kind: 'unavailable' }
  if (input.names === undefined) return { kind: 'loading' }
  return { kind: 'ready', names: input.names }
}

/** Never erase current values or silently select a different area on a catalog refresh. */
export function resolveProgramBusinessAreaOptions(
  state: BusinessAreaCatalogState,
  currentValue: string | null | undefined,
  format: 'form' | 'master'
): ProgramBusinessAreaOption[] {
  const selected = currentValue?.trim() ?? ''
  const selectedName = normalizeProgramBusinessAreaValue(selected)
  const legacy = format === 'form' ? TEMPLATE_FORM_BUSINESS_AREA_OPTIONS : BUSINESS_AREA_OPTIONS
  const options: ProgramBusinessAreaOption[] = []
  const seen = new Set<string>()
  const add = (option: ProgramBusinessAreaOption, canonical: string) => {
    if (seen.has(canonical)) return
    seen.add(canonical)
    options.push(selected && selectedName === canonical ? { ...option, value: selected } : option)
  }
  if (state.kind === 'legacy') {
    for (const option of legacy) add(option, normalizeProgramBusinessAreaValue(option.value))
  } else if (state.kind === 'ready') {
    for (const raw of state.names) {
      const name = raw.trim()
      if (!name) continue
      const knownForm = format === 'form'
        ? TEMPLATE_FORM_BUSINESS_AREA_OPTIONS.find(option => normalizeProgramBusinessAreaValue(option.value) === name)
        : undefined
      add({ label: name, value: knownForm?.value ?? name }, name)
    }
  }
  if (selected && !options.some(option => option.value === selected)) {
    options.unshift({ value: selected, label: selectedName || selected, disabled: true })
  }
  return options
}
