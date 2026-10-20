import assert from 'node:assert/strict'
import { isLocalNgrokPortalRawDownload } from './portal-signed-download-fetch.ts'

const rawPath =
  '/api/portal/files/downloads/raw/generated%2Fexample.pdf?expires=1&signature=x'

assert.equal(
  isLocalNgrokPortalRawDownload(`https://abc.ngrok-free.app${rawPath}`, { dev: true }),
  true,
)
assert.equal(
  isLocalNgrokPortalRawDownload(`https://tunnel.ngrok.app${rawPath}`, { dev: true }),
  true,
)

assert.equal(
  isLocalNgrokPortalRawDownload(`https://abc.ngrok-free.app${rawPath}`, { dev: false }),
  false,
)

assert.equal(
  isLocalNgrokPortalRawDownload(
    `https://d123.cloudfront.net${rawPath}`,
    { dev: true },
  ),
  false,
)

assert.equal(
  isLocalNgrokPortalRawDownload(
    `http://localhost:8080${rawPath}`,
    { dev: true },
  ),
  false,
)

assert.equal(
  isLocalNgrokPortalRawDownload(
    'https://abc.ngrok-free.app/api/portal/me/consents/documents/1',
    { dev: true },
  ),
  false,
)

assert.equal(isLocalNgrokPortalRawDownload('not-a-url', { dev: true }), false)

console.log('portal-signed-download-fetch.selfcheck: ok')
