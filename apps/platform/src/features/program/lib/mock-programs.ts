import { RECRUITMENT_STATUS } from '@jakorea/domain/recruitment/recruitment-status'
import programThumbnail01Url from '../image/illustration/program-thumbnail-01.png'
import programThumbnail02Url from '../image/illustration/program-thumbnail-02.png'
import programThumbnail03Url from '../image/illustration/program-thumbnail-03.png'
import { EDUCATION_FORM_LABEL_MAP } from './badge-config'
import type {
  ProgramAttachment,
  ProgramDetail,
  ProgramExtraSection,
  ProgramListItem,
  ProgramLabeledValue,
  ProgramSession,
} from '../model/types'

/** image 122 / 123 / 124 — 목록·상세 mock 썸네일 후보 */
const MOCK_THUMBNAILS = [
  programThumbnail01Url,
  programThumbnail02Url,
  programThumbnail03Url,
] as const

/** 프로그램별 안정적인 랜덤 썸네일 (목록↔상세 동일 이미지 유지) */
function pickMockThumbnail(programId: string): string {
  let hash = 0
  for (let index = 0; index < programId.length; index += 1) {
    hash = (hash * 31 + programId.charCodeAt(index)) >>> 0
  }
  return MOCK_THUMBNAILS[hash % MOCK_THUMBNAILS.length]
}

const DEFAULT_SESSIONS: ProgramSession[] = [
  {
    sessionLabel: '1차시',
    title: '1단원 나를 알리는 기술',
    description: '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.',
  },
  {
    sessionLabel: '2차시',
    title: '나를 보여주는 기술',
    description: '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.',
  },
]

const DEFAULT_RECRUITMENT_PHASES: ProgramLabeledValue[] = [
  {
    label: '참여자 모집 기간',
    value: '2025년 12월 08일(월) ~ 2026년 01월 16일 (금)',
  },
  {
    label: '1차 합격자 발표일',
    value: '2026년 01월 26일(금)',
  },
  {
    label: '면접 기간',
    value: '2026년 02월 15일 ~ 2026년 02월 16일',
  },
  {
    label: '최종 합격자 발표',
    value: '2026년 03월 23일(금)',
  },
]

const DEFAULT_EDUCATION_SCHEDULES: ProgramLabeledValue[] = [
  {
    label: '교육 일정 1',
    value: '2026년 4월 20일(월) 9:30 ~ 12:20',
  },
  {
    label: '교육 일정 2',
    value: '2026년 4월 27일(월) 13:00 ~ 15:50',
  },
]

const DEFAULT_EXTRA_SECTIONS: ProgramExtraSection[] = [
  {
    title: '모집안내',
    body: `(1) 일정 및 진행시간
- 2024년 4월 20일 (토) 오전 10:00~12:00 / 오후 14:00~16:00
- 2024년 5월 25일 (토) 오전 10:00~12:00 / 오후 14:00~16:00
※ 교육 시작 15분 전 미리 접속하여 준비해 주세요.
※ 가능한 일정은 모두 신청해 주세요. (중복 신청 가능)
※ 세부 커리큘럼은 선정 발표 시 별도 안내됩니다.

(2) 대상
특성화고등학교 3학년

(3) 내용
취업 트렌드 특강, 이력서 첨삭, 모의면접, 현직자 잡멘토링

(4) 방식
온라인 (ZOOM) *접속 링크는 별도 안내

(5) 혜택
전 과정 무료, 참여자 전원 간식 기프티콘 제공`,
  },
  {
    title: '추가 내용',
    body: `당일 참가자 준비물
1. 온라인 교육 참여가 가능한 기기 (모바일, PC 등)
※ 카메라 ON이 가능한 조용한 공간과 안정적인 인터넷 환경을 준비해 주세요.
2. 복장: 교복 착용을 권장합니다.
3. 필기도구

신청
(1) 신청기간: 2024년 3월 25일(월)까지
※ 선착순 마감될 수 있습니다.
(2) 선정발표: 2024년 3월 27일(수) 담당 선생님께 개별 안내
(3) 신청방법: 담당 선생님이 신청서를 작성하여 이메일로 제출`,
  },
  {
    title: '학습 지원 내용',
    body: '학습에 있어서 지원되는 내용입니다.',
  },
  {
    title: '기타사항',
    body: `1. 봉사활동 확인서 발급 (교육부 인증 기관)
2. 1365 봉사시간 등록
3. 추후 JA Korea 기업 프로그램 참여 시 우대`,
  },
  {
    title: '비고',
    body: '비고 내용이 들어갑니다.',
  },
  {
    title: '문의처',
    body: 'JA Korea, Tel : 02-6085-6028, E-mail : cc@jakorea.org',
  },
]

const DEFAULT_ATTACHMENTS: ProgramAttachment[] = [
  {
    name: '[붙임1] 한국씨티은행-JA Korea 특별한 JOB담 모집 안내문.pdf',
    url: '#',
  },
  {
    name: '[붙임2] 한국씨티은행-JA Korea 특별한 JOB담 신청서.hwp',
    url: '#',
  },
]

const DETAIL_DEFAULTS = {
  recruitmentPhaseGroupLabel: '모집 및 선별 기간',
  recruitmentPhases: DEFAULT_RECRUITMENT_PHASES,
  educationSchedules: DEFAULT_EDUCATION_SCHEDULES,
  extraSections: DEFAULT_EXTRA_SECTIONS,
  applicationMethodLabel: '지원방법',
  applicationMethodValue: '해당 페이지의 [신청버튼] 클릭 후 항목 상세 기재 후 제출',
  attachments: DEFAULT_ATTACHMENTS,
} as const

/** 모집 현황 상태별 2건 — domain: scheduled | recruiting | closed (모집 예정 / 모집 중 / 모집 마감) */
const MOCK_PROGRAMS: ProgramDetail[] = [
  // ── 모집 예정 (scheduled) × 2 ──
  {
    id: 'youth-itc-scheduled',
    category: 'youth',
    categoryLabel: '청소년 · 청년',
    title: '2026 FedEx-JA 국제무역창업대회 (모집 예정)',
    operatingPeriodLabel: '2026.05.01(금) – 2026.11.30(월)',
    operatingPeriodStart: '2026-05-01',
    operatingPeriodEnd: '2026-11-30',
    recruitmentPeriodLabel: '2026.09.01 – 09.30',
    applicationPeriodLabel: '2026.09.01 – 09.30',
    recruitmentStatus: RECRUITMENT_STATUS.scheduled,
    educationTargetLabel: '고등학생',
    educationForm: 'online',
    educationFormLabel: EDUCATION_FORM_LABEL_MAP.online,
    thumbnailUrl: pickMockThumbnail('youth-itc-scheduled'),
    sponsor: 'FedEx',
    summary: '국제무역·창업 역량을 키우는 고등학생 대상 대회입니다. 모집 시작 예정입니다.',
    isRecruiting: false,
    businessFieldLabel: '진로취업',
    educationTargetGroupLabel: '고등학교',
    educationTargetDetailLabel: '고등학교 1~3학년',
    educationVenueLabel: '온라인',
    ...DETAIL_DEFAULTS,
    sessions: DEFAULT_SESSIONS,
  },
  {
    id: 'instructor-expert-scheduled',
    category: 'instructor',
    categoryLabel: '강사',
    title: '2026 JA Korea 경제금융교육 전문강사단 모집 (모집 예정)',
    operatingPeriodLabel: '2026.09.01(화) – 2027.02.28(일)',
    operatingPeriodStart: '2026-09-01',
    operatingPeriodEnd: '2027-02-28',
    recruitmentPeriodLabel: '2026.08.01 – 08.31',
    applicationPeriodLabel: '2026.08.01 – 08.31',
    recruitmentStatus: RECRUITMENT_STATUS.scheduled,
    educationTargetLabel: '성인',
    educationForm: 'hybrid',
    educationFormLabel: EDUCATION_FORM_LABEL_MAP.hybrid,
    thumbnailUrl: pickMockThumbnail('instructor-expert-scheduled'),
    sponsor: 'JA Korea',
    summary: '경제·금융 교육 전문 강사 모집 예정입니다. 모집 기간 전 미리보기로 공개됩니다.',
    isRecruiting: false,
    businessFieldLabel: '강사모집',
    educationTargetGroupLabel: '성인',
    educationTargetDetailLabel: '교육 진행 가능 성인',
    educationVenueLabel: '전국',
    ...DETAIL_DEFAULTS,
    sessions: DEFAULT_SESSIONS,
  },

  // ── 모집 중 (recruiting) × 2 ──
  {
    id: 'job-talk-recruiting',
    category: 'youth',
    categoryLabel: '청소년 · 청년',
    title: '2026 한국씨티은행 - JA Korea 특별한 JOB담 모집 안내',
    operatingPeriodLabel: '2026.04.03(금) – 2026.11.20(금)',
    operatingPeriodStart: '2026-04-03',
    operatingPeriodEnd: '2026-11-20',
    recruitmentPeriodLabel: '2026.04.18 – 04.26',
    applicationPeriodLabel: '2026.04.18 – 04.26',
    recruitmentStatus: RECRUITMENT_STATUS.recruiting,
    educationTargetLabel: '고등학생',
    educationForm: 'online',
    educationFormLabel: EDUCATION_FORM_LABEL_MAP.online,
    thumbnailUrl: pickMockThumbnail('job-talk-recruiting'),
    sponsor: '한국씨티은행',
    summary:
      '진로 멘토링 프로그램으로, 현직자와의 만남을 통해 진로 탐색과 자기 이해를 돕습니다.',
    isRecruiting: true,
    businessFieldLabel: '진로취업',
    educationTargetGroupLabel: '고등학교',
    educationTargetDetailLabel: '특성화고등학교 3학년',
    educationVenueLabel: '기관 안, 서울시 강서구 가양 데시앙플렉스',
    ...DETAIL_DEFAULTS,
    sessions: DEFAULT_SESSIONS,
  },
  {
    id: 'school-partnership-recruiting',
    category: 'institution',
    categoryLabel: '기관',
    title: '2026 JA Korea 학교 파트너십 프로그램',
    operatingPeriodLabel: '2026.03.01(일) – 2026.12.31(목)',
    operatingPeriodStart: '2026-03-01',
    operatingPeriodEnd: '2026-12-31',
    recruitmentPeriodLabel: '2026.02.01 – 03.31',
    applicationPeriodLabel: '2026.02.01 – 03.31',
    recruitmentStatus: RECRUITMENT_STATUS.recruiting,
    educationTargetLabel: '초등학생',
    educationForm: 'hybrid',
    educationFormLabel: EDUCATION_FORM_LABEL_MAP.hybrid,
    thumbnailUrl: pickMockThumbnail('school-partnership-recruiting'),
    sponsor: 'JA Korea',
    summary: '학교 단위로 참여하는 경제·진로 교육 프로그램입니다.',
    isRecruiting: true,
    businessFieldLabel: '경제금융',
    educationTargetGroupLabel: '초등학교',
    educationTargetDetailLabel: '초등학교 4~6학년',
    educationVenueLabel: '학교 교실',
    ...DETAIL_DEFAULTS,
    sessions: DEFAULT_SESSIONS,
  },

  // ── 모집 마감 (closed) × 2 ──
  {
    id: 'youth-finance-closed',
    category: 'youth',
    categoryLabel: '청소년 · 청년',
    title: '2025 JA Korea 청소년 금융 문해력 캠프',
    operatingPeriodLabel: '2025.07.01(화) – 2025.08.31(일)',
    operatingPeriodStart: '2025-07-01',
    operatingPeriodEnd: '2025-08-31',
    recruitmentPeriodLabel: '2025.05.01 – 06.15',
    applicationPeriodLabel: '2025.05.01 – 06.15',
    recruitmentStatus: RECRUITMENT_STATUS.closed,
    educationTargetLabel: '중학생',
    educationForm: 'offline',
    educationFormLabel: EDUCATION_FORM_LABEL_MAP.offline,
    thumbnailUrl: pickMockThumbnail('youth-finance-closed'),
    sponsor: 'JA Korea',
    summary: '중학생을 대상으로 한 금융 문해력 캠프입니다. 모집이 마감되었습니다.',
    isRecruiting: false,
    businessFieldLabel: '경제금융',
    educationTargetGroupLabel: '중학교',
    educationTargetDetailLabel: '중학교 1~3학년',
    educationVenueLabel: '캠프장',
    ...DETAIL_DEFAULTS,
    sessions: DEFAULT_SESSIONS,
  },
  {
    id: 'institution-economy-closed',
    category: 'institution',
    categoryLabel: '기관',
    title: '2025 학교 경제교육 파트너십',
    operatingPeriodLabel: '2025.03.01(토) – 2025.11.30(일)',
    operatingPeriodStart: '2025-03-01',
    operatingPeriodEnd: '2025-11-30',
    recruitmentPeriodLabel: '2025.01.15 – 02.28',
    applicationPeriodLabel: '2025.01.15 – 02.28',
    recruitmentStatus: RECRUITMENT_STATUS.closed,
    educationTargetLabel: '초등학생',
    educationForm: 'hybrid',
    educationFormLabel: EDUCATION_FORM_LABEL_MAP.hybrid,
    thumbnailUrl: pickMockThumbnail('institution-economy-closed'),
    sponsor: 'JA Korea',
    summary: '학교 단위 경제교육 파트너십 프로그램입니다. 모집이 마감되었습니다.',
    isRecruiting: false,
    businessFieldLabel: '경제금융',
    educationTargetGroupLabel: '초등학교',
    educationTargetDetailLabel: '초등학교 전학년',
    educationVenueLabel: '학교 교실',
    ...DETAIL_DEFAULTS,
    sessions: DEFAULT_SESSIONS,
  },
]

export function getMockPrograms(): ProgramListItem[] {
  return MOCK_PROGRAMS
}

export function getMockProgramById(id: string): ProgramDetail | undefined {
  return MOCK_PROGRAMS.find(program => program.id === id)
}

/** 프로그램 운영 기간이 선택한 연도(YYYY)와 겹치면 true */
export function programOverlapsOperatingYear(
  program: Pick<ProgramListItem, 'operatingPeriodStart' | 'operatingPeriodEnd'>,
  year: string
) {
  const selectedYear = Number.parseInt(year, 10)
  if (!Number.isFinite(selectedYear)) {
    return true
  }

  const startYear = Number.parseInt(program.operatingPeriodStart.slice(0, 4), 10)
  const endYear = Number.parseInt(program.operatingPeriodEnd.slice(0, 4), 10)
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    return false
  }

  return startYear <= selectedYear && endYear >= selectedYear
}
