/**
 * 걸어온 길과 성과 — 로컬 퍼블리싱 데이터.
 * API 연동 전까지 feature lib에서 mock으로 제공.
 */

export type AchievementTabKey = 'history' | 'award' | 'certification'

export type HistoryMonthGroup = {
  month: string
  items: readonly string[]
}

export type HistoryYearData = {
  year: number
  months: readonly HistoryMonthGroup[]
}

export type HistoryPeriod = {
  id: string
  label: string
  years: readonly number[]
}

export type AchievementRecordItem = {
  id: string
  /** 표시용 날짜 (예: 2025년 12월) */
  dateLabel: string
  title: string
  organization: string
}

export const ACHIEVEMENT_SECTION_TITLE = '걸어온 길과 성과'

export const ACHIEVEMENT_TAB_ITEMS: readonly { key: AchievementTabKey; label: string }[] = [
  { key: 'history', label: '연혁' },
  { key: 'award', label: '수상' },
  { key: 'certification', label: '인증' },
] as const

export const ACHIEVEMENT_RECORDS_PAGE_SIZE = 10

export const ACHIEVEMENT_SEARCH_PLACEHOLDER = '제목, 내용으로 검색해 보세요'

/** 시안 기본 선택: 2016 ~ 2020 / 2020 */
export const DEFAULT_HISTORY_PERIOD_ID = '2016-2020'
export const DEFAULT_HISTORY_YEAR = 2020

export const HISTORY_PERIODS: readonly HistoryPeriod[] = [
  { id: '2026-now', label: '2026 ~ Now', years: [2026] },
  { id: '2021-2025', label: '2021 ~ 2025', years: [2025, 2024, 2023, 2022, 2021] },
  { id: '2016-2020', label: '2016 ~ 2020', years: [2020, 2019, 2018, 2017, 2016] },
  { id: '2011-2015', label: '2011 ~ 2015', years: [2015, 2014, 2013, 2012, 2011] },
  { id: '2002-2010', label: '2002 ~ 2010', years: [2010, 2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002] },
] as const

const HISTORY_2020: HistoryYearData = {
  year: 2020,
  months: [
    {
      month: '12',
      items: [
        "삼성전자와 함께하는 'Care Beyond Skin' 온라인 교육",
        "삼성전자와 함께하는 'We Tech Care' 온라인 교육",
        '삼성SDS Brightics AI 교육 실시',
      ],
    },
    {
      month: '11',
      items: [
        'JA TTBiz Kick-off',
        'JA Korea 온라인 기업가정신 캠프 운영',
      ],
    },
    {
      month: '10',
      items: [
        'JA Company Program 온라인 전환 운영',
        '금융감독원과 함께하는 금융교육 프로그램',
        '청소년 기업가정신 온라인 페스티벌',
      ],
    },
    {
      month: '09',
      items: [
        'JA Job Shadow 비대면 멘토링',
        '학교 연계 온라인 경제교육 확대',
      ],
    },
    {
      month: '08',
      items: [
        '여름방학 JA Camp 온라인 개최',
        '교사 연수 프로그램 진행',
      ],
    },
    {
      month: '07',
      items: [
        'JA Personal Finance 온라인 클래스',
        '기업 파트너십 온라인 세미나',
      ],
    },
    {
      month: '06',
      items: [
        '상반기 JA Achievement 시상식',
        '지역 지부 온라인 네트워킹',
      ],
    },
    {
      month: '05',
      items: [
        'JA Economics for Success 온라인 수업',
        '청소년 리더십 워크숍',
      ],
    },
    {
      month: '04',
      items: [
        '신학기 학교 프로그램 온라인 지원',
        'JA Volunteer 온보딩',
      ],
    },
    {
      month: '03',
      items: [
        'JA Korea 연간 계획 공유회',
        '파트너 기업 킥오프 미팅',
      ],
    },
    {
      month: '02',
      items: [
        '교사 대상 기업가정신 연수',
        '신규 프로그램 파일럿 운영',
      ],
    },
    {
      month: '01',
      items: [
        '2020 JA Korea 신년 비전 공유',
        '글로벌 JA 네트워크 연계 회의',
      ],
    },
  ],
}

function createSimpleYearData(year: number, highlight: string): HistoryYearData {
  return {
    year,
    months: [
      {
        month: '12',
        items: [`${year}년 ${highlight}`, `${year} JA Korea 연말 성과 공유`],
      },
      {
        month: '06',
        items: [`${year}년 상반기 주요 프로그램 운영`],
      },
      {
        month: '01',
        items: [`${year} JA Korea 신년 계획 발표`],
      },
    ],
  }
}

export const HISTORY_BY_YEAR: Readonly<Record<number, HistoryYearData>> = {
  2026: createSimpleYearData(2026, '신규 비전 프로젝트 론칭'),
  2025: createSimpleYearData(2025, '전국 청소년 기업가정신 페스티벌'),
  2024: createSimpleYearData(2024, 'JA Asia Pacific 교류 프로그램'),
  2023: createSimpleYearData(2023, '디지털 금융교육 확대'),
  2022: createSimpleYearData(2022, '대면·비대면 하이브리드 교육 정착'),
  2021: createSimpleYearData(2021, '온라인 교육 플랫폼 고도화'),
  2020: HISTORY_2020,
  2019: createSimpleYearData(2019, 'JA Company Program 전국 확대'),
  2018: createSimpleYearData(2018, '기업 파트너십 다각화'),
  2017: createSimpleYearData(2017, '교사 연수 체계 강화'),
  2016: createSimpleYearData(2016, '지역 거점 교육 확대'),
  2015: createSimpleYearData(2015, '청소년 경제교육 캠페인'),
  2014: createSimpleYearData(2014, 'JA Job Shadow 확대'),
  2013: createSimpleYearData(2013, '학교 연계 프로그램 고도화'),
  2012: createSimpleYearData(2012, '자원봉사자 네트워크 강화'),
  2011: createSimpleYearData(2011, '신규 교육 콘텐츠 개발'),
  2010: createSimpleYearData(2010, '전국 지부 협력 강화'),
  2009: createSimpleYearData(2009, '청소년 리더십 캠프'),
  2008: createSimpleYearData(2008, '기업가정신 교육 확산'),
  2007: createSimpleYearData(2007, '파트너십 프로그램 확대'),
  2006: createSimpleYearData(2006, '학교 경제교육 지원'),
  2005: createSimpleYearData(2005, '지역 사회 연계 활동'),
  2004: createSimpleYearData(2004, '교육 커리큘럼 정비'),
  2003: createSimpleYearData(2003, '자원봉사자 양성'),
  2002: createSimpleYearData(2002, 'JA Korea 주요 활동 정착'),
}

const AWARD_SEED: readonly Omit<AchievementRecordItem, 'id'>[] = [
  {
    dateLabel: '2025년 12월',
    title: 'JA Worldwide Nominated for the 2023 Nobel Peace Prize',
    organization: '노벨위원회',
  },
  {
    dateLabel: '2025년 11월',
    title: '경제교육 우수기관 표창',
    organization: '기획재정부, 경제교육단체협의회',
  },
  {
    dateLabel: '2025년 10월',
    title: '청소년 기업가정신 교육 공로상',
    organization: '교육부',
  },
  {
    dateLabel: '2025년 09월',
    title: '사회공헌 우수 파트너 선정',
    organization: '국민대학교',
  },
  {
    dateLabel: '2025년 08월',
    title: '금융교육 우수 프로그램상',
    organization: '금융감독원',
  },
  {
    dateLabel: '2025년 07월',
    title: '글로벌 네트워크 기여 표창',
    organization: 'JA Worldwide',
  },
  {
    dateLabel: '2025년 06월',
    title: '청소년 역량 강화 유공 표창',
    organization: '여성가족부',
  },
  {
    dateLabel: '2025년 05월',
    title: 'CSR 교육 파트너십 우수상',
    organization: '대한상공회의소',
  },
  {
    dateLabel: '2025년 04월',
    title: '디지털 교육 혁신상',
    organization: '과학기술정보통신부',
  },
  {
    dateLabel: '2025년 03월',
    title: '지역 상생 교육 공로상',
    organization: '서울특별시',
  },
]

function buildAwardData(count: number): AchievementRecordItem[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = AWARD_SEED[index % AWARD_SEED.length]!
    const yearOffset = Math.floor(index / AWARD_SEED.length)
    return {
      id: `award-${index + 1}`,
      dateLabel: yearOffset === 0 ? seed.dateLabel : `${2025 - yearOffset}년 ${(index % 12) + 1}월`,
      title: yearOffset === 0 ? seed.title : `${seed.title} (${2025 - yearOffset})`,
      organization: seed.organization,
    }
  })
}

/** 시안: 총 86건 */
export const AWARD_DATA: readonly AchievementRecordItem[] = buildAwardData(86)

export const CERTIFICATION_DATA: readonly AchievementRecordItem[] = [
  {
    id: 'cert-1',
    dateLabel: '2025년 12월',
    title: '교육기부기관 지정 (인증번호 제2011-062호)',
    organization: '교육부',
  },
  {
    id: 'cert-2',
    dateLabel: '2025년 12월',
    title: 'JA Worldwide Members in Good Standing',
    organization: 'JA Worldwide',
  },
  {
    id: 'cert-3',
    dateLabel: '2025년 12월',
    title: '교육기부기관 지정 (인증번호 제2011-062호)',
    organization: '교육부',
  },
  {
    id: 'cert-4',
    dateLabel: '2025년 12월',
    title: 'OECD산하 금융교육국제네트워크(INFE)의 Affiliate member',
    organization: 'OECD International Network on Financial Education',
  },
]

export function getHistoryYearData(year: number): HistoryYearData | null {
  return HISTORY_BY_YEAR[year] ?? null
}

export function filterAchievementRecords(
  items: readonly AchievementRecordItem[],
  query: string,
): AchievementRecordItem[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return [...items]
  return items.filter(item => {
    const haystack = `${item.title} ${item.organization} ${item.dateLabel}`.toLowerCase()
    return haystack.includes(normalized)
  })
}
