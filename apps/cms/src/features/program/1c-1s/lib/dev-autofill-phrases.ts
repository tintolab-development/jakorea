import dayjs, { type Dayjs } from 'dayjs'

/**
 * 1사1교 등록 개발용 자동입력 문구.
 * 노션 「1사1교 특징」·「1사1교 프로그램 등록 폼」에 맞는 문장만 고른다.
 * 공통 샘플(진로·디지털 리터러시·기업가정신·봉사자)은 후보에 넣지 않는다.
 */

export type EconomyAutofillProgramPhrase = {
  titleKo: string
  titleEn: string
  publicTitle: string
}

export type EconomyAutofillUnitPhrase = {
  name: string
  content: string
}

export type EconomyAutofillRecruitPhrase = {
  programDescription: string
  recruitmentGuide: string
  applicationMethod: string
  learningSupportContent: string
  otherNotes: string
  additionalContentHtml: string
  notes: string
}

export type EconomyAutofillPhraseSelection = {
  program: EconomyAutofillProgramPhrase
  /** 2차시 고정. 한 쌍을 통째로 골라 단원명·교육 내용이 같은 주제로 맞는다. */
  units: readonly [EconomyAutofillUnitPhrase, EconomyAutofillUnitPhrase]
  recruit: EconomyAutofillRecruitPhrase
  /** 초·중·고만. 대학·성인은 1사1교 학교/기관 대상이 아니다. */
  targetLevels: readonly ('elementary' | 'middle' | 'high')[]
  targetLevelDetail: string
}

const SCHOOL_TARGET_DETAIL = {
  elementary: '초등학교 4~6학년',
  middle: '중학교 1~3학년',
  high: '고등학교 1~3학년',
} as const

type SchoolTarget = keyof typeof SCHOOL_TARGET_DETAIL

function programPhrases(year: number): readonly EconomyAutofillProgramPhrase[] {
  return [
    {
      titleKo: '1사1교 경제금융교육',
      titleEn: '1 Company 1 School Economics and Finance Education',
      publicTitle: `${year} 1사1교 경제금융교육 참여 학교·강사 모집`,
    },
    {
      titleKo: '1사1교 현명한 소비와 저축',
      titleEn: '1 Company 1 School Wise Spending and Saving',
      publicTitle: `${year} 1사1교 소비·저축 교육 참여 학교 모집`,
    },
    {
      titleKo: '1사1교 우리 동네 경제 탐험',
      titleEn: '1 Company 1 School Local Economy Exploration',
      publicTitle: `${year} 1사1교 지역 경제 교육 참여 기관 모집`,
    },
    {
      titleKo: '1사1교 용돈 관리 교실',
      titleEn: '1 Company 1 School Allowance Management Class',
      publicTitle: `${year} 1사1교 용돈 관리 교육 참여 학교·강사 모집`,
    },
  ]
}

/** 2차시가 한 주제 안에서 이어지도록 쌍으로만 둔다. */
const CURRICULUM_PAIRS: readonly (readonly [EconomyAutofillUnitPhrase, EconomyAutofillUnitPhrase])[] =
  [
    [
      {
        name: '필요와 욕구, 현명한 소비',
        content: '필요한 것과 갖고 싶은 것을 구분하고 하루 소비 계획을 세워 봅니다.',
      },
      {
        name: '저축 목표 세우기',
        content: '용돈 사용 내역을 보고 한 달 저축 목표와 방법을 정합니다.',
      },
    ],
    [
      {
        name: '돈의 역할과 교환',
        content: '돈으로 물건을 사고파는 이유를 사례로 알아보고 교환의 기준을 정리합니다.',
      },
      {
        name: '가계 예산 세우기',
        content: '수입과 지출을 나누어 적고, 남는 돈을 어디에 쓸지 모둠 없이 개인별로 정합니다.',
      },
    ],
    [
      {
        name: '금융 기관은 무엇을 하나요',
        content: '은행·저축의 역할을 알아보고 예금과 적금의 차이를 비교합니다.',
      },
      {
        name: '안전한 금융 습관',
        content: '개인정보를 지키며 금융 정보를 확인하는 방법을 익힙니다.',
      },
    ],
    [
      {
        name: '우리 지역 경제 지도',
        content: '학교 주변에서 돈을 쓰는 장소를 찾고 지역 경제 활동을 정리합니다.',
      },
      {
        name: '나눔과 기부 계획',
        content: '모은 용돈 중 나눌 금액을 정하고 기부 방법을 개인 계획으로 적습니다.',
      },
    ],
  ]

const RECRUIT_NOTES = [
  '학생 명단은 받지 않으며, 사전 안내 사항은 필수로 작성합니다.',
  '합반 신청은 불가하고, 1일 최대 2차시·일정은 최대 2개까지 신청할 수 있습니다.',
  '강사 모집은 학교 모집과 함께 진행하며, 봉사자는 모집하지 않습니다.',
  '편도 100km 이상 출강은 장거리 강사비로 구분합니다.',
] as const

function pick<T>(items: readonly T[], random: () => number): T {
  const index = Math.min(items.length - 1, Math.floor(random() * items.length))
  return items[index]!
}

function pickSchoolTargets(random: () => number): SchoolTarget[] {
  const pool: SchoolTarget[] = ['elementary', 'middle', 'high']
  const count = random() < 0.5 ? 1 : 2
  const shuffled = [...pool].sort(() => random() - 0.5)
  return shuffled.slice(0, count)
}

export function selectEconomyRegistrationAutofillPhrases(
  options?: { year?: number; random?: () => number }
): EconomyAutofillPhraseSelection {
  const random = options?.random ?? Math.random
  const year = options?.year ?? dayjs().year()
  const program = pick(programPhrases(year), random)
  const units = pick(CURRICULUM_PAIRS, random)
  const targets = pickSchoolTargets(random)
  const notes = pick(RECRUIT_NOTES, random)
  const titleKo = program.titleKo

  return {
    program,
    units,
    targetLevels: targets,
    targetLevelDetail: targets.map(level => SCHOOL_TARGET_DETAIL[level]).join(', '),
    recruit: {
      programDescription: `${titleKo}는 기업과 학교가 1년 동안 함께하는 경제·금융 교육입니다. 참여 대상은 학교·기관과 강사이며, 봉사자는 모집하지 않습니다.`,
      recruitmentGuide:
        '학교 모집을 먼저 열고 강사 모집을 함께 진행합니다. 합반 신청은 받지 않으며, 학생 명단은 제출하지 않습니다. 사전 안내 사항 작성은 필수입니다.',
      applicationMethod:
        '온라인 신청서에서 교육 장소와 교육 형태(온라인·오프라인·온/오프라인)를 선택해 제출합니다. 1일 최대 2차시, 신청 가능 일정은 최대 2개입니다.',
      learningSupportContent:
        '교재와 활동지를 제공하고, 수업 전 강사 사전 연수를 진행합니다. 편도 100km 이상 출강은 장거리 강사비로 구분합니다.',
      otherNotes: '우천·학교 행사와 겹치면 일정을 조율할 수 있습니다. 교통비·숙박비는 1사1교 기준으로 정산합니다.',
      additionalContentHtml: `<p>${titleKo} 참여를 희망하는 학교·기관과 강사는 모집 기간 안에 신청해 주세요. 교육 장소와 교육 형태는 신청 시 선택합니다.</p>`,
      notes,
    },
  }
}

export type EconomyAutofillDateRange = { start: string; end: string }

function dayIso(date: Dayjs): string {
  return date.startOf('day').toISOString()
}

/**
 * 1사1교는 1년 단위. 사업·프로그램 기간은 약 1년이고, 모집·면접은 그 안에 둔다.
 */
export function buildEconomyAutofillDatePlan(now: Dayjs = dayjs()): {
  business: EconomyAutofillDateRange
  program: EconomyAutofillDateRange
  recruit: EconomyAutofillDateRange
  interview: EconomyAutofillDateRange
  educationPeriod: EconomyAutofillDateRange
} {
  const start = now.add(14, 'day').startOf('day')
  const end = start.add(1, 'year').subtract(1, 'day')
  const recruitEnd = end.subtract(1, 'month')
  const interviewStart = start.add(3, 'week')
  const interviewEnd = interviewStart.add(2, 'week')
  const educationStart = start.add(1, 'month')
  const educationEnd = end.subtract(2, 'week')
  return {
    business: { start: dayIso(start), end: dayIso(end) },
    program: { start: dayIso(start), end: dayIso(end) },
    recruit: { start: dayIso(start), end: dayIso(recruitEnd) },
    interview: { start: dayIso(interviewStart), end: dayIso(interviewEnd) },
    educationPeriod: { start: dayIso(educationStart), end: dayIso(educationEnd) },
  }
}

export type EconomyAutofillPreferredScheduleBlock = {
  date: string
  session: '1' | '2'
  firstClassPeriod: string
  firstStart: string
  firstEnd: string
  secondClassPeriod: string
  secondStart: string | null
  secondEnd: string | null
}

function weekdayInsideRange(range: EconomyAutofillDateRange, offsetDays: number): string {
  const start = dayjs(range.start).startOf('day')
  const end = dayjs(range.end).startOf('day')
  const lo = start.isAfter(end, 'day') ? end : start
  const hi = start.isAfter(end, 'day') ? start : end
  const span = Math.max(0, hi.diff(lo, 'day'))
  let date = lo.add(Math.min(Math.max(offsetDays, 0), span), 'day')

  while ((date.day() === 0 || date.day() === 6) && date.isBefore(hi, 'day')) {
    date = date.add(1, 'day')
  }
  while ((date.day() === 0 || date.day() === 6) && date.isAfter(lo, 'day')) {
    date = date.subtract(1, 'day')
  }
  return date.format('YYYY-MM-DD')
}

/**
 * 1사1교 신청 폼의 1·2지망을 교육 가능 기간 안에서 만든다.
 * 교육 가능 기간은 사업 운영기간 안에서 생성되므로, 두 희망일도 운영기간을 벗어나지 않는다.
 */
export function buildEconomyAutofillPreferredScheduleBlocks(
  range: EconomyAutofillDateRange
): {
  first: EconomyAutofillPreferredScheduleBlock
  second: EconomyAutofillPreferredScheduleBlock
} {
  return {
    first: {
      date: weekdayInsideRange(range, 0),
      session: '1',
      firstClassPeriod: '1',
      firstStart: '09:00',
      firstEnd: '09:40',
      secondClassPeriod: '',
      secondStart: null,
      secondEnd: null,
    },
    second: {
      date: weekdayInsideRange(range, 7),
      session: '2',
      firstClassPeriod: '2',
      firstStart: '10:00',
      firstEnd: '10:40',
      secondClassPeriod: '3',
      secondStart: '11:00',
      secondEnd: '11:40',
    },
  }
}
