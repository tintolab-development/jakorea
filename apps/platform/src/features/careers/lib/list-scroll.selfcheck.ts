import assert from 'node:assert/strict'
import { CAREERS_SCROLL_TO_JOBS_STATE, shouldScrollToCareersJobs } from './list-scroll.ts'

// 상세 「목록으로」가 실어 보낸 state만 목록 영역으로 스크롤한다(QA-0486)
assert.equal(shouldScrollToCareersJobs(CAREERS_SCROLL_TO_JOBS_STATE), true)
assert.equal(shouldScrollToCareersJobs(null), false)
assert.equal(shouldScrollToCareersJobs({ from: '/about/careers?page=2' }), false)
assert.equal(shouldScrollToCareersJobs({ careersScrollToJobs: 'true' }), false)

console.log('careers list scroll selfcheck ok')
