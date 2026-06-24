import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type {
  UjatAssignmentReportState,
  UjatAssignmentSessionGroup,
  UjatAssignmentVolunteerRow,
} from '@/features/program/ujat/ui/detail-modal/progress/assignments/types'
import { UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import { formatAssignmentDateLabel } from '@/features/program/ujat/ui/detail-modal/progress/assignments/assignment-display'
import { cloneAssignmentVolunteerRows } from '@/features/program/ujat/ui/detail-modal/progress/assignments/assignment-display'

const DEFAULT_PLAN_PERIOD = '26. 01. 05 (월) ~ 26. 01. 09(금)'
const DEFAULT_LOG_PERIOD = '26. 01. 05 (월) ~ 26. 01. 09(금)'

type ReportSeed = UjatAssignmentReportState

type VolunteerSeed = {
  name: string
  institutionName: string
  assignedClass: string
  plan: ReportSeed
  log: ReportSeed
  isDropout?: boolean
  hasProgressHistory?: boolean
}

function buildVolunteerRow(
  sessionId: string,
  index: number,
  seed: VolunteerSeed
): UjatAssignmentVolunteerRow {
  return {
    id: `${sessionId}-vol-${index}`,
    name: seed.name,
    institutionName: seed.institutionName,
    assignedClass: seed.assignedClass,
    plan: { ...seed.plan },
    log: { ...seed.log },
    isDropout: seed.isDropout ?? false,
    hasProgressHistory: seed.hasProgressHistory,
  }
}

function buildVolunteersFromSeeds(
  sessionId: string,
  seeds: VolunteerSeed[]
): UjatAssignmentVolunteerRow[] {
  return seeds.map((seed, index) => buildVolunteerRow(sessionId, index + 1, seed))
}

function sessionGroup(params: {
  id: string
  regionKey: UjatInstitutionApplicationRegionKey
  half: EducationProgressHalfKey
  isoDate: string
  planSubmissionPeriodLabel?: string
  logSubmissionPeriodLabel?: string
  seeds: VolunteerSeed[]
}): UjatAssignmentSessionGroup {
  return {
    id: params.id,
    regionKey: params.regionKey,
    half: params.half,
    isoDate: params.isoDate,
    dateLabel: formatAssignmentDateLabel(params.isoDate),
    planSubmissionPeriodLabel: params.planSubmissionPeriodLabel ?? DEFAULT_PLAN_PERIOD,
    logSubmissionPeriodLabel: params.logSubmissionPeriodLabel ?? DEFAULT_LOG_PERIOD,
    volunteers: buildVolunteersFromSeeds(params.id, params.seeds),
  }
}

const submitted = (): ReportSeed => ({ status: 'submitted' })
const notSubmitted = (): ReportSeed => ({ status: 'not_submitted' })
const planLate = (date: string): ReportSeed => ({
  status: 'deadline_missed',
  submittedDateLabel: date,
})
const planRevised = (date: string): ReportSeed => ({
  status: 'revised',
  submittedDateLabel: date,
})
const logLate = (date: string): ReportSeed => ({
  status: 'deadline_missed',
  submittedDateLabel: date,
})
const logRevised = (date: string): ReportSeed => ({
  status: 'revised',
  submittedDateLabel: date,
})
const feedbackDelivered = (date: string): ReportSeed => ({
  status: 'submitted',
  feedbackDeliveredDateLabel: date,
})

const GUIL_INST = '구일초등학교'

/** 스크린샷 기준 서울 구일초 24건 */
const SEOUL_GUIL_ASSIGNMENT_SEEDS: VolunteerSeed[] = [
  /** 제출 현황 필터 전체 상태 확인용 대표 row */
  { name: '김지윤', institutionName: GUIL_INST, assignedClass: '2학년 1반', plan: submitted(), log: submitted() },
  { name: '이서연', institutionName: GUIL_INST, assignedClass: '2학년 2반', plan: notSubmitted(), log: submitted() },
  { name: '박민준', institutionName: GUIL_INST, assignedClass: '2학년 3반', plan: submitted(), log: notSubmitted() },
  { name: '최유진', institutionName: GUIL_INST, assignedClass: '2학년 4반', plan: notSubmitted(), log: notSubmitted() },
  { name: '정하은', institutionName: GUIL_INST, assignedClass: '2학년 5반', plan: planLate('26. 01. 11'), log: submitted() },
  { name: '강민지', institutionName: GUIL_INST, assignedClass: '2학년 6반', plan: submitted(), log: logLate('26. 01. 11') },
  { name: '윤서준', institutionName: GUIL_INST, assignedClass: '2학년 7반', plan: planLate('26. 01. 11'), log: logLate('26. 01. 11') },
  { name: '임도윤', institutionName: GUIL_INST, assignedClass: '3학년 1반', plan: submitted(), log: submitted() },
  { name: '한소율', institutionName: GUIL_INST, assignedClass: '3학년 2반', plan: submitted(), log: submitted() },
  { name: '오지후', institutionName: GUIL_INST, assignedClass: '3학년 3반', plan: feedbackDelivered('26. 01. 11'), log: submitted() },
  { name: '서예린', institutionName: GUIL_INST, assignedClass: '3학년 4반', plan: submitted(), log: submitted() },
  { name: '신우진', institutionName: GUIL_INST, assignedClass: '3학년 5반', plan: submitted(), log: submitted() },
  { name: '권나연', institutionName: GUIL_INST, assignedClass: '3학년 6반', plan: submitted(), log: submitted() },
  { name: '황수진', institutionName: GUIL_INST, assignedClass: '5학년 2반', plan: submitted(), log: submitted() },
  { name: '조현우', institutionName: GUIL_INST, assignedClass: '5학년 3반', plan: submitted(), log: submitted() },
  { name: '배서윤', institutionName: GUIL_INST, assignedClass: '5학년 4반', plan: planRevised('26. 01. 11'), log: submitted() },
  { name: '허유진', institutionName: GUIL_INST, assignedClass: '2학년 5반', plan: submitted(), log: logRevised('26. 01. 11') },
  { name: '노승민', institutionName: GUIL_INST, assignedClass: '4학년 1반', plan: submitted(), log: submitted() },
  { name: '류지안', institutionName: GUIL_INST, assignedClass: '4학년 2반', plan: submitted(), log: submitted() },
  { name: '홍태양', institutionName: GUIL_INST, assignedClass: '4학년 3반', plan: submitted(), log: submitted() },
  { name: '문채원', institutionName: GUIL_INST, assignedClass: '6학년 1반', plan: submitted(), log: submitted() },
  { name: '양준호', institutionName: GUIL_INST, assignedClass: '6학년 2반', plan: submitted(), log: submitted() },
  { name: '김민토', institutionName: GUIL_INST, assignedClass: '1학년 2반', plan: submitted(), log: submitted() },
  {
    name: '박틴토',
    institutionName: GUIL_INST,
    assignedClass: '5학년 1반',
    plan: submitted(),
    log: submitted(),
    isDropout: true,
    hasProgressHistory: true,
  },
]

function buildH1Fixtures(): UjatAssignmentSessionGroup[] {
  return [
    sessionGroup({
      id: 'h1-seoul-guil-20260403',
      regionKey: 'seoul',
      half: 'h1',
      isoDate: '2026-04-03',
      seeds: SEOUL_GUIL_ASSIGNMENT_SEEDS,
    }),
    sessionGroup({
      id: 'h1-seoul-mapo-20260417',
      regionKey: 'seoul',
      half: 'h1',
      isoDate: '2026-04-17',
      seeds: [
        {
          name: '이민토',
          institutionName: '마포초등학교',
          assignedClass: '3학년 1반',
          plan: submitted(),
          log: submitted(),
        },
        {
          name: '최준영',
          institutionName: '마포초등학교',
          assignedClass: '3학년 2반',
          plan: planLate('26. 01. 11'),
          log: submitted(),
        },
        {
          name: '정수빈',
          institutionName: '마포초등학교',
          assignedClass: '4학년 1반',
          plan: notSubmitted(),
          log: submitted(),
        },
      ],
    }),
    sessionGroup({
      id: 'h1-seoul-sinsa-20260508',
      regionKey: 'seoul',
      half: 'h1',
      isoDate: '2026-05-08',
      seeds: [
        {
          name: '윤하린',
          institutionName: '신사초등학교',
          assignedClass: '2학년 1반',
          plan: submitted(),
          log: notSubmitted(),
        },
      ],
    }),
    sessionGroup({
      id: 'h1-gyeonggi-suwon-20260410',
      regionKey: 'gyeonggi_south',
      half: 'h1',
      isoDate: '2026-04-10',
      seeds: [
        {
          name: '강태훈',
          institutionName: '수원초등학교',
          assignedClass: '2학년 1반',
          plan: submitted(),
          log: submitted(),
        },
        {
          name: '임서아',
          institutionName: '수원초등학교',
          assignedClass: '2학년 2반',
          plan: planLate('26. 01. 11'),
          log: logLate('26. 01. 11'),
        },
        {
          name: '오민석',
          institutionName: '수원초등학교',
          assignedClass: '3학년 1반',
          plan: notSubmitted(),
          log: notSubmitted(),
        },
      ],
    }),
    sessionGroup({
      id: 'h1-gyeonggi-seongnam-20260424',
      regionKey: 'gyeonggi_south',
      half: 'h1',
      isoDate: '2026-04-24',
      seeds: [
        {
          name: '배윤서',
          institutionName: '성남초등학교',
          assignedClass: '1학년 1반',
          plan: submitted(),
          log: logLate('26. 01. 11'),
        },
      ],
    }),
    sessionGroup({
      id: 'h1-incheon-namdong-20260403',
      regionKey: 'incheon',
      half: 'h1',
      isoDate: '2026-04-03',
      seeds: [
        {
          name: '최은우',
          institutionName: '인천남동초등학교',
          assignedClass: '2학년 1반',
          plan: submitted(),
          log: submitted(),
        },
        {
          name: '정다은',
          institutionName: '인천남동초등학교',
          assignedClass: '2학년 2반',
          plan: planRevised('26. 01. 11'),
          log: submitted(),
        },
      ],
    }),
    sessionGroup({
      id: 'h1-daejeon-20260410',
      regionKey: 'daejeon',
      half: 'h1',
      isoDate: '2026-04-10',
      seeds: [
        {
          name: '조민호',
          institutionName: '대전중앙초등학교',
          assignedClass: '2학년 1반',
          plan: notSubmitted(),
          log: submitted(),
        },
        {
          name: '신유나',
          institutionName: '대전중앙초등학교',
          assignedClass: '2학년 2반',
          plan: submitted(),
          log: notSubmitted(),
        },
      ],
    }),
    sessionGroup({
      id: 'h1-daegu-20260403',
      regionKey: 'daegu',
      half: 'h1',
      isoDate: '2026-04-03',
      seeds: [
        {
          name: '박성민',
          institutionName: '대구수성초등학교',
          assignedClass: '2학년 1반',
          plan: submitted(),
          log: submitted(),
        },
        {
          name: '한예슬',
          institutionName: '대구수성초등학교',
          assignedClass: '5학년 1반',
          plan: submitted(),
          log: submitted(),
          isDropout: true,
        },
      ],
    }),
    sessionGroup({
      id: 'h1-busan-20260410',
      regionKey: 'busan',
      half: 'h1',
      isoDate: '2026-04-10',
      seeds: [
        {
          name: '윤지호',
          institutionName: '부산해운대초등학교',
          assignedClass: '2학년 1반',
          plan: submitted(),
          log: submitted(),
        },
      ],
    }),
    sessionGroup({
      id: 'h1-gwangju-20260403',
      regionKey: 'gwangju',
      half: 'h1',
      isoDate: '2026-04-03',
      seeds: [
        {
          name: '김하늘',
          institutionName: '진월초등학교',
          assignedClass: '2학년 1반',
          plan: planLate('26. 01. 11'),
          log: submitted(),
        },
      ],
    }),
    sessionGroup({
      id: 'h1-jeonbuk-20260417',
      regionKey: 'jeonbuk_jeonju',
      half: 'h1',
      isoDate: '2026-04-17',
      seeds: [
        {
          name: '정윤아',
          institutionName: '전주효자초등학교',
          assignedClass: '2학년 1반',
          plan: submitted(),
          log: planRevised('26. 01. 11'),
        },
        {
          name: '한동욱',
          institutionName: '전주효자초등학교',
          assignedClass: '2학년 2반',
          plan: notSubmitted(),
          log: notSubmitted(),
        },
      ],
    }),
  ]
}

function buildH2Fixtures(): UjatAssignmentSessionGroup[] {
  return [
    sessionGroup({
      id: 'h2-seoul-20260911',
      regionKey: 'seoul',
      half: 'h2',
      isoDate: '2026-09-11',
      planSubmissionPeriodLabel: '26. 08. 01 (월) ~ 26. 08. 05(금)',
      logSubmissionPeriodLabel: '26. 08. 01 (월) ~ 26. 08. 05(금)',
      seeds: [
        {
          name: '김지윤',
          institutionName: '서울숭인초등학교',
          assignedClass: '2학년 1반',
          plan: submitted(),
          log: submitted(),
        },
      ],
    }),
    sessionGroup({
      id: 'h2-gyeonggi-20260918',
      regionKey: 'gyeonggi_south',
      half: 'h2',
      isoDate: '2026-09-18',
      seeds: [
        {
          name: '강태훈',
          institutionName: '용인초등학교',
          assignedClass: '2학년 1반',
          plan: submitted(),
          log: submitted(),
        },
      ],
    }),
    sessionGroup({
      id: 'h2-incheon-20260911',
      regionKey: 'incheon',
      half: 'h2',
      isoDate: '2026-09-11',
      seeds: [
        {
          name: '최은우',
          institutionName: '인천연수초등학교',
          assignedClass: '2학년 1반',
          plan: submitted(),
          log: logLate('26. 08. 08'),
        },
      ],
    }),
    sessionGroup({
      id: 'h2-daejeon-20260918',
      regionKey: 'daejeon',
      half: 'h2',
      isoDate: '2026-09-18',
      seeds: [
        {
          name: '조민호',
          institutionName: '대전유성초등학교',
          assignedClass: '2학년 1반',
          plan: notSubmitted(),
          log: notSubmitted(),
        },
      ],
    }),
    sessionGroup({
      id: 'h2-daegu-20260911',
      regionKey: 'daegu',
      half: 'h2',
      isoDate: '2026-09-11',
      seeds: [
        {
          name: '한예슬',
          institutionName: '대구북구초등학교',
          assignedClass: '3학년 1반',
          plan: submitted(),
          log: submitted(),
          isDropout: true,
        },
      ],
    }),
    sessionGroup({
      id: 'h2-busan-20260918',
      regionKey: 'busan',
      half: 'h2',
      isoDate: '2026-09-18',
      seeds: [
        {
          name: '윤지호',
          institutionName: '부산서면초등학교',
          assignedClass: '2학년 1반',
          plan: submitted(),
          log: submitted(),
        },
      ],
    }),
    sessionGroup({
      id: 'h2-gwangju-20260911',
      regionKey: 'gwangju',
      half: 'h2',
      isoDate: '2026-09-11',
      seeds: [
        {
          name: '김하늘',
          institutionName: '진월초등학교',
          assignedClass: '2학년 1반',
          plan: submitted(),
          log: submitted(),
        },
      ],
    }),
    sessionGroup({
      id: 'h2-jeonbuk-20260918',
      regionKey: 'jeonbuk_jeonju',
      half: 'h2',
      isoDate: '2026-09-18',
      seeds: [
        {
          name: '정윤아',
          institutionName: '전주완산초등학교',
          assignedClass: '2학년 1반',
          plan: planLate('26. 08. 08'),
          log: logLate('26. 08. 08'),
        },
      ],
    }),
  ]
}

const ASSIGNMENT_FIXTURES: UjatAssignmentSessionGroup[] = [
  ...buildH1Fixtures(),
  ...buildH2Fixtures(),
]

const sessionStore = new Map<string, UjatAssignmentSessionGroup>()

function cloneSession(session: UjatAssignmentSessionGroup): UjatAssignmentSessionGroup {
  return {
    ...session,
    volunteers: cloneAssignmentVolunteerRows(session.volunteers),
  }
}

function ensureSessionStore(): void {
  if (sessionStore.size > 0) return
  for (const session of ASSIGNMENT_FIXTURES) {
    sessionStore.set(session.id, cloneSession(session))
  }
}

export function getUjatEducationProgressAssignmentSessions(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): UjatAssignmentSessionGroup[] {
  ensureSessionStore()
  return [...sessionStore.values()]
    .filter(s => s.half === half && s.regionKey === regionKey)
    .map(cloneSession)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
}

export function getUjatEducationProgressAssignmentDateOptions(
  half: EducationProgressHalfKey
): Array<{ label: string; value: string }> {
  return UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES.filter(entry => entry.semester === half).map(
    entry => ({
      label: formatAssignmentDateLabel(entry.isoDate),
      value: entry.isoDate,
    })
  )
}

export function getUjatEducationProgressAssignmentInstitutionOptions(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): Array<{ label: string; value: string }> {
  const sessions = getUjatEducationProgressAssignmentSessions(half, regionKey)
  const names = new Set<string>()
  for (const session of sessions) {
    for (const row of session.volunteers) {
      if (row.isDropout && row.hasProgressHistory !== true) continue
      names.add(row.institutionName)
    }
  }
  return [...names].sort().map(name => ({ label: name, value: name }))
}

export function resetUjatEducationProgressAssignmentMockStore(): void {
  sessionStore.clear()
}
