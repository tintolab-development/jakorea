export function readPreferredEducationFormChoice(runtimeContext: unknown): boolean | null {
  if (!runtimeContext || typeof runtimeContext !== 'object' || Array.isArray(runtimeContext)) {
    return null
  }
  const value = (runtimeContext as { showEducationFormChoice?: unknown })
    .showEducationFormChoice
  return typeof value === 'boolean' ? value : null
}

export function hasEducationFormatSystemField(formDocument: unknown): boolean {
  if (!formDocument || typeof formDocument !== 'object' || Array.isArray(formDocument)) {
    return false
  }
  const paragraphs = (formDocument as { paragraphs?: unknown }).paragraphs
  if (!Array.isArray(paragraphs)) return false
  return paragraphs.some(paragraph => {
    if (!paragraph || typeof paragraph !== 'object' || Array.isArray(paragraph)) return false
    const systemFieldKeys = (paragraph as { systemFieldKeys?: unknown }).systemFieldKeys
    return Array.isArray(systemFieldKeys) && systemFieldKeys.includes('educationFormat')
  })
}

export function shouldShowPreferredEducationForm(input: {
  formDocument: unknown
  runtimeContext: unknown
  legacyEducationForm?: string | null
}): boolean {
  if (!hasEducationFormatSystemField(input.formDocument)) return false
  return (
    readPreferredEducationFormChoice(input.runtimeContext) ??
    input.legacyEducationForm === 'participant_choice'
  )
}

export function isEducationFormatErrorField(field: string | null): boolean {
  return field === 'educationFormat' || field?.endsWith('.educationFormat') === true
}
