import assert from 'node:assert/strict'
import type { PortalConsentSummary } from '../../mypage/settings/api/consents.ts'
import {
  findMissingApplyConsents,
  requiredApplyConsentLabels,
  resolveRequiredApplyConsentTypes,
} from './application-consent-guard.ts'

const agreed = (consentType: string, extra: Partial<PortalConsentSummary> = {}): PortalConsentSummary => ({
  consentType,
  applicable: true,
  agreed: true,
  status: 'AGREED',
  expired: false,
  reconsentRequired: false,
  ...extra,
})
const notAgreed = (consentType: string, extra: Partial<PortalConsentSummary> = {}): PortalConsentSummary => ({
  consentType,
  applicable: true,
  agreed: false,
  status: 'NOT_AGREED',
  ...extra,
})
const portraitOk = (extra: Partial<PortalConsentSummary> = {}) =>
  agreed('PORTRAIT_RIGHTS', { consentStatus: 'PARTIAL', programEligible: true, ...extra })

// 신청 유형별 필수 목록
assert.deepEqual(resolveRequiredApplyConsentTypes({ programType: 'GENERAL' }), ['PORTRAIT_RIGHTS'])
assert.deepEqual(resolveRequiredApplyConsentTypes({ programType: undefined }), ['PORTRAIT_RIGHTS'])
assert.deepEqual(resolveRequiredApplyConsentTypes({ programType: 'TRAINED_TEACHER' }), ['PORTRAIT_RIGHTS'])
// 행정정보 공동이용 동의서는 필수 아님(2026-10-29)
const ujat = [
  'FACILITATOR_PLEDGE',
  'CRIMINAL_HISTORY_CHECK_CONSENT',
  'PORTRAIT_RIGHTS',
]
assert.deepEqual(resolveRequiredApplyConsentTypes({ programType: 'UJAT' }), ujat)
assert.deepEqual(resolveRequiredApplyConsentTypes({ programType: ' ujat_program ' }), ujat)
// 교육진행자 서약서는 강사·봉사 신청만 — 교사 기관 신청은 서약서 없이 2종
assert.deepEqual(
  resolveRequiredApplyConsentTypes({ programType: 'UJAT', applicationType: 'VOLUNTEER' }),
  ujat,
)
assert.deepEqual(
  resolveRequiredApplyConsentTypes({ programType: 'UJAT', applicationType: 'instructor' }),
  ujat,
)
assert.deepEqual(
  resolveRequiredApplyConsentTypes({ programType: 'UJAT', applicationType: 'ORGANIZATION' }),
  ['CRIMINAL_HISTORY_CHECK_CONSENT', 'PORTRAIT_RIGHTS'],
)
assert.deepEqual(
  resolveRequiredApplyConsentTypes({ programType: 'GENERAL', applicationType: 'ORGANIZATION' }),
  ['PORTRAIT_RIGHTS'],
)

const general = resolveRequiredApplyConsentTypes({ programType: 'GENERAL' })
const ujatRequired = resolveRequiredApplyConsentTypes({ programType: 'UJAT' })

// 이미 동의 → 통과
assert.deepEqual(findMissingApplyConsents([portraitOk()], general), [])
assert.deepEqual(
  findMissingApplyConsents(
    [
      agreed('FACILITATOR_PLEDGE'),
      agreed('ADMINISTRATIVE_INFO_CONSENT'),
      agreed('CRIMINAL_HISTORY_CHECK_CONSENT'),
      portraitOk(),
    ],
    ujatRequired,
  ),
  [],
)

// 미동의 → 막힘 (일반은 초상권만)
assert.deepEqual(
  findMissingApplyConsents(
    [notAgreed('PORTRAIT_RIGHTS', { programEligible: false }), notAgreed('FACILITATOR_PLEDGE')],
    general,
  ),
  ['PORTRAIT_RIGHTS'],
)

// UJAT: 미완료 항목만, 순서 유지
assert.deepEqual(
  findMissingApplyConsents(
    [
      agreed('FACILITATOR_PLEDGE'),
      notAgreed('ADMINISTRATIVE_INFO_CONSENT'),
      notAgreed('CRIMINAL_HISTORY_CHECK_CONSENT'),
      portraitOk(),
    ],
    ujatRequired,
  ),
  ['CRIMINAL_HISTORY_CHECK_CONSENT'],
)

// UJAT: 행정정보 공동이용 미동의만으로는 막지 않는다
assert.deepEqual(
  findMissingApplyConsents(
    [
      agreed('FACILITATOR_PLEDGE'),
      notAgreed('ADMINISTRATIVE_INFO_CONSENT'),
      agreed('CRIMINAL_HISTORY_CHECK_CONSENT'),
      portraitOk(),
    ],
    ujatRequired,
  ),
  [],
)

// 만료·재동의·정책갱신·잘못된 status 는 agreed=true 여도 막힘
assert.deepEqual(findMissingApplyConsents([portraitOk({ expired: true })], general), ['PORTRAIT_RIGHTS'])
assert.deepEqual(findMissingApplyConsents([portraitOk({ reconsentRequired: true })], general), ['PORTRAIT_RIGHTS'])
assert.deepEqual(findMissingApplyConsents([portraitOk({ policyUpdated: true })], general), ['PORTRAIT_RIGHTS'])
assert.deepEqual(findMissingApplyConsents([portraitOk({ status: 'WITHDRAWN' })], general), ['PORTRAIT_RIGHTS'])
assert.deepEqual(findMissingApplyConsents([portraitOk({ status: 'POLICY_UPDATED' })], general), ['PORTRAIT_RIGHTS'])

// 초상권: programEligible !== true 면 agreed 여도 막힘 (false / undefined)
assert.deepEqual(findMissingApplyConsents([portraitOk({ programEligible: false })], general), ['PORTRAIT_RIGHTS'])
assert.deepEqual(findMissingApplyConsents([portraitOk({ programEligible: undefined })], general), ['PORTRAIT_RIGHTS'])
// programEligible 는 초상권에만 적용 — 서약서는 영향 없음
assert.deepEqual(
  findMissingApplyConsents(
    [agreed('FACILITATOR_PLEDGE', { programEligible: undefined }), portraitOk()],
    ['FACILITATOR_PLEDGE', 'PORTRAIT_RIGHTS'],
  ),
  [],
)

// NOT_APPLICABLE 건너뜀 (만 14세 미만 성범죄 경력조회 등). 초상권은 14세 미만도 필수 유지.
const under14 = [
  { consentType: 'FACILITATOR_PLEDGE', applicable: false, agreed: false, status: 'NOT_APPLICABLE' },
  { consentType: 'ADMINISTRATIVE_INFO_CONSENT', applicable: false, agreed: false, status: 'NOT_APPLICABLE' },
  { consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT', applicable: false, agreed: false, status: 'NOT_APPLICABLE' },
]
assert.deepEqual(
  findMissingApplyConsents([...under14, notAgreed('PORTRAIT_RIGHTS', { programEligible: false })], ujatRequired),
  ['PORTRAIT_RIGHTS'],
)
assert.deepEqual(findMissingApplyConsents([...under14, portraitOk()], ujatRequired), [])
// status 만 NOT_APPLICABLE 인 경우도 동일
assert.deepEqual(
  findMissingApplyConsents(
    [{ consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT', status: 'NOT_APPLICABLE', agreed: false }],
    ['CRIMINAL_HISTORY_CHECK_CONSENT'],
  ),
  [],
)

// fail-open: 목록이 비었거나 해당 행이 없으면 막지 않는다
assert.deepEqual(findMissingApplyConsents([], general), [])
assert.deepEqual(findMissingApplyConsents([], ujatRequired), [])
assert.deepEqual(findMissingApplyConsents([agreed('MARKETING')], general), [])

// 마이페이지와 같은 완료 판정: 문서형 동의는 signed/완료 status 만으로도 완료
assert.deepEqual(
  findMissingApplyConsents(
    [{ consentType: 'FACILITATOR_PLEDGE', applicable: true, agreed: false, signed: true, status: 'SIGNED' }],
    ['FACILITATOR_PLEDGE'],
  ),
  [],
)

// 라벨
assert.deepEqual(
  requiredApplyConsentLabels(['ADMINISTRATIVE_INFO_CONSENT', 'PORTRAIT_RIGHTS']),
  ['행정정보 공동이용 동의서', '초상권 수집·이용 동의'],
)

console.log('application-consent-guard selfcheck ok')
