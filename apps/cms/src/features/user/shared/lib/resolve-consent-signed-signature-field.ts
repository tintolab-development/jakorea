export type ConsentSignedSignatureFieldRef = {
  fieldKey?: string
  signed?: boolean
  signedAt?: string
  signatureFileObjectId?: number
}

export type ResolvedConsentSignedSignatureField = {
  fieldKey: string
  signatureFileObjectId?: number
}

function trimmedFieldKey(field: ConsentSignedSignatureFieldRef): string | null {
  const key = field.fieldKey?.trim()
  return key ? key : null
}

function hasSignatureFile(field: ConsentSignedSignatureFieldRef): boolean {
  return field.signatureFileObjectId != null && Number.isFinite(field.signatureFileObjectId)
}

function isSignedField(field: ConsentSignedSignatureFieldRef): boolean {
  if (field.signed === false) return false
  if (field.signed === true) return true
  return Boolean(field.signedAt?.trim()) || hasSignatureFile(field)
}

/**
 * 포털 제출 전자서명 필드.
 * signed 플래그만 엄격히 보지 않는다 — BE가 signedAt/fileId만 주는 경우가 있다.
 */
export function resolveConsentSignedSignatureField(
  fields: ConsentSignedSignatureFieldRef[] | undefined
): ResolvedConsentSignedSignatureField | null {
  if (fields == null || fields.length === 0) return null

  const candidates = fields.filter(field => trimmedFieldKey(field) != null && isSignedField(field))
  const preferred =
    candidates.find(field => hasSignatureFile(field)) ?? candidates[0] ?? null
  if (preferred == null) return null
  const fieldKey = trimmedFieldKey(preferred)
  if (!fieldKey) return null
  return {
    fieldKey,
    ...(hasSignatureFile(preferred)
      ? { signatureFileObjectId: preferred.signatureFileObjectId }
      : {}),
  }
}

export function resolveConsentSignedSignatureFieldKey(
  fields: ConsentSignedSignatureFieldRef[] | undefined
): string | null {
  return resolveConsentSignedSignatureField(fields)?.fieldKey ?? null
}
