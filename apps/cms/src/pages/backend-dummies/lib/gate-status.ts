import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled, type RealApiModule } from '@/shared/config/real-api-modules'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { isCompanySchoolRemoteOptedIn } from '@/features/program/1c-1s/api/capabilities'
import { isTrainedTeacherRemoteOptedIn } from '@/features/program/trained-teachers/api/capabilities'
import type { GateKey } from '../data/types'

export interface GateChip {
  key: GateKey
  label: string
  enabled: boolean
}

function moduleOn(module: RealApiModule): boolean {
  return isRealApiModuleEnabled(module)
}

function resolveGate(key: GateKey): boolean {
  switch (key) {
    case 'companySchoolOptIn':
      return isCompanySchoolRemoteOptedIn() && moduleOn('programs')
    case 'trainedTeacherOptIn':
      return (
        moduleOn('programs') &&
        (isTrainedTeacherRemoteOptedIn() || moduleOn('trainedTeacherPrograms'))
      )
    default:
      return moduleOn(key as RealApiModule)
  }
}

const GATE_LABELS: Record<GateKey, string> = {
  programs: 'programs',
  applications: 'applications',
  programProgress: 'programProgress',
  ujatPrograms: 'ujatPrograms',
  ujatEducationRegions: 'ujatEducationRegions',
  geminiVisitingTraining: 'geminiVisitingTraining',
  geminiPerformance: 'geminiPerformance',
  formsSurveys: 'formsSurveys',
  companySchoolOptIn: 'COMPANY_SCHOOL opt-in',
  trainedTeacherOptIn: 'TRAINED_TEACHER opt-in',
  dashboard: 'dashboard',
  members: 'members',
  instructorRoleRequests: 'instructorRoleRequests',
  adminPermissions: 'adminPermissions',
  adminApprovalRequests: 'adminApprovalRequests',
  paymentOrders: 'paymentOrders',
  accountPayments: 'accountPayments',
  settlementConfigs: 'settlementConfigs',
  notices: 'notices',
  faqs: 'faqs',
  inquiries: 'inquiries',
  sponsors: 'sponsors',
  textbooks: 'textbooks',
  detailedPrograms: 'detailedPrograms',
  notifications: 'notifications',
  performanceRecords: 'performanceRecords',
  logs: 'logs',
}

export function getLiveGateSnapshot(gateKeys: readonly GateKey[]): {
  remoteConfigured: boolean
  hasJwt: boolean
  chips: GateChip[]
  allRequiredOn: boolean
  runtimeRemoteReady: boolean
} {
  const remoteConfigured = isRemoteApiConfigured()
  const hasJwt = hasRemoteAdminJwt()
  const chips = gateKeys.map(key => ({
    key,
    label: GATE_LABELS[key],
    enabled: remoteConfigured && resolveGate(key),
  }))
  const allRequiredOn = chips.length === 0 || chips.every(c => c.enabled)
  return {
    remoteConfigured,
    hasJwt,
    chips,
    allRequiredOn,
    runtimeRemoteReady: remoteConfigured && hasJwt && allRequiredOn,
  }
}

export function getActiveRealApiModuleList(): string[] {
  const raw = import.meta.env.VITE_REAL_API_MODULES
  if (raw === undefined || String(raw).trim() === '') return []
  return String(raw)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}
