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
assert.equal(mapped.ujatPortalBannerState, undefined)

const ujatOrg = mapPortalProgramApplicationDetail({
  applicationId: 1691621,
  applicationType: 'ORGANIZATION',
  programId: 186291,
  programTitle: 'UJAT 기관 신청',
  programGroup: 'UJAT',
  applicationStatus: 'SUBMITTED',
  displayStatus: '승인 대기',
  supplement: {
    ujat: {
      portalBannerState: 'ACTION_REQUIRED',
      temporarySchedule: {
        slots: [
          {
            scheduleId: 87611,
            scheduleStartAt: '2027-03-12T10:00:00+09:00',
            grade: '1',
            className: '1반',
            studentCount: 28,
            assignmentStatus: 'TEMPORARY',
          },
        ],
      },
    },
  },
})
assert.ok(ujatOrg)
assert.equal(ujatOrg.detailCase, 'ujat-participant')
assert.equal(ujatOrg.ujatPortalBannerState, 'ACTION_REQUIRED')
assert.equal(ujatOrg.ujatRevisionReason, undefined)
assert.deepEqual(ujatOrg.ujatTemporarySchedule, {
  slots: [
    {
      scheduleId: 87611,
      scheduleStartAt: '2027-03-12T10:00:00+09:00',
      grade: '1',
      className: '1반',
      studentCount: 28,
      assignmentStatus: 'TEMPORARY',
    },
  ],
})

const ujatRevision = mapPortalProgramApplicationDetail({
  applicationId: 1691622,
  applicationType: 'ORGANIZATION',
  programId: 186292,
  programTitle: 'UJAT 기관 수정요청',
  programGroup: 'UJAT',
  applicationStatus: 'SUBMITTED',
  displayStatus: '진행 중',
  supplement: {
    ujat: {
      portalBannerState: 'REVISION_REQUIRED',
      revisionReason: '기간에 대한 협의가 필요합니다.',
    },
  },
})
assert.ok(ujatRevision)
assert.equal(ujatRevision.ujatPortalBannerState, 'REVISION_REQUIRED')
assert.equal(ujatRevision.ujatRevisionReason, '기간에 대한 협의가 필요합니다.')
assert.equal(ujatOrg.displayStatus, 'waiting_result')

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
