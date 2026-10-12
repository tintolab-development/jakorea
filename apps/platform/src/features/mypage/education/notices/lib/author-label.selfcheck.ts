import assert from 'node:assert/strict'
import {
  mapPortalNoticePostAuthor,
  portalEducationNoticeActorLabel,
  PORTAL_CMS_STAFF_AUTHOR_LABEL,
} from './author-label.ts'

assert.deepEqual(mapPortalNoticePostAuthor(null, 'CMS'), {
  authorName: PORTAL_CMS_STAFF_AUTHOR_LABEL,
  authorIsStaff: true,
})
assert.equal(mapPortalNoticePostAuthor('홍길동', 'ADMIN').authorName, PORTAL_CMS_STAFF_AUTHOR_LABEL)

assert.deepEqual(mapPortalNoticePostAuthor('박재희 담당교사님', 'TEACHER'), {
  authorName: '박재희 담당교사님',
  authorIsStaff: false,
})

assert.equal(portalEducationNoticeActorLabel(null, 'CMS', false), PORTAL_CMS_STAFF_AUTHOR_LABEL)
assert.equal(portalEducationNoticeActorLabel('김OO', 'MEMBER', false), '김OO')
