import assert from 'node:assert/strict'
import {
  PORTAL_INLINE_IMAGE_PREVIEW_FAILURE_MESSAGE,
  fileObjectIdFromStoredFileUrl,
  portalPublicInlineImageUrl,
  rewriteAdminFileContentSrcsForPortal,
} from './portal-public-file-url.ts'

const API_ORIGIN = 'https://d3r1iaa0sy4tcq.cloudfront.net'

assert.equal(
  rewriteAdminFileContentSrcsForPortal(
    '<img src="/api/admin/files/42/content" alt="사진" class="rich-text-content__image" />'
  ),
  '<img src="/api/portal/public/files/42/content?inline=1" alt="사진" class="rich-text-content__image" />'
)
assert.equal(
  rewriteAdminFileContentSrcsForPortal(
    '![사진](https://cms.example/api/admin/files/9/content)'
  ),
  '![사진](/api/portal/public/files/9/content?inline=1)'
)
assert.equal(
  rewriteAdminFileContentSrcsForPortal(
    '<img src="/api/portal/public/files/7/content" alt="이미공개" />'
  ),
  '<img src="/api/portal/public/files/7/content?inline=1" alt="이미공개" />'
)
assert.equal(rewriteAdminFileContentSrcsForPortal('<p>텍스트만</p>'), '<p>텍스트만</p>')
assert.equal(
  rewriteAdminFileContentSrcsForPortal('<img src="file-object:15" alt="사진" />'),
  '<img src="/api/portal/public/files/15/content?inline=1" alt="사진" />',
)
assert.equal(fileObjectIdFromStoredFileUrl('/api/admin/files/42/content'), 42)
assert.equal(fileObjectIdFromStoredFileUrl('/api/portal/public/files/9/content?inline=1'), 9)
assert.equal(fileObjectIdFromStoredFileUrl('https://example/api/admin/files/3/download'), 3)
assert.equal(fileObjectIdFromStoredFileUrl('/images/local.png'), null)

assert.equal(
  rewriteAdminFileContentSrcsForPortal(
    '<img src="/api/admin/files/42/content" alt="사진" />',
    '',
  ),
  '<img src="/api/portal/public/files/42/content?inline=1" alt="사진" />',
)

assert.equal(
  rewriteAdminFileContentSrcsForPortal(
    '<img src="/api/admin/files/2056100/content" alt="몽파비.png">',
    API_ORIGIN,
  ),
  `<img src="${API_ORIGIN}/api/portal/public/files/2056100/content?inline=1" alt="몽파비.png">`,
)

assert.equal(
  rewriteAdminFileContentSrcsForPortal(
    '<img src="/api/admin/files/2056100/content" alt="몽파비.png"><a href="/api/admin/files/15/download">안내.pdf</a>',
    `${API_ORIGIN}/`,
  ),
  `<img src="${API_ORIGIN}/api/portal/public/files/2056100/content?inline=1" alt="몽파비.png"><a href="${API_ORIGIN}/api/portal/public/files/15/content?inline=1">안내.pdf</a>`,
)

assert.equal(
  rewriteAdminFileContentSrcsForPortal(
    '![사진](https://cms.example/api/admin/files/9/content)',
    API_ORIGIN,
  ),
  `![사진](${API_ORIGIN}/api/portal/public/files/9/content?inline=1)`,
)

assert.equal(
  rewriteAdminFileContentSrcsForPortal(
    '<img src="/api/portal/public/files/7/content?inline=1" alt="이미공개" />',
    API_ORIGIN,
  ),
  `<img src="${API_ORIGIN}/api/portal/public/files/7/content?inline=1" alt="이미공개" />`,
)

assert.equal(
  rewriteAdminFileContentSrcsForPortal(
    `<img src="${API_ORIGIN}/api/portal/public/files/7/content?inline=1" alt="이미공개" />`,
    API_ORIGIN,
  ),
  `<img src="${API_ORIGIN}/api/portal/public/files/7/content?inline=1" alt="이미공개" />`,
)

assert.equal(
  rewriteAdminFileContentSrcsForPortal(
    '<img src="https://cdn.example/image.png" alt="외부" /><a href="https://cdn.example/file.pdf">외부</a>',
    API_ORIGIN,
  ),
  '<img src="https://cdn.example/image.png" alt="외부" /><a href="https://cdn.example/file.pdf">외부</a>',
)

assert.equal(
  portalPublicInlineImageUrl(2056100, API_ORIGIN),
  `${API_ORIGIN}/api/portal/public/files/2056100/content?inline=1`,
)
assert.equal(
  portalPublicInlineImageUrl(2056100, ''),
  '/api/portal/public/files/2056100/content?inline=1',
)
assert.equal(
  portalPublicInlineImageUrl(2056100, `${API_ORIGIN}/`),
  `${API_ORIGIN}/api/portal/public/files/2056100/content?inline=1`,
)
assert.ok(PORTAL_INLINE_IMAGE_PREVIEW_FAILURE_MESSAGE.includes('공개 URL'))
