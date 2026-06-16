/**
 * 프로그램 진행현황 — 참여 봉사자 목록 Mock
 */

import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import { MOCK_PARTICIPATING_SCHOOLS } from '@/data/mock/participating-schools'
import type { GeneralVolunteerApplicationType } from '@/features/program/general/lib/volunteer-screening-constants'

export interface ParticipatingVolunteerRow {
  id: string
  no: number
  volunteerName: string
  id1365: string
  assignedInstitutionNames: string[]
  sessions: ParticipatingSchoolSession[]
  contact: string
  email: string
  /** 일반 봉사자 중 재참여 여부 — 교육 실적 재참여 합산용 */
  isReturningVolunteer?: boolean
  /** 상세 — 신청 정보 탭 */
  contactRaw?: string
  emailRaw?: string
  gender?: string
  birthDate?: string
  age?: number
  scheduleChangeCancelCount?: number
  hasJaVolunteerExperience?: boolean
  applicationType?: GeneralVolunteerApplicationType
  adminComment?: string
  activityWithdrawn?: boolean
  activityWithdrawStopSessionKey?: string
  performanceExcludedSessionKeys?: string[]
  essayIntro?: string
  essayEducationExperience?: string
  essayNecessity?: string
  essayJaExperience?: string
}

function demoSession(
  round: number,
  date: string,
  dayOfWeek: string,
  timeRange: string
): ParticipatingSchoolSession {
  return {
    round,
    date,
    dayOfWeek,
    duration: '2시간',
    format: '오프라인',
    classNum: `${round}교시`,
    timeRange,
    status: 'pending',
  }
}

const VOLUNTEER_NAMES = [
  '서강라',
  '김재연',
  '이서준',
  '박민서',
  '최하은',
  '정도윤',
  '한지우',
  '윤서연',
  '오준호',
  '문채원',
  '장유진',
  '임태양',
  '강수빈',
  '조예린',
  '신동현',
  '홍서윤',
  '권민재',
  '송지아',
  '배현우',
  '류하린',
  '남지훈',
  '석다은',
  '진우진',
  '허서현',
  '노예준',
  '곽소율',
  '차민규',
  '표지원',
  '설하윤',
  '탁준서',
] as const

const SCHOOL_POOL = [
  '틴토초등학교',
  ...MOCK_PARTICIPATING_SCHOOLS.map(s => s.schoolName),
]

function hashSeed(index: number): number {
  const h = index * 17 + 31
  return ((h % 997) + 997) % 997
}

const DEMO_ESSAY_INTRO =
  '교육과 봉사활동에 대한 열정을 바탕으로 JA Korea 봉사 프로그램에 지원하게 되었습니다. 어린 시절부터 경제와 금융에 관심이 많았고, 대학에서 경제학을 전공하며 이론적 지식을 쌓았습니다. 특히 초등학생들에게 경제 개념을 쉽고 재미있게 전달하는 것에 큰 보람을 느끼며, 학생들의 눈높이에 맞춘 설명과 소통을 중요하게 생각합니다.'
const DEMO_ESSAY_EDUCATION =
  '대학 재학 중 교육봉사 동아리에서 2년간 활동하며 초등학생 대상 학습 멘토링을 진행했습니다. 또한 사설 학원에서 중학생 대상 수학 과외를 1년간 담당하여 학생 수준에 맞는 맞춤형 교육 방법을 익혔습니다. 강사 아르바이트 경험으로는 영어 학원에서 초등부 보조 강사로 6개월간 근무하며 수업 진행과 학생 관리를 담당했습니다.'
const DEMO_ESSAY_NECESSITY =
  '초등학생 시기는 경제적 개념을 형성하는 중요한 시기입니다. 요즘 아이들은 소비와 저축에 대한 올바른 가치관을 갖추기 어려운 환경에 노출되어 있으며, 체계적인 경제 교육을 통해 합리적인 소비 습관과 미래를 준비하는 자세를 기를 수 있다고 생각합니다. JA Korea의 프로그램은 실생활과 연결된 경제 교육을 제공하여 학생들이 경제를 친근하게 느낄 수 있도록 돕습니다.'

function buildVolunteerRow(index: number): ParticipatingVolunteerRow {
  const no = index + 1
  const seed = hashSeed(index)
  const volunteerName = VOLUNTEER_NAMES[index % VOLUNTEER_NAMES.length]
  const schoolCount = 1 + (seed % 3)
  const assignedInstitutionNames = Array.from({ length: schoolCount }, (_, i) => {
    return SCHOOL_POOL[(seed + i * 7) % SCHOOL_POOL.length]
  })
  const sessionCount = 1 + (seed % 4)
  const sessions = Array.from({ length: sessionCount }, (_, i) => {
    const round = i + 1
    const month = 1 + ((seed + i) % 3)
    const day = 5 + ((seed + i * 3) % 20)
    const weekdays = ['월', '화', '수', '목', '금'] as const
    const dayOfWeek = weekdays[(seed + i) % weekdays.length]
    const hour = 9 + (i % 2)
    const start = `${hour}:${i % 2 === 0 ? '20' : '30'}`
    const end = `${hour + 2}:${i % 2 === 0 ? '20' : '10'}`
    return demoSession(
      round,
      `2026.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`,
      dayOfWeek,
      `${start}~${end}`
    )
  })

  const phoneMid = String(1000 + (seed % 9000)).padStart(4, '0')
  const phoneLast = String(1000 + ((seed * 3) % 9000)).padStart(4, '0')

  return {
    id: `participating-volunteer-${no}`,
    no,
    volunteerName,
    id1365: String(136500000 + seed * 137),
    assignedInstitutionNames,
    sessions,
    contact: `010-${phoneMid}-${phoneLast}`,
    email: `volunteer${no}@example.com`,
    contactRaw: `010-${phoneMid}-${phoneLast}`,
    emailRaw: `volunteer${no}@example.com`,
    gender: seed % 2 === 0 ? '여성' : '남성',
    birthDate: `200${seed % 5}.${String(1 + (seed % 12)).padStart(2, '0')}.${String(
      1 + (seed % 28)
    ).padStart(2, '0')}`,
    age: 22 + (seed % 7),
    scheduleChangeCancelCount: seed % 7 === 0 ? 1 : 0,
    hasJaVolunteerExperience: seed % 3 !== 0,
    applicationType: 'new',
    essayIntro: DEMO_ESSAY_INTRO,
    essayEducationExperience: DEMO_ESSAY_EDUCATION,
    essayNecessity: DEMO_ESSAY_NECESSITY,
    essayJaExperience: '',
  }
}

/** 스크린샷 데모 — 30건 */
export const MOCK_PARTICIPATING_VOLUNTEERS: ParticipatingVolunteerRow[] = Array.from(
  { length: 30 },
  (_, index) => {
    const row = buildVolunteerRow(index)
    if (index === 2) {
      return {
        ...row,
        volunteerName: '김민토',
        id1365: '1365123456',
        assignedInstitutionNames: ['틴토초등학교', '강서초등학교', '마포초등학교'],
        sessions: [
          demoSession(1, '2026.01.09', '금', '9:20~11:20'),
          demoSession(2, '2026.01.16', '금', '9:30~11:30'),
          demoSession(3, '2026.02.06', '금', '10:00~12:00'),
        ],
        contact: '010-1234-5678',
        email: 'mint***@example.com',
        contactRaw: '010-1234-5678',
        emailRaw: 'mint@example.com',
        isReturningVolunteer: true,
      }
    }
    if (index === 3) {
      return {
        ...row,
        id: 'participating-volunteer-demo-parktinto',
        volunteerName: '박틴토',
        id1365: '0915123456',
        assignedInstitutionNames: ['틴토초등학교'],
        sessions: [
          demoSession(1, '2026.01.09', '금', '9:20~11:20'),
          demoSession(2, '2026.01.16', '금', '9:30~11:30'),
        ],
        contact: '010-****-0000',
        email: 'haksa***@naver.com',
        contactRaw: '010-1234-0000',
        emailRaw: 'haksa@naver.com',
        gender: '여성',
        birthDate: '2015.09.15',
        age: 10,
        scheduleChangeCancelCount: 1,
        hasJaVolunteerExperience: true,
        applicationType: 'new',
        essayIntro: DEMO_ESSAY_INTRO,
        essayEducationExperience: DEMO_ESSAY_EDUCATION,
        essayNecessity: DEMO_ESSAY_NECESSITY,
      }
    }
    if (index === 5) {
      return {
        ...row,
        isReturningVolunteer: true,
        assignedInstitutionNames: ['마포초등학교'],
        sessions: [demoSession(1, '2026.01.16', '금', '9:30~10:20')],
      }
    }
    return row
  }
)
