import assert from 'node:assert/strict'
import { UJAT_PORTAL_BANNER_STATES } from '../api/types.ts'
import {
  readUjatPortalBannerState,
  readUjatRevisionReason,
  resolveUjatScheduleBanner,
  resolveUjatScheduleBannerFromState,
  resolveUjatScheduleBannerVariant,
  resolveVisibleUjatScheduleBanner,
  sanitizeUjatParticipantBasicInfoFields,
  shouldShowUjatScheduleBanner,
  shouldUseUjatApplicationContent,
} from './ujat-portal-banner.ts'

assert.equal(resolveUjatScheduleBannerVariant(UJAT_PORTAL_BANNER_STATES.ACTION_REQUIRED), 'action')
assert.equal(resolveUjatScheduleBannerVariant(UJAT_PORTAL_BANNER_STATES.ADMIN_REVIEW), 'review')
assert.equal(resolveUjatScheduleBannerVariant(UJAT_PORTAL_BANNER_STATES.REVISION_REQUIRED), 'revision')
assert.equal(resolveUjatScheduleBannerVariant(UJAT_PORTAL_BANNER_STATES.NONE), null)
assert.equal(resolveUjatScheduleBannerVariant(UJAT_PORTAL_BANNER_STATES.FINAL_APPROVED), null)
assert.equal(resolveUjatScheduleBannerVariant(UJAT_PORTAL_BANNER_STATES.REJECTED), null)
assert.equal(resolveUjatScheduleBannerVariant(null), null)

const action = resolveUjatScheduleBannerFromState('ACTION_REQUIRED')
assert.ok(action)
assert.equal(action!.variant, 'action')
assert.equal(action!.clickable, true)
assert.equal(action!.title, '관리자와 협의된 일정을 확인해 주세요!')
assert.equal(action!.body, '협의 된 최종 일정을 확인하고 안내사항을 작성해 주세요!')

const review = resolveUjatScheduleBannerFromState('ADMIN_REVIEW')
assert.ok(review)
assert.equal(review!.clickable, false)
assert.equal(review!.title, '전달주신 일정을 관리자가 확인 중이에요.')
assert.equal(review!.body, '확인 후 최종 승인 여부가 반영됩니다.')

const revision = resolveUjatScheduleBannerFromState('REVISION_REQUIRED')
assert.ok(revision)
assert.equal(revision!.clickable, true)
assert.equal(revision!.title, '작성된 내용에 수정사항이 있어요!')
assert.equal(revision!.body, '담당자와 협의된 내용을 확인 후 수정 제출해 주세요!')

assert.equal(
  readUjatRevisionReason({
    ujat: { portalBannerState: 'REVISION_REQUIRED', revisionReason: '기간에 대한 협의가 필요합니다.' },
  }),
  '기간에 대한 협의가 필요합니다.',
)
assert.equal(
  readUjatRevisionReason({
    ujat: { scheduleChangeRequest: { reason: '학년 정보를 수정해 주세요.' } },
  }),
  '학년 정보를 수정해 주세요.',
)
assert.equal(
  readUjatRevisionReason({
    ujat: { requestedReason: '학급 수를 확인해 주세요.' },
  }),
  '학급 수를 확인해 주세요.',
)
assert.equal(readUjatRevisionReason({ ujat: { portalBannerState: 'REVISION_REQUIRED' } }), null)

assert.equal(readUjatPortalBannerState({ ujat: { portalBannerState: 'ACTION_REQUIRED' } }), 'ACTION_REQUIRED')
assert.equal(readUjatPortalBannerState({ ujat: { portalBannerState: 'NONE' } }), 'NONE')
assert.equal(readUjatPortalBannerState({ ujat: { portalBannerState: 'UNKNOWN' } }), null)
assert.equal(readUjatPortalBannerState({ ujat: { scheduleConfirmStatus: 'CONFIRMED' } }), null)
assert.equal(readUjatPortalBannerState({ ujat: { temporaryAssignmentStatus: 'ASSIGNED' } }), null)
assert.equal(readUjatPortalBannerState(undefined), null)
assert.equal(resolveUjatScheduleBanner({ ujat: { portalBannerState: 'NONE' } }), null)

assert.equal(shouldUseUjatApplicationContent('ujat-participant'), true)
assert.equal(shouldUseUjatApplicationContent('general'), false)
assert.equal(
  shouldShowUjatScheduleBanner('ujat-participant', 'ACTION_REQUIRED'),
  true,
)
assert.equal(shouldShowUjatScheduleBanner('ujat-participant', 'NONE'), false)
assert.equal(shouldShowUjatScheduleBanner('ujat-participant', 'FINAL_APPROVED'), false)
assert.equal(shouldShowUjatScheduleBanner('ujat-participant', 'REJECTED'), false)
assert.equal(shouldShowUjatScheduleBanner('general', 'ACTION_REQUIRED'), false)
assert.equal(shouldShowUjatScheduleBanner('ujat-volunteer', 'ACTION_REQUIRED'), false)
assert.equal(shouldShowUjatScheduleBanner('ujat-volunteer', 'REVISION_REQUIRED'), false)

assert.equal(
  resolveVisibleUjatScheduleBanner('ujat-participant', 'ADMIN_REVIEW')?.variant,
  'review',
)
assert.equal(resolveVisibleUjatScheduleBanner('ujat-volunteer', 'ACTION_REQUIRED'), null)
assert.equal(resolveVisibleUjatScheduleBanner('ujat-participant', 'NONE'), null)

const invented = sanitizeUjatParticipantBasicInfoFields(
  'ujat-participant',
  '',
  [{ label: '대상', value: '초등학교' }, { label: '교육 형태', value: '오프라인' }],
)
assert.equal(invented[0]?.value, '-')
assert.equal(invented[1]?.value, '오프라인')

const inventedDetail = sanitizeUjatParticipantBasicInfoFields(
  'ujat-participant',
  '',
  [{ label: '교육 대상 상세', value: '초등학교' }],
)
assert.equal(inventedDetail[0]?.value, '-')

const canonicalElementary = sanitizeUjatParticipantBasicInfoFields(
  'ujat-participant',
  '초등학교',
  [{ label: '대상', value: '초등학교' }],
)
assert.equal(canonicalElementary[0]?.value, '초등학교')

const generalUnchanged = sanitizeUjatParticipantBasicInfoFields(
  'general',
  '',
  [{ label: '대상', value: '초등학교' }],
)
assert.equal(generalUnchanged[0]?.value, '초등학교')

console.log('ujat-portal-banner.selfcheck: ok')
