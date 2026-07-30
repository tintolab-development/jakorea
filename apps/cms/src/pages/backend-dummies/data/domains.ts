import type { BackendDummyDomain, BackendDummyDomainId, GateKey } from './types'

export const BACKEND_DUMMY_DOMAINS: readonly BackendDummyDomain[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    shortLabel: '대시보드',
    gateKeys: ['dashboard'],
    description: '대시보드 홈 위젯·일정·필터',
  },
  {
    id: 'programs',
    label: '프로그램 관리',
    shortLabel: '프로그램',
    gateKeys: [
      'programs',
      'applications',
      'programProgress',
      'ujatPrograms',
      'ujatEducationRegions',
      'geminiVisitingTraining',
      'geminiPerformance',
      'companySchoolOptIn',
      'trainedTeacherOptIn',
      'formsSurveys',
    ],
    description: '일반·1사1교·UJAT·Gemini·교육받은 교사',
  },
  {
    id: 'members',
    label: '회원 관리',
    shortLabel: '회원',
    gateKeys: ['members', 'instructorRoleRequests', 'adminPermissions', 'adminApprovalRequests', 'logs'],
    description: '회원 목록·권한 승인·관리자 권한',
  },
  {
    id: 'settlement',
    label: '정산 관리',
    shortLabel: '정산',
    gateKeys: ['paymentOrders', 'accountPayments', 'settlementConfigs'],
    description: '지급조서·계좌 지급·정산 항목',
  },
  {
    id: 'templates',
    label: '템플릿 관리',
    shortLabel: '템플릿',
    gateKeys: ['formsSurveys'],
    description: '양식·설문 템플릿',
  },
  {
    id: 'posts',
    label: '게시글 관리',
    shortLabel: '게시글',
    gateKeys: ['notices', 'faqs', 'inquiries'],
    description: '공지·FAQ·문의 (mock fallback 없음)',
  },
  {
    id: 'data',
    label: '데이터 관리',
    shortLabel: '데이터',
    gateKeys: ['sponsors', 'textbooks', 'detailedPrograms'],
    description: '후원사·교재·세부 프로그램',
  },
  {
    id: 'notifications',
    label: '알림 메시지',
    shortLabel: '알림',
    gateKeys: ['notifications'],
    description: '카카오 알림톡·메일&문자 (SSOT estimated)',
  },
  {
    id: 'performance',
    label: '실적 관리',
    shortLabel: '실적',
    gateKeys: ['performanceRecords'],
    description: '/education-records — Gemini 실적과 별도',
  },
  {
    id: 'logs',
    label: '로그 관리',
    shortLabel: '로그',
    gateKeys: ['logs'],
    description: '다운로드·개인정보·버그 이력 (mock fallback 없음)',
  },
] as const

export const DEFAULT_DOMAIN_TAB: BackendDummyDomainId = 'programs'

export function getBackendDummyDomain(id: string) {
  return BACKEND_DUMMY_DOMAINS.find(d => d.id === id)
}

export function isBackendDummyDomainId(id: string): id is BackendDummyDomainId {
  return BACKEND_DUMMY_DOMAINS.some(d => d.id === id)
}

export function collectAllDomainGateKeys(): GateKey[] {
  const set = new Set<GateKey>()
  for (const d of BACKEND_DUMMY_DOMAINS) {
    for (const k of d.gateKeys) set.add(k)
  }
  return [...set]
}
