const STORAGE_KEY = 'platform.home.popup.hideUntil'
export const HOME_POPUP_HIDE_DURATION_MS = 24 * 60 * 60 * 1000

type HideMap = Record<string, string>

function readHideMap(storage: Pick<Storage, 'getItem'>): HideMap {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    )
  } catch {
    return {}
  }
}

function parseHideUntil(value: string): number | undefined {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (dateOnly) {
    const year = Number(dateOnly[1])
    const month = Number(dateOnly[2]) - 1
    const day = Number(dateOnly[3])
    return new Date(year, month, day, 23, 59, 59, 999).getTime()
  }

  const ms = Date.parse(value)
  return Number.isNaN(ms) ? undefined : ms
}

export function isPopupHiddenForOneDay(
  popupId: string,
  storage: Pick<Storage, 'getItem'> | null | undefined = typeof window === 'undefined'
    ? undefined
    : window.localStorage,
  nowMs: number = Date.now(),
): boolean {
  if (!storage) return false
  const until = parseHideUntil(readHideMap(storage)[popupId] ?? '')
  return until != null && until > nowMs
}

export function hidePopupForOneDay(
  popupId: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null | undefined =
    typeof window === 'undefined' ? undefined : window.localStorage,
  nowMs: number = Date.now(),
): void {
  if (!storage) return
  const until = new Date(nowMs + HOME_POPUP_HIDE_DURATION_MS).toISOString()
  storage.setItem(STORAGE_KEY, JSON.stringify({ ...readHideMap(storage), [popupId]: until }))
}
