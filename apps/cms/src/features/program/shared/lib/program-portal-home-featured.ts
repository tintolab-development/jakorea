import type { Program } from '@/types/domain'

export type ProgramPortalHomeFeaturedRequestBody = {
  featuredOnHome?: boolean | null
  homeDisplayOrder?: number | null
  clearFields?: string[] | null
}

export function parsePortalHomeDisplayOrder(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    if (Number.isInteger(parsed) && parsed >= 1) return parsed
  }
  return null
}

export function portalHomeFeaturedFormValues(program: Program): {
  featuredOnHome: boolean
  homeDisplayOrder: string
} {
  const featured = program.featuredOnHome === true
  const order = parsePortalHomeDisplayOrder(program.homeDisplayOrder)
  return {
    featuredOnHome: featured,
    homeDisplayOrder: featured && order != null ? String(order) : '',
  }
}

export function portalHomeFeaturedProgramPatch(values: {
  featuredOnHome: boolean
  homeDisplayOrder?: string | number | null
}): Pick<Program, 'featuredOnHome' | 'homeDisplayOrder'> {
  const featured = values.featuredOnHome === true
  return {
    featuredOnHome: featured,
    homeDisplayOrder: featured ? parsePortalHomeDisplayOrder(values.homeDisplayOrder) : null,
  }
}

function patchTouchesPortalHomeFeatured(patch?: Partial<Program>): boolean {
  if (!patch) return true
  return (
    Object.prototype.hasOwnProperty.call(patch, 'featuredOnHome') ||
    Object.prototype.hasOwnProperty.call(patch, 'homeDisplayOrder')
  )
}

function appendClearField(body: ProgramPortalHomeFeaturedRequestBody, field: string): void {
  const next = [...(body.clearFields ?? [])]
  if (!next.includes(field)) next.push(field)
  body.clearFields = next
}

/** Create 전체 직렬화 또는 PATCH(키가 있을 때만)에 Platform 홈 노출 컬럼을 싣는다. */
export function applyPortalHomeFeaturedToRequest(
  body: ProgramPortalHomeFeaturedRequestBody,
  program: Program,
  mode: 'full' | 'patch',
  patch?: Partial<Program>
): void {
  if (mode === 'patch' && !patchTouchesPortalHomeFeatured(patch)) return

  const featured = program.featuredOnHome === true
  body.featuredOnHome = featured
  if (!featured) {
    body.homeDisplayOrder = null
    return
  }

  const order = parsePortalHomeDisplayOrder(program.homeDisplayOrder)
  if (order != null) {
    body.homeDisplayOrder = order
    return
  }

  body.homeDisplayOrder = null
  appendClearField(body, 'homeDisplayOrder')
}
