/**
 * Run: node --experimental-strip-types --experimental-transform-types src/shared/lib/file-upload-overlay.selfcheck.ts
 */
import {
  beginFileUploadOverlay,
  endFileUploadOverlay,
  getFileUploadOverlayActive,
  subscribeFileUploadOverlay,
  withFileUploadOverlay,
} from './file-upload-overlay.ts'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(getFileUploadOverlayActive() === false, 'starts inactive')

let notifications = 0
const unsubscribe = subscribeFileUploadOverlay(() => {
  notifications += 1
})

beginFileUploadOverlay()
assert(getFileUploadOverlayActive() === true, 'begin activates')
beginFileUploadOverlay()
assert(getFileUploadOverlayActive() === true, 'nested begin stays active')
endFileUploadOverlay()
assert(getFileUploadOverlayActive() === true, 'one end keeps nested upload active')
endFileUploadOverlay()
assert(getFileUploadOverlayActive() === false, 'last end clears')
endFileUploadOverlay()
assert(getFileUploadOverlayActive() === false, 'extra end stays at zero')

const pending = withFileUploadOverlay(
  () => new Promise<string>(resolve => setTimeout(() => resolve('ok'), 10))
)
assert(getFileUploadOverlayActive() === true, 'async upload shows overlay')
assert((await pending) === 'ok', 'async upload resolves')
assert(getFileUploadOverlayActive() === false, 'async upload clears')

try {
  await withFileUploadOverlay(() => Promise.reject(new Error('fail')))
  throw new Error('rejection should throw')
} catch (error) {
  assert(error instanceof Error && error.message === 'fail', 'rejection message preserved')
}
assert(getFileUploadOverlayActive() === false, 'rejection clears overlay')

let releaseFirst: () => void = () => {}
let releaseSecond: () => void = () => {}
const first = withFileUploadOverlay(
  () =>
    new Promise<void>(resolve => {
      releaseFirst = resolve
    })
)
const second = withFileUploadOverlay(
  () =>
    new Promise<void>(resolve => {
      releaseSecond = resolve
    })
)
assert(getFileUploadOverlayActive() === true, 'parallel uploads active')
releaseFirst()
await first
assert(getFileUploadOverlayActive() === true, 'one parallel upload still active')
releaseSecond()
await second
assert(getFileUploadOverlayActive() === false, 'parallel uploads clear')

unsubscribe()
assert(notifications > 0, 'subscribers notified')

console.log('file-upload-overlay.selfcheck: ok')
