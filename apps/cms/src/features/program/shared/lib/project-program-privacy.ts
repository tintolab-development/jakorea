const RESTRICTED_KEYS = new Set([
  'accountnumber',
  'accountno',
  'accountholder',
  'bankaccount',
  'bankaccounts',
  'depositaccount',
  'residentregistrationnumber',
  'residentnumber',
  'residentid',
  'rrn',
  'socialsecuritynumber',
  'jumin',
])

function isRestrictedKey(key: string): boolean {
  return RESTRICTED_KEYS.has(key.replace(/[_-]/g, '').toLowerCase())
}

function isMasked(value: string): boolean {
  return value.includes('*')
}

export interface ProgramPrivacyProjection<T> {
  value: T
  leakedFields: string[]
}

function projectNode(value: unknown, path: string, leaked: string[]): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) => projectNode(item, `${path}[${index}]`, leaked))
  }
  if (value == null || typeof value !== 'object') return value
  const next: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = path ? `${path}.${key}` : key
    if (isRestrictedKey(key)) {
      if (typeof child === 'string' && child.trim() && !isMasked(child)) {
        leaked.push(childPath)
      } else if (child != null && typeof child === 'object') {
        leaked.push(childPath)
      }
      continue
    }
    next[key] = projectNode(child, childPath, leaked)
  }
  return next
}

/** 캐시에 넣기 전에 주민번호·계좌 필드를 제거한다. select가 아니다. */
export function projectProgramPrivacyValue<T>(value: T, allowSensitive: boolean): ProgramPrivacyProjection<T> {
  if (allowSensitive) return { value, leakedFields: [] }
  const leakedFields: string[] = []
  return {
    value: projectNode(value, '', leakedFields) as T,
    leakedFields,
  }
}

export function reportProgramPrivacyLeak(leakedFields: string[]): void {
  if (leakedFields.length === 0) return
  console.error('BE_PRIVACY_FIELD_LEAK', leakedFields)
}
