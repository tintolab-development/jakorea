import type {
  EducationApplicationListItem,
  EducationApplicationTab,
  EducationDisplayStatus,
  EducationTeacherApplicationContent,
  EducationTeacherApplicationGuidance,
} from '../model/types'
import {
  ECONOMY_INSTRUCTOR_STATUS_IDS,
  GENERAL_INSTRUCTOR_STATUS_IDS,
  GENERAL_VOLUNTEER_STATUS_IDS,
  getMockProgramById,
  getMockPrograms,
  type ProgramListItem,
} from '@/features/program'
import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'

export const EDUCATION_APPLICATION_TAB_ITEMS = [
  { key: 'all', label: '전체' },
  { key: 'applied', label: '신청한 프로그램' },
  { key: 'in_progress', label: '진행중인 프로그램' },
  { key: 'completed', label: '종료된 프로그램' },
] as const satisfies ReadonlyArray<{ key: EducationApplicationTab; label: string }>

/** 30건 시드에 6상태를 고르게 배정 — 탭(신청/진행/종료)이 비지 않게 */
const DISPLAY_STATUS_CYCLE: readonly EducationDisplayStatus[] = [
  'waiting_result',
  'document_passed',
  'in_progress',
  'completed',
  'withdrawn',
  'rejected',
]

const cancelledApplicationIds = new Set<string>()

const MOCK_SELF_INTRO_MOTIVATION =
  '저는 경제와 금융에 관심이 많아 JA Korea 프로그램에 지원하게 되었습니다. 이번 교육을 통해 실무에 가까운 경험을 쌓고, 앞으로의 진로를 구체화하는 데 도움이 되고 싶습니다. 성실히 참여하며 배운 내용을 주변에 나누는 역할도 해보고 싶습니다.'

const MOCK_PREFERRED_EDUCATION_SCHEDULE = '2026년 04월 20일(월) 9:30 ~ 12:20'

/** 교사회원 상세 UI 확인용 — 승인 대기 교육 신청 1건에 시드 */
const MOCK_TEACHER_CONSENTS = [
  {
    id: 'sex-offense',
    title: '성범죄 경력 조회 동의서',
    fileUrl: '#',
  },
  {
    id: 'admin-joint',
    title: '행정정보공동이용사전동의서',
    fileUrl: '#',
  },
] as const

/** 교사회원 신청 내용 탭 — 스크린샷 문구 시드 */
function createMockTeacherApplicationContent(): EducationTeacherApplicationContent {
  return {
    institution: {
      name: '진월초등학교',
      grade: '2학년',
      address: '광주광역시 남구 광복마을 4길 40',
      addressDetail: '광주광역시 남구 광복마을 4길 40',
      classAndHeadcount: '1개 학급 | 총 25명',
      preferredEducationForm: '온라인',
      venue: '광주광역시 남구 광복마을 4길 401',
      teacherContact: '홍길동 | 02-123-4567 | 010-6691-7145 | ti***@naver.com',
      reason: '신청 사유가 들어갑니다.',
      otherRequests: '기타 요청사항이 들어갑니다.',
    },
    guidance: {
      computerInRoom: '1대 사용 가능, USB는 사용 불가합니다.',
      waitingPlace:
        '후관 2층 1-4옆 강사대기실(늘봄교실1)에서 대기, 정수기는 후관 2층 2학년 연구실 이용하시면 됩니다.',
      meal: '가능',
      otherNotes:
        "본교 주차장이 협소한 관계로 학교 바로 옆 '운남동 공영주차장' 이용 부탁드립니다!",
      sexOffenseConsentMethod: '온라인 제출 | ID: tinto | 검증번호: 940412',
    },
    preferredSchedules: [
      {
        id: 'schedule-1',
        label: '진행 희망 교육 일정 1',
        value: '2026년 04월 20일(월) | 1차시',
      },
      {
        id: 'schedule-2',
        label: '진행 희망 교육 일정 2',
        value: '2026년 04월 20일(월) | 1차시',
      },
    ],
  }
}

/** 안내사항 수정 — mock 로컬 스냅샷 */
const teacherGuidanceOverrides = new Map<string, EducationTeacherApplicationGuidance>()

export function updateMockTeacherApplicationGuidance(
  applicationId: string,
  guidance: EducationTeacherApplicationGuidance,
): void {
  if (!shouldUsePlatformMockData()) return
  teacherGuidanceOverrides.set(applicationId, { ...guidance })
  emitMockEducationApplicationsChange()
}

const MOCK_TEACHER_ASSIGNMENT: NonNullable<EducationApplicationListItem['teacherAssignment']> = {
  textbook: {
    title: '성공하는 경제생활 성공하는',
    kitCountLabel: '6키트',
    volumeCountLabel: '144권',
    deliveryStatus: 'before',
  },
  instructors: [
    {
      id: 'instructor-1',
      name: '김땡땡',
      consentDocumentsRequested: true,
      consents: [...MOCK_TEACHER_CONSENTS],
    },
    {
      id: 'instructor-2',
      name: '이선생',
      consentDocumentsRequested: true,
      consents: [...MOCK_TEACHER_CONSENTS],
    },
    {
      id: 'instructor-3',
      name: '박강사',
      consentDocumentsRequested: false,
    },
    {
      id: 'instructor-4',
      name: '최멘토',
      consentDocumentsRequested: true,
      consents: [...MOCK_TEACHER_CONSENTS],
    },
    {
      id: 'instructor-5',
      name: '정선생',
      consentDocumentsRequested: false,
    },
    {
      id: 'instructor-6',
      name: '한강사',
      consentDocumentsRequested: true,
      consents: [...MOCK_TEACHER_CONSENTS],
    },
    {
      id: 'instructor-7',
      name: '오멘토',
      consentDocumentsRequested: false,
    },
    {
      id: 'instructor-8',
      name: '윤선생',
      consentDocumentsRequested: true,
      consents: [...MOCK_TEACHER_CONSENTS],
    },
  ],
}

const VOLUNTEER_DISPLAY_STATUS_BY_PROGRAM_ID: Record<string, EducationDisplayStatus> = {
  [GENERAL_VOLUNTEER_STATUS_IDS.orgApplied]: 'waiting_result',
  [GENERAL_VOLUNTEER_STATUS_IDS.orgProgress]: 'in_progress',
  [GENERAL_VOLUNTEER_STATUS_IDS.orgDone]: 'completed',
  [GENERAL_VOLUNTEER_STATUS_IDS.orgWithdrawn]: 'withdrawn',
  [GENERAL_VOLUNTEER_STATUS_IDS.indApplied]: 'document_passed',
  [GENERAL_VOLUNTEER_STATUS_IDS.indProgress]: 'in_progress',
  [GENERAL_VOLUNTEER_STATUS_IDS.indDone]: 'completed',
  [GENERAL_VOLUNTEER_STATUS_IDS.indRejected]: 'rejected',
}

/** 강의현황 mock — 프로그램의 lifecycleStatus는 role 판정용 고정값(recruiting_instructors)만 쓰고, 표시 상태는 여기서 별도 오버라이드 */
const INSTRUCTOR_DISPLAY_STATUS_BY_PROGRAM_ID: Record<string, EducationDisplayStatus> = {
  [GENERAL_INSTRUCTOR_STATUS_IDS.applied]: 'waiting_result',
  [GENERAL_INSTRUCTOR_STATUS_IDS.progress]: 'in_progress',
  [GENERAL_INSTRUCTOR_STATUS_IDS.done]: 'completed',
  [GENERAL_INSTRUCTOR_STATUS_IDS.rejected]: 'rejected',
  [ECONOMY_INSTRUCTOR_STATUS_IDS.progress]: 'in_progress',
  [ECONOMY_INSTRUCTOR_STATUS_IDS.done]: 'completed',
}

const ROLE_DISPLAY_STATUS_BY_PROGRAM_ID: Record<string, EducationDisplayStatus> = {
  ...VOLUNTEER_DISPLAY_STATUS_BY_PROGRAM_ID,
  ...INSTRUCTOR_DISPLAY_STATUS_BY_PROGRAM_ID,
}

function educationApplicationId(programId: string) {
  return `edu-app:${programId}`
}

function toEducationApplication(
  program: ProgramListItem,
  index: number,
): EducationApplicationListItem {
  const detail = getMockProgramById(program.id)
  const displayStatus =
    ROLE_DISPLAY_STATUS_BY_PROGRAM_ID[program.id] ??
    DISPLAY_STATUS_CYCLE[index % DISPLAY_STATUS_CYCLE.length]!
  const item: EducationApplicationListItem = {
    id: educationApplicationId(program.id),
    programId: program.id,
    categoryLabel: program.categoryLabel,
    title: program.title,
    recruitmentPeriodLabel: program.recruitmentPeriodLabel,
    operatingPeriodLabel: program.operatingPeriodLabel,
    recruitmentStatus: program.recruitmentStatus,
    educationTargetLabel: program.educationTargetLabel,
    educationForm: program.educationForm,
    educationFormLabel: program.educationFormLabel,
    thumbnailUrl: program.thumbnailUrl,
    displayStatus,
    detailCase: detail?.detailCase ?? 'general',
  }

  if (displayStatus === 'document_passed') {
    item.hasInterview = true
    item.interviewAtLabel = '2026년 04월 12일(일) 14시'
  }

  if (displayStatus === 'withdrawn') {
    if (program.id === GENERAL_VOLUNTEER_STATUS_IDS.orgWithdrawn) {
      item.withdrawalPhase = 'during_education'
      item.lastParticipatedSession = 3
    } else {
      const withdrawnWave = Math.floor(index / DISPLAY_STATUS_CYCLE.length)
      item.withdrawalPhase =
        withdrawnWave % 2 === 0 ? 'before_education' : 'during_education'
      if (item.withdrawalPhase === 'during_education') {
        item.lastParticipatedSession = 3
      }
    }
    item.selfIntroMotivation = MOCK_SELF_INTRO_MOTIVATION
    item.preferredEducationScheduleLabel = MOCK_PREFERRED_EDUCATION_SCHEDULE
  }

  if (
    displayStatus === 'waiting_result' ||
    displayStatus === 'document_passed' ||
    displayStatus === 'in_progress' ||
    displayStatus === 'completed'
  ) {
    item.selfIntroMotivation = MOCK_SELF_INTRO_MOTIVATION
    item.preferredEducationScheduleLabel = MOCK_PREFERRED_EDUCATION_SCHEDULE
  }

  return item
}

const TEACHER_APPLICATION_CONTENT_STATUSES: ReadonlySet<EducationDisplayStatus> = new Set([
  'waiting_result',
  'document_passed',
  'rejected',
  'withdrawn',
])

function buildEducationApplications(): EducationApplicationListItem[] {
  let teacherAssignmentSeededWaiting = false
  let teacherAssignmentSeededProgress = false
  return getMockPrograms()
    .map((program, index) => {
      const item = toEducationApplication(program, index)
      const isGeneralNonVolunteer =
        item.detailCase === 'general' && !(program.id in VOLUNTEER_DISPLAY_STATUS_BY_PROGRAM_ID)

      if (
        !teacherAssignmentSeededWaiting &&
        item.displayStatus === 'waiting_result' &&
        isGeneralNonVolunteer
      ) {
        item.teacherAssignment = MOCK_TEACHER_ASSIGNMENT
        teacherAssignmentSeededWaiting = true
      } else if (
        !teacherAssignmentSeededProgress &&
        item.displayStatus === 'in_progress' &&
        isGeneralNonVolunteer
      ) {
        item.teacherAssignment = {
          ...MOCK_TEACHER_ASSIGNMENT,
          textbook: {
            ...MOCK_TEACHER_ASSIGNMENT.textbook!,
            deliveryStatus: 'shipping',
          },
        }
        teacherAssignmentSeededProgress = true
      }

      if (isGeneralNonVolunteer && TEACHER_APPLICATION_CONTENT_STATUSES.has(item.displayStatus)) {
        const content = createMockTeacherApplicationContent()
        const guidanceOverride = teacherGuidanceOverrides.get(item.id)
        if (guidanceOverride) {
          content.guidance = { ...guidanceOverride }
        }
        item.teacherApplicationContent = content
      }
      return item
    })
    .filter(item => !cancelledApplicationIds.has(item.id))
}

/**
 * 프로그램 30건 시드와 동일 카탈로그.
 * 취소 시 항목을 제거하며(이력 미잔존) 구독자에게 알린다.
 */
export const MOCK_EDUCATION_APPLICATIONS: EducationApplicationListItem[] = []

function syncExportedApplications(items: EducationApplicationListItem[]) {
  MOCK_EDUCATION_APPLICATIONS.length = 0
  MOCK_EDUCATION_APPLICATIONS.push(...items)
}

const listeners = new Set<() => void>()
let mockEducationApplicationsVersion = 0

function emitMockEducationApplicationsChange() {
  mockEducationApplicationsVersion += 1
  listeners.forEach(listener => listener())
}

export function getMockEducationApplications(): EducationApplicationListItem[] {
  if (!shouldUsePlatformMockData()) {
    syncExportedApplications([])
    return []
  }
  const items = buildEducationApplications()
  syncExportedApplications(items)
  return items
}

/** useSyncExternalStore용 — 취소 등 변경 시 증가 */
export function getMockEducationApplicationsVersion(): number {
  return mockEducationApplicationsVersion
}

export function subscribeMockEducationApplications(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function getMockEducationApplicationById(
  applicationId: string,
): EducationApplicationListItem | undefined {
  if (!shouldUsePlatformMockData()) return undefined
  return buildEducationApplications().find(item => item.id === applicationId)
}

/**
 * 신청 취소 — 목록에서 제거(이력 남지 않음). mock only.
 * @returns 제거 성공 여부
 */
export function cancelMockEducationApplication(applicationId: string): boolean {
  if (!shouldUsePlatformMockData()) return false
  const exists = buildEducationApplications().some(item => item.id === applicationId)
  if (!exists) {
    return false
  }
  cancelledApplicationIds.add(applicationId)
  emitMockEducationApplicationsChange()
  return true
}
