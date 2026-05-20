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
  sumGradeClassCounts,
} from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'

const SEOUL_SCHOOLS = [
  '신사초등학교',
  '마포초등학교',
  '서울숭인초등학교',
  '서울대명초등학교',
  '서울신동초등학교',
  '서울장안초등학교',
  '서울중곡초등학교',
  '서울화곡초등학교',
  '서울가락초등학교',
  '서울문정초등학교',
  '서울잠실초등학교',
  '서울풍납초등학교',
  '서울송파초등학교',
  '서울거여초등학교',
  '서울방이초등학교',
  '서울오금초등학교',
  '서울가락본동초등학교',
  '서울문정동초등학교',
  '서울석촌초등학교',
  '서울삼전초등학교',
  '서울잠실본초등학교',
  '서울신천초등학교',
  '서울풍납동초등학교',
  '서울거여동초등학교',
  '서울마천초등학교',
  '서울문정본동초등학교',
  '서울가락본초등학교',
  '서울송파본초등학교',
  '서울방이동초등학교',
  '서울잠실동초등학교',
] as const

const REGION_SCHOOL_PREFIX: Record<UjatInstitutionApplicationRegionKey, string> = {
  seoul: '서울',
  gyeonggi_south: '경기',
  incheon: '인천',
  daejeon: '대전',
  daegu: '대구',
  busan: '부산',
  gwangju: '광주',
  jeonbuk_jeonju: '전주',
}

const TEACHERS = [
  '홍길동',
  '김철수',
  '이영희',
  '박민수',
  '최지연',
  '정하늘',
  '한소희',
  '윤서준',
  '임도현',
  '강미래',
  '이길동',
] as const

/** 지역별 학교 대표번호(유선) 앞자리 */
const REGION_SCHOOL_TEL_AREA: Record<UjatInstitutionApplicationRegionKey, string> = {
  seoul: '02',
  gyeonggi_south: '031',
  incheon: '032',
  daejeon: '042',
  daegu: '053',
  busan: '051',
  gwangju: '062',
  jeonbuk_jeonju: '063',
}

/** 담당 교사별 휴대폰·이메일(실제 서비스 연동 전 시연용 원문) */
const TEACHER_CONTACT_BY_NAME: Record<
  (typeof TEACHERS)[number],
  { mobile: string; email: string }
> = {
  홍길동: { mobile: '010-3342-7819', email: 'gildong.hong@naver.com' },
  김철수: { mobile: '010-5521-9043', email: 'chulsoo.kim@gmail.com' },
  이영희: { mobile: '010-8876-2150', email: 'younghee.lee@naver.com' },
  박민수: { mobile: '010-2918-6647', email: 'minsu.park@kakao.com' },
  최지연: { mobile: '010-7403-1285', email: 'jiyeon.choi@naver.com' },
  정하늘: { mobile: '010-6182-5094', email: 'haneul.jung@gmail.com' },
  한소희: { mobile: '010-9037-4461', email: 'sohee.han@naver.com' },
  윤서준: { mobile: '010-4756-8320', email: 'seojun.yoon@daum.net' },
  임도현: { mobile: '010-8291-3706', email: 'dohyun.lim@naver.com' },
  강미래: { mobile: '010-1568-9942', email: 'mirae.kang@gmail.com' },
  이길동: { mobile: '010-9876-5432', email: 'tinto@naver.com' },
}

const INSTITUTION_ADDRESS_BY_REGION: Record<
  UjatInstitutionApplicationRegionKey,
  readonly { address: string; addressDetail: string }[]
> = {
  seoul: [
    { address: '서울특별시 송파구 송이로 42', addressDetail: '본관 1층 교무실' },
    { address: '서울특별시 마포구 월드컵북로 54', addressDetail: '행정실 맞은편 배송 접수대' },
    { address: '서울특별시 강서구 화곡로 123', addressDetail: '별관 1층 과학실 옆 교사실' },
    { address: '서울특별시 관악구 신림로 77', addressDetail: '본관 2층 교감실 앞' },
  ],
  gyeonggi_south: [
    { address: '경기도 성남시 분당구 불정로 90', addressDetail: '본관 1층 교무실' },
    { address: '경기도 수원시 영통구 광교호수공원로 80', addressDetail: '행정동 2층' },
    { address: '경기도 용인시 기흥구 동백8길 16', addressDetail: '교장실 맞은편 우편함' },
  ],
  incheon: [
    { address: '인천광역시 남동구 남동대로 933', addressDetail: '본관 1층 교무실' },
    { address: '인천광역시 연수구 청능대로 99', addressDetail: '별관 1층 행정실' },
  ],
  daejeon: [
    { address: '대전광역시 서구 둔산로 117', addressDetail: '본관 1층 교무실' },
    { address: '대전광역시 유성구 대학로 99', addressDetail: '행정실 창구' },
  ],
  daegu: [
    { address: '대구광역시 수성구 달구벌대로 528', addressDetail: '본관 2층 교무실' },
    { address: '대구광역시 북구 침산로 227', addressDetail: '1층 행정실' },
  ],
  busan: [
    { address: '부산광역시 해운대구 해운대로 365', addressDetail: '본관 1층 교무실' },
    { address: '부산광역시 남구 수영로 309', addressDetail: '별관 1층 교사실' },
  ],
  gwangju: [
    { address: '광주광역시 남구 광복마을4길 40', addressDetail: '1층 교무실 이길동 선생님 앞' },
    { address: '광주광역시 북구 첨단과기로 208', addressDetail: '본관 1층 행정실' },
  ],
  jeonbuk_jeonju: [
    { address: '전북특별자치도 전주시 덕진구 건지로 123', addressDetail: '본관 1층 교무실' },
    { address: '전북특별자치도 전주시 완산구 전라감문5길 19', addressDetail: '행정동 1층' },
  ],
}

const OTHER_REQUESTS_SAMPLES = [
  '-',
  '오전 1교시 수업 전 교구 상차 지원 부탁드립니다.',
  '급식 시간(12:10~13:00)에는 교실 이동이 어렵습니다.',
  '교구 배송 시 경비실에 먼저 연락 부탁드립니다.',
] as const

const STATUSES: UjatInstitutionTempAssignmentStatus[] = [
  'evaluation_pending',
  'temp_rejected',
  'temp_assigned',
  'evaluation_pending',
  'temp_assigned',
  'evaluation_pending',
]

const GRADE_BREAKDOWN_TEMPLATES: ReadonlyArray<
  ReadonlyArray<{ gradeLabel: string; classCount: number }>
> = [
  [
    { gradeLabel: '1학년', classCount: 4 },
    { gradeLabel: '2학년', classCount: 7 },
    { gradeLabel: '3학년', classCount: 5 },
    { gradeLabel: '4학년', classCount: 1 },
  ],
  [
    { gradeLabel: '2학년', classCount: 3 },
    { gradeLabel: '3학년', classCount: 5 },
    { gradeLabel: '5학년', classCount: 2 },
  ],
  [
    { gradeLabel: '1학년', classCount: 2 },
    { gradeLabel: '3학년', classCount: 4 },
    { gradeLabel: '4학년', classCount: 3 },
    { gradeLabel: '6학년', classCount: 6 },
  ],
  [
    { gradeLabel: '1학년', classCount: 3 },
    { gradeLabel: '2학년', classCount: 4 },
    { gradeLabel: '5학년', classCount: 5 },
    { gradeLabel: '6학년', classCount: 5 },
  ],
  [
    { gradeLabel: '3학년', classCount: 8 },
    { gradeLabel: '4학년', classCount: 6 },
  ],
  [
    { gradeLabel: '1학년', classCount: 5 },
    { gradeLabel: '2학년', classCount: 5 },
    { gradeLabel: '3학년', classCount: 5 },
    { gradeLabel: '4학년', classCount: 2 },
  ],
]

const SCHEDULE_SLOT_KEYS = UJAT_INSTITUTION_SCHEDULE_COLUMNS.map(col => col.key)

function buildGradeBreakdown(seed: number) {
  return [...GRADE_BREAKDOWN_TEMPLATES[seed % GRADE_BREAKDOWN_TEMPLATES.length]]
}

/** 기관이 신청한 금요일만 O, 나머지 교육 일자 열은 - */
function buildAppliedScheduleSlots(seed: number): Record<UjatInstitutionScheduleSlotKey, 'O' | '-'> {
  const slots = buildEmptyScheduleSlots()
  const applyCount = 2 + (seed % 4)
  for (let i = 0; i < applyCount; i += 1) {
    const key = SCHEDULE_SLOT_KEYS[(seed + i * 3) % SCHEDULE_SLOT_KEYS.length]
    slots[key] = 'O'
  }
  return slots
}

function schoolNameForRegion(region: UjatInstitutionApplicationRegionKey, index: number): string {
  if (region === 'gwangju' && index === 0) {
    return '진월초등학교'
  }
  if (region === 'seoul' && index < SEOUL_SCHOOLS.length) {
    return SEOUL_SCHOOLS[index]
  }
  const prefix = REGION_SCHOOL_PREFIX[region]
  return `${prefix}${['가락', '문정', '잠실', '풍납', '중곡', '화곡'][index % 6]}초등학교`
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

const JINWOL_DETAIL_FIXTURE: Omit<
  UjatInstitutionApplicationDetail,
  'institutionName' | 'regionLabel' | 'tempAssignmentStatus' | 'preferredEducationDates'
> = {
  address: '광주광역시 남구 광복마을4길 40',
  addressDetail: '1층 교무실 이길동 선생님 앞',
  teacherContact: {
    teacherName: '이길동',
    tel: '062-234-8800',
    mobile: '010-9876-5432',
    email: 'tinto@naver.com',
  },
  teacherHomeAddress: '광주광역시 북구 용봉동 1185 한양아파트 105동 804호',
  otherRequests: '-',
  gradeBlocks: [
    {
      gradeLabel: '1학년',
      classCount: 8,
      classes: [
        { classNo: 1, studentCount: 28 },
        { classNo: 2, studentCount: 28 },
        { classNo: 3, studentCount: 28 },
        { classNo: 4, studentCount: 28 },
        { classNo: 5, studentCount: 28 },
        { classNo: 6, studentCount: 28 },
        { classNo: 7, studentCount: 28 },
        { classNo: 8, studentCount: 24 },
      ],
    },
    {
      gradeLabel: '2학년',
      classCount: 4,
      classes: [
        { classNo: 1, studentCount: 28 },
        { classNo: 2, studentCount: 28 },
        { classNo: 3, studentCount: 28 },
        { classNo: 4, studentCount: 22 },
      ],
    },
  ],
  classTimeRows: DEFAULT_CLASS_TIME_ROWS,
}

function regionLabelForKey(regionKey: UjatInstitutionApplicationRegionKey): string {
  return (
    UJAT_INSTITUTION_APPLICATION_REGIONS.find(r => r.key === regionKey)?.label ??
    regionKey
  )
}

function buildSchoolTel(region: UjatInstitutionApplicationRegionKey, seed: number): string {
  const area = REGION_SCHOOL_TEL_AREA[region]
  if (area === '02') {
    const mid = 2000 + (seed % 8000)
    const last = 1000 + ((seed * 7) % 9000)
    return `02-${mid}-${last}`
  }
  const mid = 200 + (seed % 800)
  const last = 1000 + ((seed * 11) % 9000)
  return `${area}-${mid}-${last}`
}

function buildTeacherContact(
  teacherName: string,
  region: UjatInstitutionApplicationRegionKey,
  seed: number
): UjatInstitutionApplicationDetail['teacherContact'] {
  const profile =
    TEACHER_CONTACT_BY_NAME[teacherName as (typeof TEACHERS)[number]] ??
    TEACHER_CONTACT_BY_NAME['홍길동']
  return {
    teacherName,
    tel: buildSchoolTel(region, seed),
    mobile: profile.mobile,
    email: profile.email,
  }
}

function buildInstitutionAddress(
  region: UjatInstitutionApplicationRegionKey,
  seed: number
): { address: string; addressDetail: string } {
  const pool = INSTITUTION_ADDRESS_BY_REGION[region]
  return pool[seed % pool.length] ?? pool[0]
}

function buildGradeBlocksFromRow(
  row: UjatInstitutionApplicationRow,
  seed: number
): UjatInstitutionApplicationDetail['gradeBlocks'] {
  return row.gradeClassCounts.map((grade, gradeIndex) => {
    const classes = Array.from({ length: grade.classCount }, (_, classIndex) => ({
      classNo: classIndex + 1,
      studentCount: 28 - ((seed + gradeIndex + classIndex) % 5),
    }))
    return {
      gradeLabel: grade.gradeLabel,
      classCount: grade.classCount,
      classes,
    }
  })
}

function preferredDatesFromSlots(
  slots: UjatInstitutionApplicationRow['scheduleSlots']
): string[] {
  return UJAT_INSTITUTION_SCHEDULE_COLUMNS.filter(col => slots[col.key] === 'O').map(col =>
    formatUjatInstitutionFridayDisplay(col.isoDate)
  )
}

function buildRowsForRegion(
  region: UjatInstitutionApplicationRegionKey,
  count: number
): UjatInstitutionApplicationRow[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + region.length
    const gradeClassCounts = buildGradeBreakdown(seed)
    const totalClassCount = sumGradeClassCounts(gradeClassCounts)
    return {
      id: `${region}-${i + 1}`,
      regionKey: region,
      no: count - i,
      institutionName: schoolNameForRegion(region, i),
      tempAssignmentStatus:
        region === 'gwangju' && i === 0
          ? 'evaluation_pending'
          : STATUSES[seed % STATUSES.length],
      gradeClassCounts,
      totalClassCount,
      scheduleSlots: buildAppliedScheduleSlots(seed * 5),
      teacherName: TEACHERS[i % TEACHERS.length],
    }
  })
}

const ROW_COUNTS: Record<UjatInstitutionApplicationRegionKey, number> = {
  seoul: 30,
  gyeonggi_south: 28,
  incheon: 22,
  daejeon: 18,
  daegu: 20,
  busan: 24,
  gwangju: 16,
  jeonbuk_jeonju: 14,
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

let mockRows: UjatInstitutionApplicationRow[] | null = null

function ensureMockRows(): UjatInstitutionApplicationRow[] {
  if (!mockRows) {
    mockRows = (
      Object.keys(ROW_COUNTS) as UjatInstitutionApplicationRegionKey[]
    ).flatMap(region => buildRowsForRegion(region, ROW_COUNTS[region]))
  }
  return mockRows
}

export function getUjatInstitutionApplicationMockRows(): UjatInstitutionApplicationRow[] {
  return ensureMockRows()
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

export function getUjatInstitutionApplicationDetail(
  row: UjatInstitutionApplicationRow
): UjatInstitutionApplicationDetail {
  const regionLabel = regionLabelForKey(row.regionKey)
  const preferredEducationDates = preferredDatesFromSlots(row.scheduleSlots)
  const seed = row.id.length + row.no

  if (row.institutionName === '진월초등학교') {
    return {
      institutionName: row.institutionName,
      regionLabel,
      tempAssignmentStatus: row.tempAssignmentStatus,
      preferredEducationDates:
        preferredEducationDates.length > 0
          ? preferredEducationDates
          : [
              '26년 4월 24일(금)',
              '26년 5월 8일(금)',
              '26년 10월 30일(금)',
              '26년 11월 20일(금)',
            ],
      ...JINWOL_DETAIL_FIXTURE,
    }
  }

  const teacherName = row.teacherName
  const address = buildInstitutionAddress(row.regionKey, seed)
  return {
    institutionName: row.institutionName,
    regionLabel,
    tempAssignmentStatus: row.tempAssignmentStatus,
    address: address.address,
    addressDetail: address.addressDetail,
    teacherContact: buildTeacherContact(teacherName, row.regionKey, seed),
    otherRequests: OTHER_REQUESTS_SAMPLES[seed % OTHER_REQUESTS_SAMPLES.length],
    gradeBlocks: buildGradeBlocksFromRow(row, seed),
    classTimeRows: DEFAULT_CLASS_TIME_ROWS,
    preferredEducationDates,
  }
}
