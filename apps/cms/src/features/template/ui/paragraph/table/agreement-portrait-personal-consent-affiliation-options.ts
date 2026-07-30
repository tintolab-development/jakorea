export function resolvePortraitAffiliationSelectOptions(
  affiliation: string,
  affiliationSelectOptions?: ReadonlyArray<{ value: string; label: string }>
): { value: string; label: string }[] {
  const base = affiliationSelectOptions != null ? [...affiliationSelectOptions] : []
  const trimmedAffiliation = affiliation.trim()
  if (trimmedAffiliation !== '' && !base.some(option => option.value === trimmedAffiliation)) {
    base.push({ value: trimmedAffiliation, label: trimmedAffiliation })
  }
  if (base.length > 0) return base
  if (trimmedAffiliation !== '') {
    return [{ value: trimmedAffiliation, label: trimmedAffiliation }]
  }
  return []
}
