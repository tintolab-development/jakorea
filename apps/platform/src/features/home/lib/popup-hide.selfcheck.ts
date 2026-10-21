import assert from 'node:assert/strict'
import {
  HOME_POPUP_HIDE_DURATION_MS,
  hidePopupForOneDay,
  isPopupHiddenForOneDay,
} from './popup-hide.ts'

function memoryStorage(initial: Record<string, string> = {}): {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  data: Record<string, string>
} {
  const data = { ...initial }
  return {
    data,
    getItem: key => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
  }
}

const now = Date.parse('2026-10-21T12:00:00+09:00')
const storage = memoryStorage()

assert.equal(isPopupHiddenForOneDay('11', storage, now), false)

hidePopupForOneDay('11', storage, now)
assert.equal(isPopupHiddenForOneDay('11', storage, now), true)
assert.equal(isPopupHiddenForOneDay('11', storage, now + HOME_POPUP_HIDE_DURATION_MS - 1), true)
assert.equal(isPopupHiddenForOneDay('11', storage, now + HOME_POPUP_HIDE_DURATION_MS), false)
assert.equal(isPopupHiddenForOneDay('12', storage, now), false)

const legacy = memoryStorage({
  'platform.home.popup.hideUntil': JSON.stringify({ '14': '2026-10-21' }),
})
assert.equal(isPopupHiddenForOneDay('14', legacy, now), true)
assert.equal(
  isPopupHiddenForOneDay('14', legacy, Date.parse('2026-10-22T00:00:00+09:00')),
  false,
)

console.log('popup-hide.selfcheck: ok')
