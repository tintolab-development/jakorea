import { UJAT_INSTITUTION_APPLICATION_REGIONS } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { UjatInstitutionApplicationDetail } from '@/features/program/ujat/ui/detail-modal/application-institution/detail/detail-types'
import type {
  UjatInstitutionApplicationRow,
  UjatInstitutionScheduleSlotKey,
  UjatInstitutionTempAssignmentStatus,
} from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'
import {
  UJAT_INSTITUTION_SCHEDULE_COLUMNS,
  buildEmptyScheduleSlots,
  formatUjatInstitutionFridayDisplay,
} from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'
import type { UjatScheduleConfirmConfirmedDetailExtras } from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-confirm/confirmed-detail-types'
import type { UjatInstitutionScheduleConfirmStatus } from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-confirm/types'

/** 임시 배정 store 초기 시드 — `schedule-assign/store.ts`에서 1회 적용 */
export type UjatInstitutionScheduleAssignSeedEntry = {
  institutionId: string
  isoDate: string
  gradeValues: string[]
}

export type UjatInstitutionScheduleAssignRegionSeed = {
  maxClassesPerDay?: string
  assignments: UjatInstitutionScheduleAssignSeedEntry[]
}

type UjatInstitutionMockFixture = {
  row: UjatInstitutionApplicationRow
  scheduleConfirmStatus?: UjatInstitutionScheduleConfirmStatus
  scheduleAssignments?: UjatInstitutionScheduleAssignSeedEntry[]
  /** 기관 확인 완료 상세 — 교재·안내 사항 등 */
  confirmedDetailExtras?: UjatScheduleConfirmConfirmedDetailExtras
  detail: Omit<
    UjatInstitutionApplicationDetail,
    'institutionName' | 'regionLabel' | 'tempAssignmentStatus' | 'preferredEducationDates'
  >
}

const CLASS_TIME_PERIOD_GROUP_LOWER: UjatInstitutionApplicationDetail['classTimeRows'][number]['periods'] =
  ['09:00 ~ 09:40', '09:50 ~ 10:30', '10:40 ~ 11:20', '12:10 ~ 12:50']
const CLASS_TIME_PERIOD_GROUP_UPPER: UjatInstitutionApplicationDetail['classTimeRows'][number]['periods'] =
  ['09:00 ~ 09:40', '09:50 ~ 10:30', '10:40 ~ 11:20', '11:30 ~ 12:10']

function buildClassTimeRowsForGrades(
  gradeNumbers: readonly number[],
  periods: UjatInstitutionApplicationDetail['classTimeRows'][number]['periods']
): UjatInstitutionApplicationDetail['classTimeRows'] {
  return gradeNumbers.map(grade => ({
    gradeRangeLabel: `${grade}학년`,
    periods,
  }))
}

const DEFAULT_CLASS_TIME_ROWS: UjatInstitutionApplicationDetail['classTimeRows'] = [
  ...buildClassTimeRowsForGrades([1, 2, 3], CLASS_TIME_PERIOD_GROUP_LOWER),
  ...buildClassTimeRowsForGrades([4, 5, 6], CLASS_TIME_PERIOD_GROUP_UPPER),
]

function buildScheduleSlots(appliedIsoDates: readonly string[]): Record<
  UjatInstitutionScheduleSlotKey,
  'O' | '-'
> {
  const slots = buildEmptyScheduleSlots()
  for (const iso of appliedIsoDates) {
    if (iso in slots) {
      slots[iso as UjatInstitutionScheduleSlotKey] = 'O'
    }
  }
  return slots
}

function buildGradeBlocks(
  gradeClassCounts: UjatInstitutionApplicationRow['gradeClassCounts']
): UjatInstitutionApplicationDetail['gradeBlocks'] {
  return gradeClassCounts.map(grade => ({
    gradeLabel: grade.gradeLabel,
    classCount: grade.classCount,
    classes: Array.from({ length: grade.classCount }, (_, i) => ({
      classNo: i + 1,
      studentCount: 28,
    })),
  }))
}

function buildGradeBlocksFromClasses(
  grades: Array<{
    gradeLabel: string
    classes: Array<{ classNo: number; studentCount: number }>
  }>
): UjatInstitutionApplicationDetail['gradeBlocks'] {
  return grades.map(grade => ({
    gradeLabel: grade.gradeLabel,
    classCount: grade.classes.length,
    classes: grade.classes.map(row => ({ ...row })),
  }))
}

function gradeValuesForGrade(gradeLabel: string, classCount: number): string[] {
  return Array.from({ length: classCount }, (_, i) => `${gradeLabel}:${i + 1}`)
}

function regionLabelForKey(regionKey: UjatInstitutionApplicationRegionKey): string {
  return (
    UJAT_INSTITUTION_APPLICATION_REGIONS.find(r => r.key === regionKey)?.label ?? regionKey
  )
}

function preferredDatesFromSlots(
  slots: UjatInstitutionApplicationRow['scheduleSlots']
): string[] {
  return UJAT_INSTITUTION_SCHEDULE_COLUMNS.filter(col => slots[col.key] === 'O').map(col =>
    formatUjatInstitutionFridayDisplay(col.isoDate)
  )
}

/**
 * 서울 5개 기관 — 목록·상세·임시 배정·임시 배정 기관 확인이 동일 fixture를 참조한다.
 * (임시 배정 현황 = `tempAssignmentStatus`, 일정 확인 현황 = `scheduleConfirmStatus`)
 */
const UJAT_INSTITUTION_SEOUL_FIXTURES: UjatInstitutionMockFixture[] = [
  {
    row: {
      id: 'seoul-1',
      regionKey: 'seoul',
      no: 5,
      institutionName: '신사초등학교',
      tempAssignmentStatus: 'application_rejected',
      gradeClassCounts: [
        { gradeLabel: '1학년', classCount: 4 },
        { gradeLabel: '2학년', classCount: 3 },
      ],
      totalClassCount: 7,
      scheduleSlots: buildScheduleSlots(['2026-04-03', '2026-04-17', '2026-05-08']),
      teacherName: '홍길동',
    },
    detail: {
      address: '서울특별시 송파구 송이로 42',
      addressDetail: '본관 1층 교무실',
      teacherContact: {
        teacherName: '홍길동',
        tel: '02-2145-3301',
        mobile: '010-3342-7819',
        email: 'gildong.hong@naver.com',
      },
      otherRequests: '-',
      gradeBlocks: buildGradeBlocks([
        { gradeLabel: '1학년', classCount: 4 },
        { gradeLabel: '2학년', classCount: 3 },
      ]),
      classTimeRows: DEFAULT_CLASS_TIME_ROWS,
    },
  },
  {
    row: {
      id: 'seoul-2',
      regionKey: 'seoul',
      no: 4,
      institutionName: '마포초등학교',
      tempAssignmentStatus: 'evaluation_pending',
      gradeClassCounts: [
        { gradeLabel: '2학년', classCount: 5 },
        { gradeLabel: '3학년', classCount: 3 },
      ],
      totalClassCount: 8,
      scheduleSlots: buildScheduleSlots(['2026-04-10', '2026-05-22']),
      teacherName: '김철수',
    },
    detail: {
      address: '서울특별시 마포구 월드컵북로 54',
      addressDetail: '행정실 맞은편 배송 접수대',
      teacherContact: {
        teacherName: '김철수',
        tel: '02-3361-8802',
        mobile: '010-5521-9043',
        email: 'chulsoo.kim@gmail.com',
      },
      otherRequests: '오전 1교시 수업 전 교구 상차 지원 부탁드립니다.',
      gradeBlocks: buildGradeBlocks([
        { gradeLabel: '2학년', classCount: 5 },
        { gradeLabel: '3학년', classCount: 3 },
      ]),
      classTimeRows: DEFAULT_CLASS_TIME_ROWS,
    },
  },
  {
    row: {
      id: 'seoul-3',
      regionKey: 'seoul',
      no: 3,
      institutionName: '서울숭인초등학교',
      tempAssignmentStatus: 'temp_assigned',
      gradeClassCounts: [
        { gradeLabel: '1학년', classCount: 4 },
        { gradeLabel: '2학년', classCount: 3 },
      ],
      totalClassCount: 7,
      scheduleSlots: buildScheduleSlots(['2026-04-03', '2026-06-19']),
      teacherName: '이영희',
    },
    scheduleConfirmStatus: 'institution_checking',
    scheduleAssignments: [
      {
        institutionId: 'seoul-3',
        isoDate: '2026-04-03',
        gradeValues: gradeValuesForGrade('1학년', 4),
      },
      {
        institutionId: 'seoul-3',
        isoDate: '2026-06-19',
        gradeValues: gradeValuesForGrade('2학년', 3),
      },
    ],
    detail: {
      address: '서울특별시 종로구 숭인동 1-1',
      addressDetail: '본관 2층 교무실',
      teacherContact: {
        teacherName: '이영희',
        tel: '02-2148-1203',
        mobile: '010-8876-2150',
        email: 'younghee.lee@naver.com',
      },
      otherRequests: '-',
      gradeBlocks: buildGradeBlocks([
        { gradeLabel: '1학년', classCount: 4 },
        { gradeLabel: '2학년', classCount: 3 },
      ]),
      classTimeRows: DEFAULT_CLASS_TIME_ROWS,
    },
  },
  {
    row: {
      id: 'seoul-4',
      regionKey: 'seoul',
      no: 2,
      institutionName: '서울대명초등학교',
      tempAssignmentStatus: 'temp_assigned',
      gradeClassCounts: [
        { gradeLabel: '3학년', classCount: 5 },
        { gradeLabel: '4학년', classCount: 2 },
      ],
      totalClassCount: 7,
      scheduleSlots: buildScheduleSlots(['2026-04-17', '2026-05-08']),
      teacherName: '박민수',
    },
    scheduleConfirmStatus: 'application_rejected',
    scheduleAssignments: [
      {
        institutionId: 'seoul-4',
        isoDate: '2026-04-17',
        gradeValues: gradeValuesForGrade('3학년', 5),
      },
      {
        institutionId: 'seoul-4',
        isoDate: '2026-05-08',
        gradeValues: gradeValuesForGrade('4학년', 2),
      },
    ],
    detail: {
      address: '서울특별시 관악구 신림로 77',
      addressDetail: '본관 2층 교감실 앞',
      teacherContact: {
        teacherName: '박민수',
        tel: '02-8712-4405',
        mobile: '010-2918-6647',
        email: 'minsu.park@kakao.com',
      },
      otherRequests: '교구 배송 시 경비실에 먼저 연락 부탁드립니다.',
      gradeBlocks: buildGradeBlocks([
        { gradeLabel: '3학년', classCount: 5 },
        { gradeLabel: '4학년', classCount: 2 },
      ]),
      classTimeRows: DEFAULT_CLASS_TIME_ROWS,
    },
  },
  {
    row: {
      id: 'seoul-5',
      regionKey: 'seoul',
      no: 1,
      institutionName: '서울신동초등학교',
      tempAssignmentStatus: 'temp_assigned',
      gradeClassCounts: [
        { gradeLabel: '1학년', classCount: 3 },
        { gradeLabel: '5학년', classCount: 4 },
        { gradeLabel: '6학년', classCount: 2 },
      ],
      totalClassCount: 9,
      scheduleSlots: buildScheduleSlots(['2026-04-03', '2026-04-24', '2026-05-29']),
      teacherName: '최지연',
    },
    scheduleConfirmStatus: 'institution_confirmed',
    confirmedDetailExtras: {
      gradeTextbooks: {
        '1학년': {
          textbookName: '우리가족',
          kitSummary: '3키트 (84권)',
          deliveryStatus: 'before_shipping',
        },
        '5학년': {
          textbookName: '우리마을',
          kitSummary: '4키트 (112권)',
          deliveryStatus: 'before_shipping',
        },
        '6학년': {
          textbookName: '우리동네',
          kitSummary: '2키트 (56권)',
          deliveryStatus: 'before_shipping',
        },
      },
      guidanceNotes: {
        searchDeviceGrade6: '6학년 개별 태블릿 사용 가능.',
        waitingArea:
          '후관 2층 1-4 옆 강사 대기실(늘봄교실 1)에서 대기해 주세요. 수업 10분 전 도착 부탁드립니다.',
        textbookDisposalLocation:
          "후관 1층 세면대 옆 '종이 쓰레기 분리함'을 이용해 주세요.",
        otherSpecialNotes:
          "본교 주차장이 협소한 관계로 인근 '동작 공영주차장' 이용을 권장합니다.",
        snackAvailability: '가능',
        sexOffenderCheck: '온라인 제출 | ID: jiyeon.choi | 검증번호: 940412',
      },
    },
    scheduleAssignments: [
      {
        institutionId: 'seoul-5',
        isoDate: '2026-04-03',
        gradeValues: gradeValuesForGrade('1학년', 3),
      },
      {
        institutionId: 'seoul-5',
        isoDate: '2026-04-24',
        gradeValues: gradeValuesForGrade('5학년', 4),
      },
      {
        institutionId: 'seoul-5',
        isoDate: '2026-05-29',
        gradeValues: gradeValuesForGrade('6학년', 2),
      },
    ],
    detail: {
      address: '서울특별시 동작구 신동아파트로 15',
      addressDetail: '별관 1층 과학실 옆 교사실',
      teacherContact: {
        teacherName: '최지연',
        tel: '02-8265-9910',
        mobile: '010-7403-1285',
        email: 'jiyeon.choi@naver.com',
      },
      otherRequests: '급식 시간(12:10~13:00)에는 교실 이동이 어렵습니다.',
      gradeBlocks: buildGradeBlocks([
        { gradeLabel: '1학년', classCount: 3 },
        { gradeLabel: '5학년', classCount: 4 },
        { gradeLabel: '6학년', classCount: 2 },
      ]),
      classTimeRows: DEFAULT_CLASS_TIME_ROWS,
    },
  },
]

const UJAT_INSTITUTION_GWANGJU_FIXTURES: UjatInstitutionMockFixture[] = [
  {
    row: {
      id: 'gwangju-jinwol',
      regionKey: 'gwangju',
      no: 1,
      institutionName: '진월초등학교',
      tempAssignmentStatus: 'temp_assigned',
      gradeClassCounts: [
        { gradeLabel: '1학년', classCount: 8 },
        { gradeLabel: '2학년', classCount: 4 },
      ],
      totalClassCount: 12,
      scheduleSlots: buildScheduleSlots(['2026-04-03', '2026-04-17']),
      teacherName: '이길동',
    },
    scheduleConfirmStatus: 'institution_confirmed',
    scheduleAssignments: [
      {
        institutionId: 'gwangju-jinwol',
        isoDate: '2026-04-03',
        gradeValues: [
          '1학년:1',
          '1학년:2',
          '1학년:3',
          '1학년:4',
          '1학년:5',
          '1학년:6',
        ],
      },
      {
        institutionId: 'gwangju-jinwol',
        isoDate: '2026-04-17',
        gradeValues: [
          '1학년:7',
          '1학년:8',
          '2학년:1',
          '2학년:2',
          '2학년:3',
          '2학년:4',
        ],
      },
    ],
    detail: {
      address: '광주광역시 남구 광복마을4길 40',
      addressDetail: '1층 교무실 이길동 선생님 앞',
      teacherContact: {
        teacherName: '이길동',
        tel: '062-2145-3301',
        mobile: '010-3342-7819',
        email: 'tinto@naver.com',
      },
      otherRequests: '-',
      gradeBlocks: buildGradeBlocksFromClasses([
        {
          gradeLabel: '1학년',
          classes: [
            { classNo: 1, studentCount: 28 },
            { classNo: 2, studentCount: 28 },
            { classNo: 3, studentCount: 24 },
            { classNo: 4, studentCount: 22 },
            { classNo: 5, studentCount: 21 },
            { classNo: 6, studentCount: 28 },
            { classNo: 7, studentCount: 29 },
            { classNo: 8, studentCount: 24 },
          ],
        },
        {
          gradeLabel: '2학년',
          classes: [
            { classNo: 1, studentCount: 28 },
            { classNo: 2, studentCount: 28 },
            { classNo: 3, studentCount: 24 },
            { classNo: 4, studentCount: 22 },
          ],
        },
      ]),
      classTimeRows: DEFAULT_CLASS_TIME_ROWS,
    },
  },
]

const UJAT_INSTITUTION_ALL_FIXTURES: UjatInstitutionMockFixture[] = [
  ...UJAT_INSTITUTION_SEOUL_FIXTURES,
  ...UJAT_INSTITUTION_GWANGJU_FIXTURES,
]

const FIXTURE_BY_ID = new Map(
  UJAT_INSTITUTION_ALL_FIXTURES.map(fixture => [fixture.row.id, fixture])
)

function buildInitialScheduleConfirmStatusMap(): Record<string, UjatInstitutionScheduleConfirmStatus> {
  const map: Record<string, UjatInstitutionScheduleConfirmStatus> = {}
  for (const fixture of UJAT_INSTITUTION_ALL_FIXTURES) {
    if (fixture.scheduleConfirmStatus) {
      map[fixture.row.id] = fixture.scheduleConfirmStatus
    }
  }
  return map
}

/** 지역별 일 예상 최대 학급 수(mock) */
export const UJAT_INSTITUTION_MAX_CLASSES_PER_DAY: Record<
  UjatInstitutionApplicationRegionKey,
  number
> = {
  seoul: 12,
  gyeonggi_south: 11,
  incheon: 10,
  daejeon: 9,
  daegu: 10,
  busan: 11,
  gwangju: 8,
  jeonbuk_jeonju: 8,
}

/** `schedule-assign/store` 1회 시드용 */
export const UJAT_INSTITUTION_SCHEDULE_ASSIGN_SEED: Partial<
  Record<UjatInstitutionApplicationRegionKey, UjatInstitutionScheduleAssignRegionSeed>
> = {
  seoul: {
    maxClassesPerDay: '12',
    assignments: UJAT_INSTITUTION_SEOUL_FIXTURES.flatMap(
      fixture => fixture.scheduleAssignments ?? []
    ),
  },
  gwangju: {
    maxClassesPerDay: '8',
    assignments: UJAT_INSTITUTION_GWANGJU_FIXTURES.flatMap(
      fixture => fixture.scheduleAssignments ?? []
    ),
  },
}

let mockRows: UjatInstitutionApplicationRow[] | null = null
let scheduleConfirmStatusById: Record<string, UjatInstitutionScheduleConfirmStatus> =
  buildInitialScheduleConfirmStatusMap()

function cloneFixtureRows(): UjatInstitutionApplicationRow[] {
  return UJAT_INSTITUTION_ALL_FIXTURES.map(fixture => ({ ...fixture.row }))
}

function ensureMockRows(): UjatInstitutionApplicationRow[] {
  if (!mockRows) {
    mockRows = cloneFixtureRows()
  }
  return mockRows
}

export function getUjatInstitutionApplicationMockRows(): UjatInstitutionApplicationRow[] {
  return ensureMockRows()
}

export function getUjatInstitutionApplicationRowById(
  institutionId: string
): UjatInstitutionApplicationRow | null {
  return ensureMockRows().find(row => row.id === institutionId) ?? null
}

export function getUjatInstitutionApplicationMockRowsByRegion(
  regionKey: UjatInstitutionApplicationRegionKey
): UjatInstitutionApplicationRow[] {
  return ensureMockRows().filter(row => row.regionKey === regionKey)
}

export function patchUjatInstitutionApplicationRows(
  ids: string[],
  status: UjatInstitutionTempAssignmentStatus
): void {
  const set = new Set(ids)
  mockRows = ensureMockRows().map(row =>
    set.has(row.id) ? { ...row, tempAssignmentStatus: status } : row
  )
}

/** 임시 배정 기관 확인 탭 — 기관별 일정 확인 현황 (fixture·패치만, 해시 없음) */
export function getUjatInstitutionScheduleConfirmStatus(
  institutionRowId: string
): UjatInstitutionScheduleConfirmStatus {
  const fromPatch = scheduleConfirmStatusById[institutionRowId]
  if (fromPatch) return fromPatch
  const fixture = FIXTURE_BY_ID.get(institutionRowId)
  if (fixture?.scheduleConfirmStatus) return fixture.scheduleConfirmStatus
  return 'institution_checking'
}

export function patchUjatInstitutionScheduleConfirmStatus(
  ids: string[],
  status: UjatInstitutionScheduleConfirmStatus
): void {
  const next = { ...scheduleConfirmStatusById }
  for (const id of ids) {
    next[id] = status
  }
  scheduleConfirmStatusById = next
}

export function getUjatInstitutionScheduleConfirmConfirmedDetailExtras(
  institutionId: string
): UjatScheduleConfirmConfirmedDetailExtras | undefined {
  return FIXTURE_BY_ID.get(institutionId)?.confirmedDetailExtras
}

export function getUjatInstitutionApplicationDetail(
  row: UjatInstitutionApplicationRow
): UjatInstitutionApplicationDetail {
  const regionLabel = regionLabelForKey(row.regionKey)
  const preferredEducationDates = preferredDatesFromSlots(row.scheduleSlots)
  const fixture = FIXTURE_BY_ID.get(row.id)

  if (fixture) {
    return {
      institutionName: row.institutionName,
      regionLabel,
      tempAssignmentStatus: row.tempAssignmentStatus,
      preferredEducationDates,
      ...fixture.detail,
    }
  }

  return {
    institutionName: row.institutionName,
    regionLabel,
    tempAssignmentStatus: row.tempAssignmentStatus,
    preferredEducationDates,
    address: '-',
    addressDetail: '-',
    teacherContact: {
      teacherName: row.teacherName,
      tel: '-',
      mobile: '-',
      email: '-',
    },
    otherRequests: '-',
    gradeBlocks: buildGradeBlocks(row.gradeClassCounts),
    classTimeRows: DEFAULT_CLASS_TIME_ROWS,
  }
}
