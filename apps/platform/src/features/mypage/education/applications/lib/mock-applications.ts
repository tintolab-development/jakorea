import type {
  EducationApplicationListItem,
  EducationApplicationTab,
  EducationDisplayStatus,
} from '../model/types'
import { getMockPrograms, type ProgramListItem } from '@/features/program'
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

function educationApplicationId(programId: string) {
  return `edu-app:${programId}`
}

function toEducationApplication(
  program: ProgramListItem,
  index: number,
): EducationApplicationListItem {
  const displayStatus = DISPLAY_STATUS_CYCLE[index % DISPLAY_STATUS_CYCLE.length]!
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
  }

  if (displayStatus === 'document_passed') {
    item.hasInterview = true
    item.interviewAtLabel = '2026년 04월 12일(일) 14시'
  }

  if (displayStatus === 'withdrawn') {
    const withdrawnWave = Math.floor(index / DISPLAY_STATUS_CYCLE.length)
    item.withdrawalPhase =
      withdrawnWave % 2 === 0 ? 'before_education' : 'during_education'
    if (item.withdrawalPhase === 'during_education') {
      item.lastParticipatedSession = 3
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

function buildEducationApplications(): EducationApplicationListItem[] {
  return getMockPrograms()
    .map((program, index) => toEducationApplication(program, index))
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
