import assert from 'node:assert/strict'
import {
  isWithdrawnBeforeEducation,
  isWithdrawnDuringEducation,
} from '../lib/display-status.ts'
import {
  isPersonalCertificateActionable,
  portalCertificateIssueType,
  shouldShowPersonalCertificateAction,
} from '../lib/personal-certificate-eligibility.ts'
import type { EducationApplicationListItem } from '../model/types.ts'
import {
  resolveLastParticipatedSession,
  resolvePortalWithdrawalPhase,
} from './map-portal-withdrawal-phase.ts'

const PROGRAM_APPLICATION_STATUSES = new Set(['waiting_result', 'document_passed', 'rejected'])
const ACTIVITY_STATUSES = new Set(['in_progress', 'completed'])

function wouldShowPersonalCertificatePanel(
  mapped: Pick<
    EducationApplicationListItem,
    'displayStatus' | 'withdrawalPhase' | 'applicationType' | 'programType' | 'programGroup' | 'detailCase'
  >,
  extra?: { isTeacher?: boolean },
) {
  const isWithdrawnDuring = isWithdrawnDuringEducation(mapped)
  const isProgramApplicationStatus =
    PROGRAM_APPLICATION_STATUSES.has(mapped.displayStatus) || isWithdrawnBeforeEducation(mapped)
  const isActivityStatus = ACTIVITY_STATUSES.has(mapped.displayStatus)
  return (
    !isProgramApplicationStatus &&
    (isActivityStatus || isWithdrawnDuring) &&
    shouldShowPersonalCertificateAction({
      isTeacher: extra?.isTeacher,
      applicationType: mapped.applicationType,
      programType: mapped.programType,
      programGroup: mapped.programGroup,
      detailCase: mapped.detailCase,
    })
  )
}

const giveUpRow = {
  applicationId: 2001,
  applicationType: 'INDIVIDUAL',
  programId: 3001,
  programType: 'GENERAL_EDUCATION',
  programGroup: 'GENERAL',
  programTitle: 'GIVE_UP',
  displayStatus: '활동 포기',
  applicationStatus: 'GIVE_UP',
  participation: {
    participantId: 4001,
    status: 'GIVE_UP',
    firstEducationAt: '2026-09-01T00:00:00+09:00',
    lastEducationAt: '2026-09-15T00:00:00+09:00',
    progressPercent: 40,
    certificateStatus: 'AVAILABLE',
  },
}

const giveUpPhase = resolvePortalWithdrawalPhase(giveUpRow, 'withdrawn')
assert.equal(giveUpPhase, 'during_education')
assert.equal(resolveLastParticipatedSession(giveUpRow), undefined)

const giveUpMapped = {
  displayStatus: 'withdrawn' as const,
  withdrawalPhase: giveUpPhase,
  applicationType: 'INDIVIDUAL' as const,
  programType: 'GENERAL_EDUCATION',
  programGroup: 'GENERAL',
  detailCase: 'general' as const,
}
assert.equal(isWithdrawnDuringEducation(giveUpMapped), true)
assert.equal(wouldShowPersonalCertificatePanel(giveUpMapped), true)
assert.equal(portalCertificateIssueType('PARTICIPATION'), 'PARTICIPATION')
assert.equal(isPersonalCertificateActionable({ available: true, canDownload: false }), true)

const issuedGiveUp = {
  ...giveUpMapped,
}
assert.equal(wouldShowPersonalCertificatePanel(issuedGiveUp), true)
assert.equal(isPersonalCertificateActionable({ available: false, canDownload: true }), true)

const zeroAttendanceGiveUp = {
  ...giveUpMapped,
}
assert.equal(wouldShowPersonalCertificatePanel(zeroAttendanceGiveUp), true)
assert.equal(isPersonalCertificateActionable({ available: false, canDownload: false }), false)

const cancelledPhase = resolvePortalWithdrawalPhase(
  {
    displayStatus: '신청 취소',
    applicationStatus: 'CANCELLED',
  },
  'withdrawn',
)
assert.equal(cancelledPhase, 'before_education')
assert.equal(
  wouldShowPersonalCertificatePanel({
    displayStatus: 'withdrawn',
    withdrawalPhase: cancelledPhase,
    applicationType: 'INDIVIDUAL',
    programType: 'GENERAL_EDUCATION',
    programGroup: 'GENERAL',
    detailCase: 'general',
  }),
  false,
)

assert.equal(
  resolvePortalWithdrawalPhase(
    { displayStatus: '진행 중', applicationStatus: 'IN_PROGRESS' },
    'in_progress',
  ),
  undefined,
)
assert.equal(
  wouldShowPersonalCertificatePanel({
    displayStatus: 'in_progress',
    applicationType: 'INDIVIDUAL',
    programType: 'GENERAL_EDUCATION',
    programGroup: 'GENERAL',
    detailCase: 'general',
  }),
  true,
)

assert.equal(
  resolvePortalWithdrawalPhase(
    { displayStatus: '진행 완료', applicationStatus: 'COMPLETED' },
    'completed',
  ),
  undefined,
)
assert.equal(
  wouldShowPersonalCertificatePanel({
    displayStatus: 'completed',
    applicationType: 'INDIVIDUAL',
    programType: 'GENERAL_EDUCATION',
    programGroup: 'GENERAL',
    detailCase: 'general',
  }),
  true,
)

assert.equal(
  resolvePortalWithdrawalPhase(
    {
      displayStatus: '활동 포기',
      applicationStatus: 'GIVE_UP',
    },
    'withdrawn',
  ),
  'during_education',
)
assert.equal(
  wouldShowPersonalCertificatePanel(
    {
      displayStatus: 'withdrawn',
      withdrawalPhase: 'during_education',
      applicationType: 'ORGANIZATION',
      programType: 'TRAINED_TEACHER',
      programGroup: 'TRAINED_TEACHER',
      detailCase: 'general',
    },
    { isTeacher: true },
  ),
  false,
)
assert.equal(
  wouldShowPersonalCertificatePanel({
    displayStatus: 'withdrawn',
    withdrawalPhase: 'during_education',
    applicationType: 'INDIVIDUAL',
    programType: 'UJAT',
    programGroup: 'UJAT',
    detailCase: 'ujat-participant',
  }),
  false,
)

assert.equal(
  resolveLastParticipatedSession({ lastParticipatedSession: 3 } as never),
  3,
)
assert.equal(resolveLastParticipatedSession({}), undefined)

assert.equal(
  resolvePortalWithdrawalPhase(
    { withdrawalPhase: 'during_education', displayStatus: 'WITHDRAWN' } as never,
    'withdrawn',
  ),
  'during_education',
)

console.log('map-portal-withdrawal-phase.selfcheck: ok')
