/**
 * UJAT 봉사자 mock — 단일 프로필 카탈로그
 * 교육 진행 참여 봉사자 목록·상세, 상·하반기 봉사자 신청 목록·상세가 동일 데이터를 참조한다.
 */

import type {
  UjatDocumentScreeningStatus,
  UjatInterviewAssignmentStatus,
  UjatManagerEvaluation,
  UjatSecondInterviewScreeningStatus,
  UjatVolunteerApplicationType,
  UjatVolunteerGrade,
  UjatVolunteerPreferredRegion,
  UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { UJAT_INSTITUTION_APPLICATION_REGIONS } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type {
  UjatEducationProgressVolunteerAssignmentStatus,
  UjatEducationProgressVolunteerGrade,
} from '@/features/program/ujat/ui/detail-modal/progress/volunteers/types'

export type UjatVolunteerMockInterviewAvailabilityDay = {
  dateLabel: string
  slots: string[]
}

export type UjatVolunteerMockProfileId =
  | 'kim-minto'
  | 'lee-minto'
  | 'park-tinto'
  | 'park-seoyeon'
  | 'choi-junho'
  | 'jung-haeun'
  | 'han-jiwoo'

export type UjatVolunteerMockPreviousUjatActivity = {
  term: string
  year: string
  certificateFileName: string
  certificateFileUrl?: string
}

export type UjatVolunteerMockProfile = {
  id: UjatVolunteerMockProfileId
  name: string
  englishName: string
  grade: UjatVolunteerGrade & UjatEducationProgressVolunteerGrade
  regionKey: UjatInstitutionApplicationRegionKey
  mobile: string
  email: string
  id1365: string
  gender: string
  birthDate: string
  age: number
  universityName: string
  major: string
  applicationRoute: string
  applicationRouteOther?: string
  hasEducationExperience: boolean
  applicationType: UjatVolunteerApplicationType
  essayIntro: string
  essayEducationExperience: string
  essayNecessity: string
  essayJaExperience: string
  scheduleChangeCancelCount: number
  adminComment: string
  assignmentStatus: UjatEducationProgressVolunteerAssignmentStatus
  totalAssignmentDays: number | null
  documentScreeningStatus: UjatDocumentScreeningStatus
  managerAEvaluation: UjatManagerEvaluation
  managerBEvaluation: UjatManagerEvaluation
  interviewAssignmentStatus: UjatInterviewAssignmentStatus
  interviewAvailability: UjatVolunteerMockInterviewAvailabilityDay[]
  secondInterviewScreeningStatus?: UjatSecondInterviewScreeningStatus
  assignedInterviewDateLabel?: string
  assignedInterviewTime?: string
  totalScore?: number | null
  interviewEvaluationRemark?: string
  /** UJAT 수료자 봉사자 — 이전 활동 기수·수료증 */
  previousUjatActivity?: UjatVolunteerMockPreviousUjatActivity
}

const PARK_TINTO_INTERVIEW_AVAILABILITY: UjatVolunteerMockInterviewAvailabilityDay[] = [
  { dateLabel: '26. 03. 30(목)', slots: ['19:30 ~ 20:00'] },
  {
    dateLabel: '26. 03. 23(월)',
    slots: ['09:00 ~ 09:30', '14:00 ~ 14:30', '15:00 ~ 15:30'],
  },
]

/** 교육 진행 목록·신청 심사·상세 공통 프로필 (7명) */
export const UJAT_VOLUNTEER_MOCK_PROFILES: readonly UjatVolunteerMockProfile[] = [
  {
    id: 'kim-minto',
    name: '김민토',
    englishName: 'Kim Minto',
    grade: '1학년',
    regionKey: 'seoul',
    mobile: '010-2847-4829',
    email: 'mint.kim@naver.com',
    id1365: 'kim_minto4829',
    gender: '여성',
    birthDate: '2001.03.12',
    age: 24,
    universityName: '**대학교',
    major: '경제학과 전공',
    applicationRoute: '인스타그램',
    hasEducationExperience: true,
    applicationType: 'new',
    essayIntro:
      '경제·금융에 관심을 키우며 JA Korea 봉사에 지원했습니다. 학생들과의 소통을 통해 경제 개념을 쉽게 전달하고 싶습니다.',
    essayEducationExperience:
      '고등학교 때 또래 멘토링 1년, 대학교 시절 학습도우미 6개월 경험이 있습니다.',
    essayNecessity:
      '초등학생에게 경제 교육은 미래 소비·저축 습관 형성에 중요하다고 생각합니다.',
    essayJaExperience:
      '고등학교 때 JA 경제금융 기초 강의를 수강한 경험이 있습니다.',
    scheduleChangeCancelCount: 0,
    adminComment: '',
    assignmentStatus: 'assignment_waiting',
    totalAssignmentDays: null,
    documentScreeningStatus: 'pass',
    managerAEvaluation: 'pass',
    managerBEvaluation: 'neutral',
    interviewAssignmentStatus: 'waiting',
    interviewAvailability: [
      { dateLabel: '26. 03. 16(월)', slots: ['09:00 ~ 09:30', '14:00 ~ 14:30'] },
    ],
  },
  {
    id: 'lee-minto',
    name: '이민토',
    englishName: 'Lee Minto',
    grade: '3학년',
    regionKey: 'seoul',
    mobile: '010-3912-6641',
    email: 'mint.lee@kakao.com',
    id1365: 'lee_minto6641',
    gender: '남성',
    birthDate: '2000.07.22',
    age: 25,
    universityName: '**대학교',
    major: '경영학과 전공, 데이터사이언스 부전공',
    applicationRoute: '학교 안내 및 에브리타임',
    hasEducationExperience: false,
    applicationType: 'new',
    essayIntro:
      'JA Korea의 교육 철학에 공감하여 지원했습니다. 체계적인 수업 준비로 학생들에게 도움이 되고 싶습니다.',
    essayEducationExperience: '공식적인 교육 진행 경험은 없으나, 동아리 내 스터디 리더 경험이 있습니다.',
    essayNecessity:
      '경제 교육은 청소년기에 형성되는 가치관에 큰 영향을 준다고 믿습니다.',
    essayJaExperience: '직접적인 JA 프로그램 수료 경험은 없습니다.',
    scheduleChangeCancelCount: 0,
    adminComment: '',
    assignmentStatus: 'assignment_waiting',
    totalAssignmentDays: null,
    documentScreeningStatus: 'pass',
    managerAEvaluation: 'neutral',
    managerBEvaluation: 'unreviewed',
    interviewAssignmentStatus: 'waiting',
    interviewAvailability: [
      { dateLabel: '26. 03. 17(화)', slots: ['15:00 ~ 15:30'] },
    ],
  },
  {
    id: 'park-tinto',
    name: '박틴토',
    englishName: 'Park Tinto',
    grade: '1학년',
    regionKey: 'seoul',
    mobile: '010-1234-0000',
    email: 'tjintolab@naver.com',
    id1365: 'park_tt915',
    gender: '남성',
    birthDate: '2000.09.15',
    age: 25,
    universityName: '**대학교',
    major: '회계학과 전공, 경영학과 복수전공',
    applicationRoute: '인스타그램',
    hasEducationExperience: true,
    applicationType: 'new',
    essayIntro:
      '안녕하세요. 경제·금융에 관심이 많은 대학생 박틴토입니다. JA Korea의 초등 경제교육 봉사에 지원하게 되었습니다. 학생들과 소통하며 경제 개념을 쉽게 전달하는 역량을 키우고 싶습니다.',
    essayEducationExperience:
      '초등학생 대상 과외 6개월, 중학생 수학 보조 강사 3개월 경험이 있습니다. 수업 준비와 피드백에 익숙합니다.',
    essayNecessity:
      '초등학생 시기에 형성되는 경제 사고력은 평생에 걸쳐 영향을 미칩니다. JA Korea 프로그램은 체험 중심 교육으로 학생들의 참여를 높일 수 있다고 생각합니다.',
    essayJaExperience:
      '중학교 2학년 때 JA Korea 경제금융교육을 수강했으며, 당시 배운 내용이 대학 전공 선택에도 영향을 주었습니다.',
    scheduleChangeCancelCount: 1,
    adminComment: '',
    assignmentStatus: 'assignment_completed',
    totalAssignmentDays: 4,
    documentScreeningStatus: 'pass',
    managerAEvaluation: 'unreviewed',
    managerBEvaluation: 'pass',
    interviewAssignmentStatus: 'assigned',
    interviewAvailability: PARK_TINTO_INTERVIEW_AVAILABILITY,
    secondInterviewScreeningStatus: 'waiting',
    assignedInterviewDateLabel: '26. 03. 30(목)',
    assignedInterviewTime: '19:30 ~ 20:00',
    totalScore: null,
    interviewEvaluationRemark: '지원동기도 좋고, 교육 경험이 풍부함',
  },
  {
    id: 'park-seoyeon',
    name: '박서연',
    englishName: 'Park Seoyeon',
    grade: '2학년',
    regionKey: 'busan',
    mobile: '010-5521-9033',
    email: 'seoyeon.park@gmail.com',
    id1365: 'park_sy9033',
    gender: '여성',
    birthDate: '2002.01.08',
    age: 23,
    universityName: '**대학교',
    major: '국제통상학과 전공',
    applicationRoute: '링커리어',
    hasEducationExperience: true,
    applicationType: 'new',
    essayIntro:
      '부산 지역 초등 대상 경제교육 봉사에 참여하고자 지원했습니다. 지역 학생들과의 만남을 소중히 생각합니다.',
    essayEducationExperience:
      '방과후 교실 보조 강사 1년, 봉사 동아리 교육 멘토 활동이 있습니다.',
    essayNecessity:
      '지역별 경제 교육 격차를 줄이는 데 봉사자 역할이 중요하다고 생각합니다.',
    essayJaExperience: 'JA 프로그램 안내를 학교에서 들은 적이 있습니다.',
    scheduleChangeCancelCount: 0,
    adminComment: '',
    assignmentStatus: 'assignment_completed',
    totalAssignmentDays: 4,
    documentScreeningStatus: 'pass',
    managerAEvaluation: 'pass',
    managerBEvaluation: 'pass',
    interviewAssignmentStatus: 'assigned',
    interviewAvailability: [
      { dateLabel: '26. 03. 12(목)', slots: ['14:00 ~ 14:30'] },
    ],
    secondInterviewScreeningStatus: 'pass',
    assignedInterviewDateLabel: '26. 03. 12(목)',
    assignedInterviewTime: '14:00 ~ 14:30',
    totalScore: 88,
  },
  {
    id: 'choi-junho',
    name: '최준호',
    englishName: 'Choi Junho',
    grade: '4학년',
    regionKey: 'daejeon',
    mobile: '010-7788-2104',
    email: 'junho.choi@naver.com',
    id1365: 'choi_jh2104',
    gender: '남성',
    birthDate: '1999.11.30',
    age: 26,
    universityName: '**대학교',
    major: '금융학과 전공',
    applicationRoute: '올콘',
    hasEducationExperience: true,
    applicationType: 'ujat-graduate',
    previousUjatActivity: {
      term: '30',
      year: '2023',
      certificateFileName: '최준호_UJAT 30기 수료증.jpg',
    },
    essayIntro: '',
    essayEducationExperience: '',
    essayNecessity: '',
    essayJaExperience: '',
    scheduleChangeCancelCount: 0,
    adminComment: '',
    assignmentStatus: 'assignment_completed',
    totalAssignmentDays: 6,
    documentScreeningStatus: 'pass',
    managerAEvaluation: 'pass',
    managerBEvaluation: 'pass',
    interviewAssignmentStatus: 'assigned',
    interviewAvailability: [
      { dateLabel: '26. 03. 11(수)', slots: ['09:00 ~ 09:30', '15:00 ~ 15:30'] },
    ],
    secondInterviewScreeningStatus: 'pass',
    assignedInterviewDateLabel: '26. 03. 11(수)',
    assignedInterviewTime: '09:00 ~ 09:30',
    totalScore: 92,
  },
  {
    id: 'jung-haeun',
    name: '정하은',
    englishName: 'Jung Haeun',
    grade: '휴학생',
    regionKey: 'gwangju',
    mobile: '010-4412-8876',
    email: 'haeun.jung@naver.com',
    id1365: 'jung_he8876',
    gender: '여성',
    birthDate: '2000.05.03',
    age: 25,
    universityName: '**대학교',
    major: '교육학과 전공',
    applicationRoute: '캠퍼스픽',
    hasEducationExperience: false,
    applicationType: 'new',
    essayIntro:
      '휴학 기간을 활용해 사회 공헌 활동을 확대하고자 지원했습니다.',
    essayEducationExperience: '교육 관련 경험은 제한적이나, 학원 행정 보조 경험이 있습니다.',
    essayNecessity:
      '경제 교육은 학생들의 실생활 의사결정 능력을 키우는 데 필수적입니다.',
    essayJaExperience: '없음',
    scheduleChangeCancelCount: 0,
    adminComment: '',
    assignmentStatus: 'activity_abandoned',
    totalAssignmentDays: null,
    documentScreeningStatus: 'pass',
    managerAEvaluation: 'neutral',
    managerBEvaluation: 'fail',
    interviewAssignmentStatus: 'withdrawn',
    interviewAvailability: [
      { dateLabel: '26. 03. 18(화)', slots: ['10:00 ~ 10:30', '16:00 ~ 16:30'] },
      { dateLabel: '26. 03. 21(금)', slots: ['09:00 ~ 09:30'] },
    ],
  },
  {
    id: 'han-jiwoo',
    name: '한지우',
    englishName: 'Han Jiwoo',
    grade: '졸업유예',
    regionKey: 'incheon',
    mobile: '010-9033-1542',
    email: 'jiwoo.han@kakao.com',
    id1365: 'han_jw1542',
    gender: '남성',
    birthDate: '1999.08.19',
    age: 26,
    universityName: '**대학교',
    major: '통계학과 전공',
    applicationRoute: '기타',
    applicationRouteOther: 'JA Korea 홈페이지 검색',
    hasEducationExperience: true,
    applicationType: 'new',
    essayIntro:
      '졸업을 앞두고 의미 있는 봉사 활동을 찾아 지원했습니다.',
    essayEducationExperience:
      '대학 통계 튜터링 2학기, 고교 수학 멘토링 경험이 있습니다.',
    essayNecessity:
      '데이터 시대에 경제·금융 리터러시 교육의 필요성이 커지고 있습니다.',
    essayJaExperience: 'JA 경제 캠프 참가 경험이 있습니다.',
    scheduleChangeCancelCount: 0,
    adminComment: '',
    assignmentStatus: 'activity_abandoned',
    totalAssignmentDays: 2,
    documentScreeningStatus: 'pass',
    managerAEvaluation: 'fail',
    managerBEvaluation: 'neutral',
    interviewAssignmentStatus: 'withdrawn',
    interviewAvailability: [
      { dateLabel: '26. 03. 19(수)', slots: ['14:00 ~ 14:30', '15:00 ~ 15:30'] },
      { dateLabel: '26. 03. 22(토)', slots: ['09:00 ~ 09:30', '11:00 ~ 11:30'] },
    ],
  },
] as const

const PROFILE_BY_ID = new Map(
  UJAT_VOLUNTEER_MOCK_PROFILES.map(profile => [profile.id, profile])
)

const PROFILE_BY_NAME = new Map(
  UJAT_VOLUNTEER_MOCK_PROFILES.map(profile => [profile.name, profile])
)

const preferredRegionPatches = new Map<
  UjatVolunteerMockProfileId,
  { regionKey: UjatInstitutionApplicationRegionKey }
>()

function regionKeyFromPreferredRegionLabel(
  label: UjatVolunteerPreferredRegion
): UjatInstitutionApplicationRegionKey {
  const found = UJAT_INSTITUTION_APPLICATION_REGIONS.find(r => r.label === label)
  return found?.key ?? 'seoul'
}

function resolveVolunteerMockProfile(profile: UjatVolunteerMockProfile): UjatVolunteerMockProfile {
  const patch = preferredRegionPatches.get(profile.id)
  if (!patch) return profile
  return { ...profile, regionKey: patch.regionKey }
}

/** 희망 교육 활동 지역 수정(목 mock) — 목록·상세·신청 목록 동기화 */
export function patchUjatVolunteerMockProfilePreferredRegion(
  profileId: UjatVolunteerMockProfileId,
  preferredRegion: UjatVolunteerPreferredRegion
): void {
  preferredRegionPatches.set(profileId, {
    regionKey: regionKeyFromPreferredRegionLabel(preferredRegion),
  })
}

export function getUjatVolunteerMockProfilesResolved(): UjatVolunteerMockProfile[] {
  return UJAT_VOLUNTEER_MOCK_PROFILES.map(resolveVolunteerMockProfile)
}

export function getUjatVolunteerMockProfile(
  profileId: UjatVolunteerMockProfileId
): UjatVolunteerMockProfile | undefined {
  const base = PROFILE_BY_ID.get(profileId)
  return base ? resolveVolunteerMockProfile(base) : undefined
}

export function getUjatVolunteerMockProfileByName(name: string): UjatVolunteerMockProfile | undefined {
  const base = PROFILE_BY_NAME.get(name.trim())
  return base ? resolveVolunteerMockProfile(base) : undefined
}

export function regionLabelForVolunteerProfile(
  regionKey: UjatInstitutionApplicationRegionKey
): UjatVolunteerPreferredRegion {
  const label =
    UJAT_INSTITUTION_APPLICATION_REGIONS.find(r => r.key === regionKey)?.label ?? '서울'
  return label as UjatVolunteerPreferredRegion
}

export function buildUjatVolunteerApplicantId(
  programId: string,
  half: UjatVolunteerRecruitHalf,
  profileId: UjatVolunteerMockProfileId
): string {
  return `ujat-vol-${half}-${programId}-${profileId}`
}

export function buildUjatEducationProgressVolunteerRowId(
  half: EducationProgressHalfKey,
  profileId: UjatVolunteerMockProfileId
): string {
  return `${half}-vol-${profileId}`
}

export function parseEducationProgressVolunteerProfileId(
  volunteerRowId: string
): UjatVolunteerMockProfileId | null {
  const match = volunteerRowId.match(/^h[12]-vol-(.+)$/)
  const id = match?.[1]
  if (id && PROFILE_BY_ID.has(id as UjatVolunteerMockProfileId)) {
    return id as UjatVolunteerMockProfileId
  }
  return null
}

export function countVolunteerProfileInterviewSlots(
  days: UjatVolunteerMockInterviewAvailabilityDay[]
): number {
  return days.reduce((sum, day) => sum + day.slots.length, 0)
}
