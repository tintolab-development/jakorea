import type { SignupTermsCatalogResponse } from '../../model/types/signup-api.types'

export function resolveGuardianConsentVersion(
  catalog: SignupTermsCatalogResponse | null | undefined,
): string | null {
  const terms = catalog?.terms ?? []
  for (const item of terms) {
    if (item.termsType?.trim().toUpperCase() === 'GUARDIAN_CONSENT') {
      const version = item.version?.trim() || item.agreementPayload?.version?.trim()
      if (version) return version
    }
  }
  return null
}
