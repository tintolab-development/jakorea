/**
 * MEMBER actorId가 있을 때 서버가 채우는 본문 토큰.
 * DIRECT에는 enrich가 없다.
 */
export const ALIMTALK_MEMBER_ENRICHABLE_PLACEHOLDER_KEYS = new Set([
  '회원명',
  '수신자명',
  '사용자 아이디(이메일)',
  '이메일',
  'email',
  '휴대폰 번호',
  '전화번호',
  'phone',
])

/**
 * SYSTEM/자동발송 카탈로그 키. 수동 입력·variables 덮어쓰기 금지.
 * 값 존재는 FE가 확인하지 못하므로 발송 가능으로 간주하지 않는다.
 */
export const NOTIFICATION_SYSTEM_CATALOG_VARIABLE_KEYS = new Set([
  '로그인 실패 횟수',
  '마지막 로그인 실패일시',
  '로그인 잠금 종료일시',
  '관리자 2단계 인증 실패 횟수',
  '관리자 마지막 2단계 인증 일시',
  '관리자 2단계 인증 코드 생성일시',
  '동의 항목',
  '만료일시',
  '동의 철회일시',
  '동의 철회 항목',
  '동의 철회 일시',
  '휴면 전환일시',
  '본인인증 일시',
  '생년월일',
  '성별',
  '사용자 휴대폰 번호',
  '마지막 로그인 일시',
  '탈퇴 처리예정일시',
  '사용자 이메일',
  '서비스 탈퇴일시',
  '회원 유형',
  '서비스 가입일시',
  '서비스명',
  'UJAT 프로그램 기관 일정 확인 현황',
  'UJAT 프로그램 기관 일정 수정사항',
  'UJAT 봉사자 출석 현황',
  '프로그램 수료 현황',
  '피드백 내용',
])

/** Create.variables / 수신자 variables에 넣으면 NOTIFICATION_SERVER_RESERVED_VARIABLE */
export const NOTIFICATION_SERVER_RESERVED_VARIABLE_KEYS = new Set([
  ...ALIMTALK_MEMBER_ENRICHABLE_PLACEHOLDER_KEYS,
  ...NOTIFICATION_SYSTEM_CATALOG_VARIABLE_KEYS,
  '프로그램명',
  '소속명',
  '담당교사명',
])

const PROGRAM_CONTEXT_KEYS = new Set(['프로그램명', '소속명', '담당교사명'])

export type AlimtalkVariableCatalogEntry = {
  key: string
  token?: string
  categoryCode?: string
  enabled?: boolean
  requiresProgram?: boolean
}

export type AlimtalkPlaceholderDisposition =
  | 'server'
  | 'manual'
  | 'blocked'
  | 'needs-program'
  | 'pending'

type RecipientLike = {
  actorType?: string
  actorId?: number
  source?: string
  name?: string
  phone?: string
  email?: string
  variables?: Record<string, string> | null
}

type VariableRecipient = RecipientLike & { id: string }

export function isDirectAlimtalkRecipient(recipient: RecipientLike): boolean {
  const actorType = (recipient.actorType || '').trim().toUpperCase()
  return (
    recipient.source === 'manual' || actorType === 'DIRECT' || !Number.isFinite(recipient.actorId)
  )
}

export function isAlimtalkSystemVariableKey(
  key: string,
  catalog?: AlimtalkVariableCatalogEntry[] | null
): boolean {
  const trimmed = key.trim()
  if (NOTIFICATION_SYSTEM_CATALOG_VARIABLE_KEYS.has(trimmed)) return true
  const item = findCatalogEntry(catalog, trimmed)
  return item?.categoryCode?.trim().toUpperCase() === 'SYSTEM'
}

export function isAlimtalkReservedVariableKey(key: string): boolean {
  return NOTIFICATION_SERVER_RESERVED_VARIABLE_KEYS.has(key.trim())
}

function findCatalogEntry(
  catalog: AlimtalkVariableCatalogEntry[] | null | undefined,
  key: string
): AlimtalkVariableCatalogEntry | undefined {
  if (!catalog) return undefined
  return catalog.find(item => {
    if (item.key.trim() === key) return true
    const tokenInner = item.token?.replace(/^#\{/, '').replace(/\}$/, '').trim()
    return tokenInner === key
  })
}

function isMemberWithActor(recipient: RecipientLike): boolean {
  return !isDirectAlimtalkRecipient(recipient) && Number.isFinite(recipient.actorId)
}

/**
 * 템플릿 `#{키}` 하나를 서버 치환 / 수신자 직접 입력 / 발송 불가로 나눈다.
 *
 * 프로그램 미선택: 일반 변수는 회원·직접 입력 모두 수기 입력.
 * `enabled`·`requiresProgram`만으로 막지 않는다.
 * 특정 프로그램 선택: 카탈로그에서 허용된 변수만 서버 자동 매칭.
 * SYSTEM·서버 예약 키는 payload에 넣지 않고, 값 존재를 성공으로 보지 않는다.
 * 회원 actorId로 채우는 신원 키(회원명·이메일·휴대폰)만 프로그램 없이도 서버 치환이다.
 */
export function classifyAlimtalkPlaceholderKey(input: {
  key: string
  catalog?: AlimtalkVariableCatalogEntry[] | null
  recipient: RecipientLike
  programSelected: boolean
}): AlimtalkPlaceholderDisposition {
  const key = input.key.trim()
  if (!key) return 'blocked'
  const item = findCatalogEntry(input.catalog, key)
  const member = isMemberWithActor(input.recipient)
  const system = isAlimtalkSystemVariableKey(key, input.catalog)
  const reserved = isAlimtalkReservedVariableKey(key)

  if (!input.programSelected) {
    if (member && ALIMTALK_MEMBER_ENRICHABLE_PLACEHOLDER_KEYS.has(key)) return 'server'
    if (system || reserved) return 'blocked'
    if (input.catalog == null) return 'pending'
    return 'manual'
  }

  if (system) return 'blocked'
  if (member && ALIMTALK_MEMBER_ENRICHABLE_PLACEHOLDER_KEYS.has(key)) return 'server'
  if (member && PROGRAM_CONTEXT_KEYS.has(key)) return 'server'
  if (item?.requiresProgram === true && item.enabled === true) return 'server'
  if (item?.requiresProgram === true && item.enabled !== true) return 'blocked'
  if (item && item.enabled === true && member) return 'server'
  if (item && item.enabled !== true) return 'blocked'
  if (reserved) return 'blocked'
  if (input.catalog == null) return 'pending'
  return 'manual'
}

function hasManualValue(
  variables: Record<string, string> | null | undefined,
  key: string
): boolean {
  const value = variables?.[key]
  return typeof value === 'string' && value.trim().length > 0
}

export function alimtalkRecipientCoversPlaceholder(input: {
  key: string
  recipient: RecipientLike
  batchVariables?: Record<string, unknown> | null
  catalog?: AlimtalkVariableCatalogEntry[] | null
  programSelected: boolean
}): boolean {
  const key = input.key.trim()
  const batchValue = input.batchVariables?.[key]
  const batchFilled =
    typeof batchValue === 'string'
      ? batchValue.trim().length > 0
      : batchValue != null && String(batchValue).trim().length > 0
  if (
    batchFilled &&
    !isAlimtalkReservedVariableKey(key) &&
    !isAlimtalkSystemVariableKey(key, input.catalog)
  ) {
    return true
  }

  const disposition = classifyAlimtalkPlaceholderKey({
    key,
    catalog: input.catalog,
    recipient: input.recipient,
    programSelected: input.programSelected,
  })
  if (disposition === 'server') return true
  if (disposition === 'manual' || disposition === 'pending') {
    return (
      hasManualValue(input.recipient.variables, key) &&
      !isAlimtalkReservedVariableKey(key) &&
      !isAlimtalkSystemVariableKey(key, input.catalog)
    )
  }
  return false
}

export type AlimtalkRecipientVariableGap = {
  id: string
  label: string
  manualMissing: string[]
  blocked: string[]
  needsProgram: string[]
}

function gapLabel(recipient: VariableRecipient): string {
  const name = recipient.name?.trim()
  const contact = recipient.phone?.trim() || recipient.email?.trim()
  if (name && name !== '-') {
    return contact && contact !== '-' ? `${name} (${contact})` : name
  }
  return contact && contact !== '-' ? contact : recipient.id
}

export function collectAlimtalkRecipientVariableGaps<T extends VariableRecipient>(input: {
  keys: Iterable<string>
  catalog: AlimtalkVariableCatalogEntry[] | null | undefined
  recipients: readonly T[]
  programSelected: boolean
}): AlimtalkRecipientVariableGap[] {
  const keys = [...input.keys].map(key => key.trim()).filter(Boolean)
  const gaps: AlimtalkRecipientVariableGap[] = []
  for (const recipient of input.recipients) {
    const manualMissing: string[] = []
    const blocked: string[] = []
    const needsProgram: string[] = []
    for (const key of keys) {
      const disposition = classifyAlimtalkPlaceholderKey({
        key,
        catalog: input.catalog,
        recipient,
        programSelected: input.programSelected,
      })
      if (disposition === 'needs-program') {
        needsProgram.push(key)
        continue
      }
      if (disposition === 'blocked' || disposition === 'pending') {
        blocked.push(key)
        continue
      }
      if (disposition === 'manual' && !hasManualValue(recipient.variables, key)) {
        manualMissing.push(key)
      }
    }
    if (manualMissing.length === 0 && blocked.length === 0 && needsProgram.length === 0) continue
    gaps.push({
      id: recipient.id,
      label: gapLabel(recipient),
      manualMissing,
      blocked,
      needsProgram,
    })
  }
  return gaps
}

export function partitionAlimtalkRecipientsByVariables<T extends VariableRecipient>(input: {
  keys: Iterable<string>
  catalog: AlimtalkVariableCatalogEntry[] | null | undefined
  recipients: readonly T[]
  programSelected: boolean
}): { valid: T[]; gaps: AlimtalkRecipientVariableGap[] } {
  const gaps = collectAlimtalkRecipientVariableGaps(input)
  const invalidIds = new Set(gaps.map(gap => gap.id))
  return {
    valid: input.recipients.filter(recipient => !invalidIds.has(recipient.id)),
    gaps,
  }
}

export function formatAlimtalkPartialSendConfirm(input: {
  validCount: number
  gaps: AlimtalkRecipientVariableGap[]
}): string {
  const lines = [
    `변수 조건이 맞지 않는 수신자 ${input.gaps.length}명은 이번 발송에서 제외됩니다.`,
    `조건을 충족한 수신자 ${input.validCount}명만 발송합니다.`,
    '제외된 수신자와 입력값은 발송 화면에 남으며, 확인 전에는 삭제되지 않습니다.',
  ]
  for (const gap of input.gaps.slice(0, 8)) {
    const reasons: string[] = []
    if (gap.manualMissing.length > 0) reasons.push(`값 없음: ${gap.manualMissing.join(', ')}`)
    if (gap.blocked.length > 0) reasons.push(`서버 전용 변수: ${gap.blocked.join(', ')}`)
    if (gap.needsProgram.length > 0) reasons.push(`프로그램 변수: ${gap.needsProgram.join(', ')}`)
    lines.push(`${gap.label} — ${reasons.join(' / ')}`)
  }
  if (input.gaps.length > 8) lines.push(`외 ${input.gaps.length - 8}명`)
  lines.push('제외하고 발송할까요?')
  return lines.join('\n')
}

export function formatAlimtalkRecipientVariableGapMessage(
  gaps: AlimtalkRecipientVariableGap[]
): string {
  const lines: string[] = []
  const needsProgram = [...new Set(gaps.flatMap(gap => gap.needsProgram))]
  if (needsProgram.length > 0) {
    lines.push('프로그램 필수 변수가 있어 프로그램을 선택하세요.')
    lines.push(needsProgram.join(', '))
  }
  const blocked = gaps.filter(gap => gap.blocked.length > 0)
  if (blocked.length > 0) {
    lines.push('서버 전용 변수는 직접 입력할 수 없어 해당 수신자는 발송할 수 없습니다.')
    for (const gap of blocked.slice(0, 8)) {
      lines.push(`${gap.label}: ${gap.blocked.join(', ')}`)
    }
    if (blocked.length > 8) lines.push(`외 ${blocked.length - 8}명`)
  }
  const manual = gaps.filter(gap => gap.manualMissing.length > 0)
  if (manual.length > 0) {
    lines.push('수신자별 변수값을 입력하세요. 값이 없으면 해당 수신자는 발송할 수 없습니다.')
    for (const gap of manual.slice(0, 8)) {
      lines.push(`${gap.label}: ${gap.manualMissing.join(', ')}`)
    }
    if (manual.length > 8) lines.push(`외 ${manual.length - 8}명`)
  }
  return lines.join('\n')
}

export function listAlimtalkManualVariableKeys(input: {
  keys: Iterable<string>
  catalog: AlimtalkVariableCatalogEntry[] | null | undefined
  recipient: RecipientLike
  programSelected: boolean
}): string[] {
  const manual: string[] = []
  for (const raw of input.keys) {
    const key = raw.trim()
    if (!key) continue
    if (
      classifyAlimtalkPlaceholderKey({
        key,
        catalog: input.catalog,
        recipient: input.recipient,
        programSelected: input.programSelected,
      }) === 'manual'
    ) {
      manual.push(key)
    }
  }
  return manual
}

/** 수신자 variables에 실을 수동 값. 빈 문자열·예약·SYSTEM 키는 생략한다. */
export function pickAlimtalkRecipientSendVariables(input: {
  recipient: RecipientLike
  keys: Iterable<string>
  catalog: AlimtalkVariableCatalogEntry[] | null | undefined
  programSelected: boolean
}): Record<string, string> | undefined {
  if (input.catalog == null) return undefined
  const next: Record<string, string> = {}
  for (const raw of input.keys) {
    const key = raw.trim()
    if (!key) continue
    if (
      classifyAlimtalkPlaceholderKey({
        key,
        catalog: input.catalog,
        recipient: input.recipient,
        programSelected: input.programSelected,
      }) !== 'manual'
    ) {
      continue
    }
    if (isAlimtalkReservedVariableKey(key) || isAlimtalkSystemVariableKey(key, input.catalog)) {
      continue
    }
    const value = input.recipient.variables?.[key]
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (!trimmed) continue
    next[key] = trimmed
  }
  return Object.keys(next).length > 0 ? next : undefined
}
