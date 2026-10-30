/** Vite가 workspace dist를 prebundle에 가두지 않고 감시하도록 한다. */
export const FORM_TEMPLATE_RUNTIME_OPTIMIZE_DEPS_EXCLUDE = [
  '@jakorea/form-template-runtime',
  '@jakorea/admin-ui',
] as const

export function formTemplateRuntimeWatchIgnored(id: string): boolean {
  const normalized = id.replace(/\\/g, '/')
  if (normalized.includes('/packages/form-template-runtime/')) return false
  if (normalized.includes('/node_modules/@jakorea/form-template-runtime/')) return false
  if (normalized.includes('/packages/admin-ui/')) return false
  if (normalized.includes('/node_modules/@jakorea/admin-ui/')) return false
  if (normalized.includes('/node_modules/')) return true
  if (normalized.includes('/.git/')) return true
  return false
}
