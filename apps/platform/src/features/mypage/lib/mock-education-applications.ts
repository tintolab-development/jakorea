import type { EducationApplicationListItem } from '../model/education-application-types'
import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'

import type { EducationApplicationTab } from '../model/education-application-types'

export const EDUCATION_APPLICATION_TAB_ITEMS = [
  { key: 'all', label: '전체' },
  { key: 'applied', label: '신청한 프로그램' },
  { key: 'in_progress', label: '진행중인 프로그램' },
  { key: 'completed', label: '종료된 프로그램' },
] as const satisfies ReadonlyArray<{ key: EducationApplicationTab; label: string }>

/**
 * 교육현황 mock 신청 목록.
 * 취소 시 항목을 제거하며(이력 미잔존) 동일 배열 참조를 유지한다.
 */
export const MOCK_EDUCATION_APPLICATIONS: EducationApplicationListItem[] = [
  {
    id: 'edu-app-1',
    programId: 'gemini-prog-institution',
    categoryLabel: '청소년 · 청년',
    title: '2026년 한국씨티은행 - JA Korea 특별한 JOB담 모집 안내',
    recruitmentPeriodLabel: '2025.12.15 – 2026.02.15',
    operatingPeriodLabel: '2026.03.01 – 2026.06.30',
    recruitmentStatus: 'recruiting',
    educationTargetLabel: '고등학생',
    educationForm: 'online',
    educationFormLabel: '온라인',
    displayStatus: 'document_passed',
    hasInterview: true,
    interviewAtLabel: '2026년 04월 12일(일) 14시',
  },
  {
    id: 'edu-app-2',
    programId: 'gemini-prog-instructor',
    categoryLabel: '청소년 · 청년',
    title: '2026년 한국씨티은행 - JA Korea 특별한 JOB담 모집 안내',
    recruitmentPeriodLabel: '2025.12.15 – 2026.02.15',
    operatingPeriodLabel: '2026.03.01 – 2026.06.30',
    recruitmentStatus: 'closed',
    educationTargetLabel: '고등학생',
    educationForm: 'online',
    educationFormLabel: '온라인',
    displayStatus: 'waiting_result',
  },
  {
    id: 'edu-app-3',
    programId: 'gemini-prog-institution',
    categoryLabel: '청소년 · 청년',
    title: '2026년 한국씨티은행 - JA Korea 특별한 JOB담 모집 안내',
    recruitmentPeriodLabel: '2025.12.15 – 2026.02.15',
    operatingPeriodLabel: '2026.03.01 – 2026.06.30',
    recruitmentStatus: 'recruiting',
    educationTargetLabel: '고등학생',
    educationForm: 'offline',
    educationFormLabel: '오프라인',
    displayStatus: 'in_progress',
  },
  {
    id: 'edu-app-4',
    programId: 'gemini-prog-instructor',
    categoryLabel: '청소년 · 청년',
    title: '2026년 한국씨티은행 - JA Korea 특별한 JOB담 모집 안내',
    recruitmentPeriodLabel: '2025.12.15 – 2026.02.15',
    operatingPeriodLabel: '2026.03.01 – 2026.06.30',
    recruitmentStatus: 'closed',
    educationTargetLabel: '고등학생',
    educationForm: 'hybrid',
    educationFormLabel: '온/오프라인',
    displayStatus: 'completed',
  },
  {
    id: 'edu-app-5',
    programId: 'ujat-prog-volunteer',
    categoryLabel: '청소년 · 청년',
    title: '2026년 한국씨티은행 - JA Korea 특별한 JOB담 모집 안내',
    recruitmentPeriodLabel: '2025.12.15 – 2026.02.15',
    operatingPeriodLabel: '2026.03.01 – 2026.06.30',
    recruitmentStatus: 'closed',
    educationTargetLabel: '고등학생',
    educationForm: 'online',
    educationFormLabel: '온라인',
    displayStatus: 'withdrawn',
  },
  {
    id: 'edu-app-6',
    programId: 'gemini-prog-instructor',
    categoryLabel: '청소년 · 청년',
    title: '2026년 한국씨티은행 - JA Korea 특별한 JOB담 모집 안내',
    recruitmentPeriodLabel: '2025.12.15 – 2026.02.15',
    operatingPeriodLabel: '2026.03.01 – 2026.06.30',
    recruitmentStatus: 'closed',
    educationTargetLabel: '고등학생',
    educationForm: 'online',
    educationFormLabel: '온라인',
    displayStatus: 'rejected',
  },
  {
    id: 'edu-app-7',
    programId: 'gemini-prog-institution',
    categoryLabel: '기관 · 학교',
    title: '2026 JA Korea 경제교육 봉사 프로그램',
    recruitmentPeriodLabel: '2026.01.10 – 2026.03.10',
    operatingPeriodLabel: '2026.04.01 – 2026.07.31',
    recruitmentStatus: 'recruiting',
    educationTargetLabel: '중학생',
    educationForm: 'offline',
    educationFormLabel: '오프라인',
    displayStatus: 'waiting_result',
  },
  {
    id: 'edu-app-8',
    programId: 'trained-teachers-prog-001',
    categoryLabel: '강사 · 봉사자',
    title: '2026 JA Korea UJAT 봉사자 모집',
    recruitmentPeriodLabel: '2025.11.01 – 2026.01.31',
    operatingPeriodLabel: '2026.02.15 – 2026.05.15',
    recruitmentStatus: 'recruiting',
    educationTargetLabel: '대학생',
    educationForm: 'hybrid',
    educationFormLabel: '온/오프라인',
    displayStatus: 'in_progress',
  },
  {
    id: 'edu-app-9',
    programId: 'ujat-prog-volunteer',
    categoryLabel: '청소년 · 청년',
    title: '2026 JA Korea 청소년 금융교육 캠프',
    recruitmentPeriodLabel: '2026.02.01 – 2026.03.31',
    operatingPeriodLabel: '2026.04.15 – 2026.05.15',
    recruitmentStatus: 'scheduled',
    educationTargetLabel: '고등학생',
    educationForm: 'offline',
    educationFormLabel: '오프라인',
    displayStatus: 'waiting_result',
  },
  {
    id: 'edu-app-10',
    programId: 'gemini-prog-institution',
    categoryLabel: '청소년 · 청년',
    title: '2026 JA Korea 창업 캠프',
    recruitmentPeriodLabel: '2026.01.05 – 2026.02.28',
    operatingPeriodLabel: '2026.03.10 – 2026.06.10',
    recruitmentStatus: 'recruiting',
    educationTargetLabel: '고등학생',
    educationForm: 'online',
    educationFormLabel: '온라인',
    displayStatus: 'document_passed',
  },
  {
    id: 'edu-app-11',
    programId: 'gemini-prog-instructor',
    categoryLabel: '청소년 · 청년',
    title: '2025 JA Korea 겨울 특강',
    recruitmentPeriodLabel: '2025.10.01 – 2025.11.30',
    operatingPeriodLabel: '2025.12.01 – 2025.12.20',
    recruitmentStatus: 'closed',
    educationTargetLabel: '고등학생',
    educationForm: 'online',
    educationFormLabel: '온라인',
    displayStatus: 'completed',
  },
]

const listeners = new Set<() => void>()
let mockEducationApplicationsVersion = 0

function emitMockEducationApplicationsChange() {
  mockEducationApplicationsVersion += 1
  listeners.forEach(listener => listener())
}

export function getMockEducationApplications(): EducationApplicationListItem[] {
  if (!shouldUsePlatformMockData()) return []
  return MOCK_EDUCATION_APPLICATIONS
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
  return MOCK_EDUCATION_APPLICATIONS.find(item => item.id === applicationId)
}

/**
 * 신청 취소 — 목록에서 제거(이력 남지 않음). mock only.
 * @returns 제거 성공 여부
 */
export function cancelMockEducationApplication(applicationId: string): boolean {
  const index = MOCK_EDUCATION_APPLICATIONS.findIndex(item => item.id === applicationId)
  if (index < 0) {
    return false
  }
  MOCK_EDUCATION_APPLICATIONS.splice(index, 1)
  emitMockEducationApplicationsChange()
  return true
}
