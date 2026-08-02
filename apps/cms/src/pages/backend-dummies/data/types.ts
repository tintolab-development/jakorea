/**
 * `/backend-dummies` SSOT types.
 * Sync: menu-config LNB + OpenAPI v9 (2026-07-31 · 528 paths) + docs/api/be-handoff-program-dummy-seeds/
 * + programs-seed-case-api-coverage-backend-handoff-2026-07-30.md
 */

export type BackendDummyDomainId =
  | 'dashboard'
  | 'programs'
  | 'members'
  | 'settlement'
  | 'templates'
  | 'posts'
  | 'data'
  | 'notifications'
  | 'performance'
  | 'logs'

/** Leaf menu id under a domain tab */
export type BackendDummyCategoryId = string

/** FE capability when remote gate + JWT are satisfied */
export type IntegrationStatus = 'api-wired' | 'hybrid' | 'mock-only' | 'n-a'

export type SurfaceArea =
  | 'list-crud'
  | 'info'
  | 'applications'
  | 'progress'
  | 'nested'
  | 'survey'
  | 'managers'
  | 'other'

export type GapPriority = 'P0' | 'P1' | 'P2'

export type SsotConfidence = 'documented' | 'estimated'

export type GateKey =
  | 'programs'
  | 'applications'
  | 'programProgress'
  | 'ujatPrograms'
  | 'ujatEducationRegions'
  | 'geminiVisitingTraining'
  | 'geminiPerformance'
  | 'formsSurveys'
  | 'companySchoolOptIn'
  | 'trainedTeacherOptIn'
  | 'dashboard'
  | 'members'
  | 'instructorRoleRequests'
  | 'adminPermissions'
  | 'adminApprovalRequests'
  | 'paymentOrders'
  | 'accountPayments'
  | 'settlementConfigs'
  | 'notices'
  | 'faqs'
  | 'inquiries'
  | 'sponsors'
  | 'textbooks'
  | 'detailedPrograms'
  | 'notifications'
  | 'performanceRecords'
  | 'logs'

export interface BackendDummyDomain {
  id: BackendDummyDomainId
  label: string
  shortLabel: string
  gateKeys: GateKey[]
  description: string
}

export interface BackendDummyCategory {
  id: BackendDummyCategoryId
  domainId: BackendDummyDomainId
  label: string
  shortLabel: string
  /** CMS route / LNB path */
  lnbPath: string
  /** @deprecated use lnbPath — kept for older UI imports */
  programRoute: string
  menuLabel: string
  detailPct: number
  crudPct: number
  dummyPct: number
  gateKeys: GateKey[]
  listCrudStatus: IntegrationStatus
  applicationsStatus: IntegrationStatus
  progressNestedStatus: IntegrationStatus
  surveyManagersStatus: IntegrationStatus
  summary: string
  confidence?: SsotConfidence
}

export interface SurfaceRow {
  id: string
  categoryId: BackendDummyCategoryId
  area: SurfaceArea
  label: string
  status: IntegrationStatus
  getStatus: IntegrationStatus
  mutationStatus: IntegrationStatus
  weight?: number
  completionPct: number
  gateKeys: GateKey[]
  mockFiles: string[]
  apiPaths: string[]
  notes?: string
}

export interface SeedCaseRow {
  id: string
  categoryId: BackendDummyCategoryId
  caseCode: string
  beProgramId?: string
  feMockId?: string
  scenario: string
  opensLnbs: string[]
  needsChildSeed: boolean
  notes?: string
}

export interface GapRow {
  id: string
  categoryId: BackendDummyCategoryId
  priority: GapPriority
  title: string
  suggestedApi: string
  relatedCases?: string[]
}
