/**
 * Run: node --experimental-strip-types --experimental-transform-types src/shared/lib/resolve-portal-public-file-image-url.selfcheck.ts
 *
 * `resolvePortalPublicFileImageUrl`는 `import.meta.env`를 읽으므로 Node selfcheck에서는
 * 순수 함수 `applyPortalPublicFileImageOrigin`과 trim/empty 규칙을 검증한다.
 */
import assert from 'node:assert/strict'
import { applyPortalPublicFileImageOrigin } from './apply-portal-public-file-image-origin.ts'

const QA_ORIGIN = 'https://d3r1iaa0sy4tcq.cloudfront.net'

function resolveForCheck(input?: string | null, apiOrigin = QA_ORIGIN): string | undefined {
  const url = input?.trim()
  if (!url) return undefined
  return applyPortalPublicFileImageOrigin(url, apiOrigin)
}

assert.equal(
  resolveForCheck('/api/portal/public/files/2055987/content'),
  `${QA_ORIGIN}/api/portal/public/files/2055987/content`
)
assert.equal(
  resolveForCheck('/api/portal/public/files/2055987/content?inline=1'),
  `${QA_ORIGIN}/api/portal/public/files/2055987/content?inline=1`
)
assert.equal(resolveForCheck('https://cdn.example/image.png'), 'https://cdn.example/image.png')
assert.equal(resolveForCheck('blob:https://localhost/abc'), 'blob:https://localhost/abc')
assert.equal(resolveForCheck('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA')
assert.equal(resolveForCheck(undefined), undefined)
assert.equal(resolveForCheck(null), undefined)
assert.equal(resolveForCheck('   '), undefined)
assert.equal(
  resolveForCheck('/api/portal/public/files/2055987/download'),
  '/api/portal/public/files/2055987/download'
)
assert.equal(
  resolveForCheck('/api/portal/public/files/2055987/content', ''),
  '/api/portal/public/files/2055987/content'
)
assert.equal(
  resolveForCheck('/api/portal/public/files/2055987/content', `${QA_ORIGIN}/`),
  `${QA_ORIGIN}/api/portal/public/files/2055987/content`
)
