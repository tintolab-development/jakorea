/** 면접·교육 등 — 진행 불가일 벌크 제외(없음 / 토·일·공휴일) */

export type UnavailableDatesExclusionState = {
  excludeNone: boolean
  excludeSaturday: boolean
  excludeSunday: boolean
  excludeHoliday: boolean
}

export function buildRecurringUnavailableLabel(state: UnavailableDatesExclusionState): string {
  if (state.excludeNone) return ''

  const parts: string[] = []
  if (state.excludeSaturday) parts.push('토요일')
  if (state.excludeSunday) parts.push('일요일')
  if (state.excludeHoliday) parts.push('공휴일')
  return parts.join(', ')
}

export function resolveUnavailableDatesExclusionState(input: {
  recurringUnavailable: string
  hasSpecificUnavailableDates?: boolean
  defaultExcludeHoliday?: boolean
}): UnavailableDatesExclusionState {
  const recurring = input.recurringUnavailable.trim()
  const excludeSaturday = recurring.includes('토요일')
  const excludeSunday = recurring.includes('일요일')
  const excludeHoliday = recurring.includes('공휴일')
  const hasRecurring = excludeSaturday || excludeSunday || excludeHoliday

  if (hasRecurring) {
    return {
      excludeNone: false,
      excludeSaturday,
      excludeSunday,
      excludeHoliday,
    }
  }

  if (input.hasSpecificUnavailableDates) {
    return {
      excludeNone: false,
      excludeSaturday: false,
      excludeSunday: false,
      excludeHoliday: false,
    }
  }

  return {
    excludeNone: true,
    excludeSaturday: false,
    excludeSunday: false,
    excludeHoliday: input.defaultExcludeHoliday ?? false,
  }
}

export function createDefaultUnavailableDatesExclusionState(
  overrides?: Partial<UnavailableDatesExclusionState>
): UnavailableDatesExclusionState {
  return {
    excludeNone: false,
    excludeSaturday: false,
    excludeSunday: false,
    excludeHoliday: true,
    ...overrides,
  }
}
