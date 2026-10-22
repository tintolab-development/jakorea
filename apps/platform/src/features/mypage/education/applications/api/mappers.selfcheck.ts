import assert from 'node:assert/strict'
import { mapPortalProgramApplicationDetail } from './mappers.ts'

const mapped = mapPortalProgramApplicationDetail({
  applicationId: 1691620,
  applicationType: 'VOLUNTEER',
  programId: 186290,
  recruitmentId: 186674,
  programTitle: '신청 상세 API 제목',
  programGroup: 'UJAT',
  applicationStatus: 'SUBMITTED',
  displayStatus: '승인대기',
  program: {
    programId: 999999,
    title: '다른 nested 프로그램 제목',
    programGroup: 'GENERAL',
  },
})

assert.ok(mapped)
assert.equal(mapped.id, '1691620')
assert.equal(mapped.applicationType, 'VOLUNTEER')
assert.equal(mapped.programId, '186290')
assert.equal(mapped.recruitmentId, 186674)
assert.equal(mapped.title, '신청 상세 API 제목')
assert.equal(mapped.detailCase, 'ujat-volunteer')

const missingRootIdentity = mapPortalProgramApplicationDetail({
  applicationId: 1691620,
  applicationType: 'VOLUNTEER',
  recruitmentId: 186674,
  applicationStatus: 'SUBMITTED',
  program: {
    programId: 186290,
    title: 'nested fallback 금지',
    programGroup: 'UJAT',
  },
})
assert.equal(missingRootIdentity, null)

const missingRootTitle = mapPortalProgramApplicationDetail({
  applicationId: 1691620,
  applicationType: 'VOLUNTEER',
  programId: 186290,
  recruitmentId: 186674,
  programGroup: 'UJAT',
  applicationStatus: 'SUBMITTED',
  program: { title: 'nested title fallback 금지' },
})
assert.equal(missingRootTitle, null)

console.log('portal application mappers.selfcheck: ok')
