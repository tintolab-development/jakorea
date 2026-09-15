/**
 * 프로그램 진행현황 — 참여 봉사자 목록 Mock
 * 케이스별 1건: 기본 / 재참여 / JA경험無 / 다기관 / 활동포기
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

const SCHOOL_POOL = [
  '틴토초등학교',
  ...MOCK_PARTICIPATING_SCHOOLS.map(s => s.schoolName),
]

const DEMO_ESSAY_INTRO =
  '교육과 봉사활동에 대한 열정을 바탕으로 JA Korea 봉사 프로그램에 지원하게 되었습니다. 어린 시절부터 경제와 금융에 관심이 많았고, 대학에서 경제학을 전공하며 이론적 지식을 쌓았습니다. 특히 초등학생들에게 경제 개념을 쉽고 재미있게 전달하는 것에 큰 보람을 느끼며, 학생들의 눈높이에 맞춘 설명과 소통을 중요하게 생각합니다.'
const DEMO_ESSAY_EDUCATION =
  '대학 재학 중 교육봉사 동아리에서 2년간 활동하며 초등학생 대상 학습 멘토링을 진행했습니다. 또한 사설 학원에서 중학생 대상 수학 과외를 1년간 담당하여 학생 수준에 맞는 맞춤형 교육 방법을 익혔습니다. 강사 아르바이트 경험으로는 영어 학원에서 초등부 보조 강사로 6개월간 근무하며 수업 진행과 학생 관리를 담당했습니다.'
const DEMO_ESSAY_NECESSITY =
  '초등학생 시기는 경제적 개념을 형성하는 중요한 시기입니다. 요즘 아이들은 소비와 저축에 대한 올바른 가치관을 갖추기 어려운 환경에 노출되어 있으며, 체계적인 경제 교육을 통해 합리적인 소비 습관과 미래를 준비하는 자세를 기를 수 있다고 생각합니다. JA Korea의 프로그램은 실생활과 연결된 경제 교육을 제공하여 학생들이 경제를 친근하게 느낄 수 있도록 돕습니다.'

const DEMO_ESSAY_JA =
  '이전에 JA Korea 경제 교육 봉사에 참여하여 초등학생 대상 금융 기초 수업을 진행한 경험이 있습니다. 팀원과 역할을 나누어 준비했고, 학생 피드백을 반영해 활동을 개선했습니다.'

const DEFAULT_SESSIONS = [
  demoSession(1, '2026.01.09', '금', '9:20~11:20'),
  demoSession(2, '2026.01.16', '금', '9:30~11:30'),
]

/** 참여 봉사자 — 케이스별 1건 */
export const MOCK_PARTICIPATING_VOLUNTEERS: ParticipatingVolunteerRow[] = [
  {
    id: 'participating-volunteer-1',
    no: 5,
    volunteerName: '기본봉사자서연',
    id1365: '1365000001',
    assignedInstitutionNames: [SCHOOL_POOL[0]!],
    sessions: DEFAULT_SESSIONS,
    contact: '010-1000-1001',
    email: 'vol.basic@example.com',
    contactRaw: '010-1000-1001',
    emailRaw: 'vol.basic@example.com',
    gender: '여성',
    birthDate: '2001.03.12',
    age: 25,
    hasJaVolunteerExperience: true,
    applicationType: 'new',
    adminComment: '기본 참여 봉사자',
    essayIntro: DEMO_ESSAY_INTRO,
    essayEducationExperience: DEMO_ESSAY_EDUCATION,
    essayNecessity: DEMO_ESSAY_NECESSITY,
    essayJaExperience: DEMO_ESSAY_JA,
  },
  {
    id: 'participating-volunteer-2',
    no: 4,
    volunteerName: '재참여김민토',
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
    gender: '남성',
    birthDate: '1999.05.20',
    age: 27,
    isReturningVolunteer: true,
    hasJaVolunteerExperience: true,
    applicationType: 'new',
    adminComment: '재참여·다기관 배정 데모',
    essayIntro: DEMO_ESSAY_INTRO,
    essayEducationExperience: DEMO_ESSAY_EDUCATION,
    essayNecessity: DEMO_ESSAY_NECESSITY,
    essayJaExperience: DEMO_ESSAY_JA,
  },
  {
    id: 'participating-volunteer-demo-parktinto',
    no: 3,
    volunteerName: '박틴토',
    id1365: '0915123456',
    assignedInstitutionNames: ['틴토초등학교'],
    sessions: DEFAULT_SESSIONS,
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
    adminComment: '상세 시안 데모',
    essayIntro: DEMO_ESSAY_INTRO,
    essayEducationExperience: DEMO_ESSAY_EDUCATION,
    essayNecessity: DEMO_ESSAY_NECESSITY,
    essayJaExperience: DEMO_ESSAY_JA,
  },
  {
    id: 'participating-volunteer-4',
    no: 2,
    volunteerName: 'JA경험없음준호',
    id1365: '1365000004',
    assignedInstitutionNames: ['마포초등학교'],
    sessions: [demoSession(1, '2026.01.16', '금', '9:30~10:20')],
    contact: '010-2000-2004',
    email: 'vol.noja@example.com',
    contactRaw: '010-2000-2004',
    emailRaw: 'vol.noja@example.com',
    gender: '남성',
    birthDate: '2002.08.01',
    age: 24,
    hasJaVolunteerExperience: false,
    applicationType: 'new',
    adminComment: 'JA 봉사 경험 없음',
    essayIntro: DEMO_ESSAY_INTRO,
    essayEducationExperience: DEMO_ESSAY_EDUCATION,
    essayNecessity: DEMO_ESSAY_NECESSITY,
    essayJaExperience: '',
  },
  {
    id: 'participating-volunteer-5',
    no: 1,
    volunteerName: '활동포기하은',
    id1365: '1365000005',
    assignedInstitutionNames: [SCHOOL_POOL[1] ?? '강서초등학교'],
    sessions: DEFAULT_SESSIONS,
    contact: '010-3000-3005',
    email: 'vol.withdraw@example.com',
    contactRaw: '010-3000-3005',
    emailRaw: 'vol.withdraw@example.com',
    gender: '여성',
    birthDate: '2000.11.11',
    age: 25,
    hasJaVolunteerExperience: true,
    applicationType: 'new',
    activityWithdrawn: true,
    activityWithdrawStopSessionKey: '1',
    adminComment: '활동 포기 처리',
    essayIntro: DEMO_ESSAY_INTRO,
    essayEducationExperience: DEMO_ESSAY_EDUCATION,
    essayNecessity: DEMO_ESSAY_NECESSITY,
    essayJaExperience: DEMO_ESSAY_JA,
  },
]
