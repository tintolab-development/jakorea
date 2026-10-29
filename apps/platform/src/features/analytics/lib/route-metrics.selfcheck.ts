import assert from 'node:assert/strict'
import { metricCodeForPathname } from './route-metrics.ts'

assert.equal(metricCodeForPathname('/about/introduction'), 'JA_ORGANIZATION_VIEW')
assert.equal(metricCodeForPathname('/about/transparency'), 'JA_TRANSPARENCY_VIEW')
assert.equal(
  metricCodeForPathname('/about/transparency/annual-reports'),
  'JA_TRANSPARENCY_ANNUAL_REPORT_LIST_VIEW',
)
assert.equal(
  metricCodeForPathname('/about/transparency/audit-reports'),
  'JA_TRANSPARENCY_AUDIT_REPORT_LIST_VIEW',
)
assert.equal(metricCodeForPathname('/about/people'), 'JA_PEOPLE_VIEW')
assert.equal(metricCodeForPathname('/about/history'), 'JA_HISTORY_VIEW')
assert.equal(metricCodeForPathname('/about/careers'), 'JA_RECRUIT_VIEW')
assert.equal(metricCodeForPathname('/about/careers/42'), 'JA_RECRUIT_POST_VIEW')
assert.equal(metricCodeForPathname('/notices'), 'JA_KOREA_NOTICE_LIST_VIEW')
assert.equal(metricCodeForPathname('/notices/7'), 'JA_KOREA_NOTICE_DETAIL_VIEW')
assert.equal(metricCodeForPathname('/impact'), 'IMPACT_STORY_LIST_VIEW')
assert.equal(metricCodeForPathname('/impact/story-1'), 'IMPACT_STORY_DETAIL_VIEW')
assert.equal(metricCodeForPathname('/education/career'), 'EDU_CAREER_VIEW')
assert.equal(metricCodeForPathname('/education/finance'), 'EDU_ECONOMY_VIEW')
assert.equal(metricCodeForPathname('/education/entrepreneurship'), 'EDU_ENTREPRENEURSHIP_VIEW')
assert.equal(metricCodeForPathname('/education/digital-literacy'), 'EDU_DIGITAL_LITERACY_VIEW')
assert.equal(metricCodeForPathname('/education/textbooks'), 'EDU_MATERIAL_LIST_VIEW')
assert.equal(metricCodeForPathname('/programs'), 'PARTICIPATION_APPLY_VIEW')
assert.equal(metricCodeForPathname('/support/individual'), 'DONATION_PERSONAL_VIEW')
assert.equal(metricCodeForPathname('/support/corporate'), 'DONATION_CORPORATE_VIEW')
assert.equal(metricCodeForPathname('/support/talent'), 'SPONSOR_TALENT_VIEW')

assert.equal(metricCodeForPathname('/'), null)
assert.equal(metricCodeForPathname('/about/directions'), null)
assert.equal(metricCodeForPathname('/results'), null)
assert.equal(metricCodeForPathname('/results/1'), null)
assert.equal(metricCodeForPathname('/programs/1'), null)
assert.equal(metricCodeForPathname('/programs/1/apply'), null)
assert.equal(metricCodeForPathname('/support/corporate/inquiry'), null)
assert.equal(metricCodeForPathname('/support/talent/apply'), null)
assert.equal(metricCodeForPathname('/auth/sign-in'), null)
assert.equal(metricCodeForPathname('/mypage'), null)
assert.equal(metricCodeForPathname('/about/introduction/'), 'JA_ORGANIZATION_VIEW')
