export function mergeAdminDataTableClassName(className: string | undefined): string {
  const parts = className?.split(/\s+/).filter(Boolean) ?? []
  if (!parts.includes('cms-data-table')) {
    parts.unshift('cms-data-table')
  }
  return parts.join(' ')
}
