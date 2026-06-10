/**
 * 프로그램 진행현황 — 참여 봉사자 목록 Mock
 */

import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import { MOCK_PARTICIPATING_SCHOOLS } from '@/data/mock/participating-schools'

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
        isReturningVolunteer: true,
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
