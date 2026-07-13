import {
  EMAIL_ID_BRAND_TOKENS,
  EMAIL_ID_DOMAIN_PATTERN,
  EMAIL_ID_INAPPROPRIATE_TOKENS,
  EMAIL_ID_LOCAL_PART_MAX_LENGTH,
  EMAIL_ID_LOCAL_PART_PATTERN,
  EMAIL_ID_MAX_LENGTH,
  EMAIL_ID_MESSAGES,
  EMAIL_ID_RESERVED_LOCAL_PARTS,
} from './constants'

export type EmailIdErrorCode =
  | 'empty'
  | 'whitespace'
  | 'invalid_format'
  | 'length_exceeded'
  | 'forbidden'

export type EmailIdValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; code: EmailIdErrorCode; message: string }

function compactLocalPart(localPart: string) {
  return localPart.replace(/[-_.+]/g, '')
}

function isForbiddenLocalPart(localPart: string) {
  if (EMAIL_ID_RESERVED_LOCAL_PARTS.includes(localPart as (typeof EMAIL_ID_RESERVED_LOCAL_PARTS)[number])) {
    return true
  }

  const compact = compactLocalPart(localPart)

  for (const token of EMAIL_ID_BRAND_TOKENS) {
    if (compact === token || compact.includes(token)) {
      return true
    }
  }

  for (const token of EMAIL_ID_INAPPROPRIATE_TOKENS) {
    if (compact.includes(token)) {
      return true
    }
  }

  return false
}

function isValidDomain(domain: string) {
  if (!domain.includes('.')) {
    return false
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
    return false
  }

  if (domain.includes('..')) {
    return false
  }

  const labels = domain.split('.')

  if (labels.some((label) => label.length === 0)) {
    return false
  }

  const tld = labels.at(-1)

  if (!tld || tld.length < 2) {
    return false
  }

  return EMAIL_ID_DOMAIN_PATTERN.test(domain)
}

function isValidLocalPart(localPart: string) {
  if (localPart.length === 0) {
    return false
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false
  }

  if (localPart.includes('..')) {
    return false
  }

  return EMAIL_ID_LOCAL_PART_PATTERN.test(localPart)
}

export function normalizeEmailId(raw: string) {
  return raw.trim().toLowerCase()
}

export function validateEmailId(raw: string): EmailIdValidationResult {
  const trimmed = raw.trim()

  if (/\s/.test(trimmed)) {
    return {
      ok: false,
      code: 'whitespace',
      message: EMAIL_ID_MESSAGES.whitespace,
    }
  }

  const normalized = trimmed.toLowerCase()

  if (!normalized) {
    return {
      ok: false,
      code: 'empty',
      message: EMAIL_ID_MESSAGES.empty,
    }
  }

  const atCount = (normalized.match(/@/g) ?? []).length

  if (atCount !== 1) {
    return {
      ok: false,
      code: 'invalid_format',
      message: EMAIL_ID_MESSAGES.invalidFormat,
    }
  }

  const [localPart, domain] = normalized.split('@')

  if (!localPart || !domain) {
    return {
      ok: false,
      code: 'invalid_format',
      message: EMAIL_ID_MESSAGES.invalidFormat,
    }
  }

  if (normalized.length > EMAIL_ID_MAX_LENGTH) {
    return {
      ok: false,
      code: 'length_exceeded',
      message: EMAIL_ID_MESSAGES.lengthExceeded,
    }
  }

  if (localPart.length > EMAIL_ID_LOCAL_PART_MAX_LENGTH) {
    return {
      ok: false,
      code: 'invalid_format',
      message: EMAIL_ID_MESSAGES.invalidFormat,
    }
  }

  if (!EMAIL_ID_LOCAL_PART_PATTERN.test(localPart) || !EMAIL_ID_DOMAIN_PATTERN.test(domain)) {
    return {
      ok: false,
      code: 'invalid_format',
      message: EMAIL_ID_MESSAGES.invalidFormat,
    }
  }

  if (isForbiddenLocalPart(localPart)) {
    return {
      ok: false,
      code: 'forbidden',
      message: EMAIL_ID_MESSAGES.forbidden,
    }
  }

  if (!isValidLocalPart(localPart) || !isValidDomain(domain)) {
    return {
      ok: false,
      code: 'invalid_format',
      message: EMAIL_ID_MESSAGES.invalidFormat,
    }
  }

  return {
    ok: true,
    normalized,
  }
}

export function isValidEmailId(raw: string) {
  return validateEmailId(raw).ok
}
