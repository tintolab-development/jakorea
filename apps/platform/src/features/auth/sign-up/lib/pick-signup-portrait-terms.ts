import type { SignupTermsCatalogResponse, SignupTermsDocument } from '../model/types/signup-api.types'

const PORTRAIT_TERMS_TYPES = new Set([
  'PORTRAIT_RIGHTS',
  'PORTRAIT',
  'IMAGE_RIGHTS',
  'RIGHTS_OF_PUBLICITY',
])

function normalizeTermsType(value: string | undefined): string {
  return value?.trim().toUpperCase() ?? ''
}

/** 회원가입 약관 원장에서 초상권 문서만 고른다. 게시 상태는 서버 카탈로그가 정본이다. */
export function pickSignupPortraitTermsDocument(
  catalog: SignupTermsCatalogResponse | null | undefined,
): SignupTermsDocument | null {
  const terms = catalog?.terms
  if (!Array.isArray(terms) || terms.length === 0) return null

  for (const doc of terms) {
    const termsType = normalizeTermsType(doc.agreementPayload?.termsType ?? doc.termsType)
    if (PORTRAIT_TERMS_TYPES.has(termsType)) return doc
  }
  return null
}
