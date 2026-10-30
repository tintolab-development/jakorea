import assert from 'node:assert/strict'
import { talentInterviewStoryHref } from './interview-href.ts'

assert.equal(talentInterviewStoryHref(11), '/impact/11')
assert.equal(talentInterviewStoryHref('11'), '/impact/11')
assert.equal(talentInterviewStoryHref(null), null)
assert.equal(talentInterviewStoryHref(undefined), null)
assert.equal(talentInterviewStoryHref(0), null)
assert.equal(talentInterviewStoryHref(''), null)
console.log('interview-href.selfcheck: ok')
