import assert from 'node:assert/strict'
import {
  mapPortalNoticeAuthorFields,
  mapPortalNoticePostAuthor,
  portalEducationNoticeActorLabel,
  PORTAL_CMS_STAFF_AUTHOR_LABEL,
  PORTAL_NOTICE_UNKNOWN_AUTHOR_LABEL,
} from './author-label.ts'

assert.deepEqual(mapPortalNoticePostAuthor(null, 'CMS'), {
  authorName: PORTAL_CMS_STAFF_AUTHOR_LABEL,
  authorIsStaff: true,
})

assert.deepEqual(mapPortalNoticePostAuthor('프로그램 관리자', 'ADMIN'), {
  authorName: '프로그램 관리자',
  authorIsStaff: true,
})

assert.deepEqual(mapPortalNoticePostAuthor('박재희 담당교사님', 'TEACHER'), {
  authorName: '박재희 담당교사님',
  authorIsStaff: false,
})

assert.equal(
  mapPortalNoticePostAuthor(null, 'MEMBER').authorName,
  PORTAL_NOTICE_UNKNOWN_AUTHOR_LABEL,
)

assert.deepEqual(
  mapPortalNoticeAuthorFields({
    createdByDisplayName: '최지원',
    createdByActorType: 'MEMBER',
    mine: true,
  }),
  {
    authorName: '최지원',
    authorIsStaff: false,
    isAuthor: true,
  },
)

assert.equal(mapPortalNoticeAuthorFields({ mine: false }).isAuthor, false)

assert.equal(portalEducationNoticeActorLabel(null, 'CMS', false), PORTAL_CMS_STAFF_AUTHOR_LABEL)
assert.equal(portalEducationNoticeActorLabel('김OO', 'MEMBER', false), '김OO')
assert.equal(
  portalEducationNoticeActorLabel(null, 'MEMBER', false),
  PORTAL_NOTICE_UNKNOWN_AUTHOR_LABEL,
)
