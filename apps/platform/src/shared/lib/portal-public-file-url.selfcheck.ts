import assert from 'node:assert/strict'
import {
  fileObjectIdFromStoredFileUrl,
  rewriteAdminFileContentSrcsForPortal,
} from './portal-public-file-url.ts'

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
assert.equal(fileObjectIdFromStoredFileUrl('/api/admin/files/42/content'), 42)
assert.equal(fileObjectIdFromStoredFileUrl('/api/portal/public/files/9/content?inline=1'), 9)
assert.equal(fileObjectIdFromStoredFileUrl('https://example/api/admin/files/3/download'), 3)
assert.equal(fileObjectIdFromStoredFileUrl('/images/local.png'), null)
